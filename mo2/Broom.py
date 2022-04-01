import mobase

import pathlib
import fnmatch
import time
import os
import re


from PyQt5.QtCore import (
    QCoreApplication,
    QThread,
    Qt,
    pyqtSignal,
)
from PyQt5.QtGui import QIcon
from PyQt5.QtWidgets import QDialog, QHBoxLayout, QPushButton, QVBoxLayout
from PyQt5.QtWidgets import QPlainTextEdit


class BroomFileThread(QThread):
    fileSignal = pyqtSignal()
    fileErrorSignal = pyqtSignal(str)

    def __init__(self, organizer, fileList, plugname):
        super().__init__()
        self.__organizer = organizer
        self.__fileList = fileList
        self.__deleteOption = bool(self.__organizer.pluginSetting(plugname, "delete_files"))
        self.__unhideOption = bool(self.__organizer.pluginSetting(plugname, "unhide"))
        self.__modsDir = pathlib.Path(self.__organizer.modsPath())

    def run(self):
        try:
            for file in self.__fileList:
                if self.isParentDir(pathlib.Path(file), self.__modsDir):
                    if self.__deleteOption:
                        pathlib.Path(file).unlink()
                    else:
                        if self.__unhideOption:
                            p = pathlib.Path(file)
                            p.rename(re.sub("\\.mohidden$", "", p.__str__()))
                        else:
                            p = pathlib.Path(file)
                            p.rename(p.__str__() + ".mohidden")
                else:
                    self.fileErrorSignal.emit("Attempted to process a file outside the mods directory.")
                    return
        except Exception as e:
            self.fileErrorSignal.emit(e.__str__())
            return

        self.fileSignal.emit()

    def isParentDir(self, child, parent):
        for path in child.parents:
            if path.samefile(parent):
                return True
        return False


class BroomSearchThread(QThread):
    rulesSignal = pyqtSignal(str)
    matchSignal = pyqtSignal(list)
    doneSignal = pyqtSignal()
    errorSignal = pyqtSignal(str)
    debugSignal = pyqtSignal(str)

    def __init__(self, organizer, plugname):
        super().__init__()
        self.__organizer = organizer
        self.__deleteOption = bool(self.__organizer.pluginSetting(plugname, "delete_files"))
        self.__unhideOption = bool(self.__organizer.pluginSetting(plugname, "unhide"))

    def findFiles(self, path, patternList, skipPattern, output):
        for entry in os.scandir(path):
            if entry.is_dir(follow_symlinks=False):
                self.findFiles(entry.path, patternList, skipPattern, output)
            else:
                for pattern in patternList:
                    if not pattern["inclusive"]:
                        if re.search(pattern["value"], entry.path, re.IGNORECASE) and entry.path in output:
                            output.remove(entry.path)
                    else:
                        if re.search(pattern["value"], entry.path, re.IGNORECASE) and entry.path not in output:
                            if skipPattern and re.search(skipPattern, entry.path, re.IGNORECASE):
                                pass
                            else:
                                output.append(entry.path)

    def run(self):
        modsDir = self.__organizer.modsPath()
        modList = self.__organizer.modList()
        modsDirPath = pathlib.Path(modsDir)
        globalRules = ""

        for mod in modList.allModsByProfilePriority():
            if modList.state(mod) & mobase.ModState.active == 0:
                continue

            broomFiles = []
            modPath = modsDirPath.joinpath(mod)
            if modPath.is_dir():
                self.findFiles(modPath, [{"inclusive": True, "value": "\\.broom(\\.mohidden)?$"}], None, broomFiles)
            for broomFilePath in broomFiles:
                with open(broomFilePath) as broomFile:
                    globalRules += broomFile.read() + "\n"

        # remove trailing spaces, blank and commented lines
        globalRules = "\n".join(
            filter(lambda x: len(x) > 0, filter(lambda x: not x.startswith("#"), map(lambda x: x.strip(), globalRules.splitlines())))
        )

        globalRulesList = globalRules.splitlines()

        if self.__unhideOption and not self.__deleteOption:
            for i, pattern in enumerate(globalRulesList):
                globalRulesList[i] = pattern + ".mohidden"

        self.rulesSignal.emit(globalRules)

        beginTime = time.time()

        skipPattern = "\\.mohidden$"
        if self.__deleteOption or self.__unhideOption:
            skipPattern = None

        exclusionPattern = "!"

        # translate glob rules to regular expressions
        globalRulesTranslated = []
        for rule in globalRulesList:
            if rule.startswith(exclusionPattern):
                globalRulesTranslated.append({"inclusive": False, "value": fnmatch.translate(rule[len(exclusionPattern) :])})
            else:
                globalRulesTranslated.append({"inclusive": True, "value": fnmatch.translate(rule)})

        for mod in modList.allModsByProfilePriority():
            filesToSweep = []
            modPath = modsDirPath.joinpath(mod)
            if modPath.is_dir():
                self.findFiles(modPath, globalRulesTranslated, skipPattern, filesToSweep)
                if len(filesToSweep) > 0:
                    self.matchSignal.emit(filesToSweep)

        self.debugSignal.emit("Execution time " + str(time.time() - beginTime))

        self.doneSignal.emit()


class BroomWindow(QDialog):
    def __init__(self, parent, organizer, name):
        QDialog.__init__(self, parent, Qt.WindowSystemMenuHint | Qt.WindowTitleHint | Qt.WindowCloseButtonHint)

        self.__organizer = organizer
        self.__name = name
        self.__matchedFiles = []
        self.__rules = ""

        self.setWindowTitle(name)
        self.setModal(False)
        self.resize(800, 600)

        self.findButton = QPushButton(self.__tr("Find Files"), self)
        self.findButton.setGeometry(10, 10, 100, 30)
        self.findButton.clicked.connect(self.findButtonHandler)

        self.cleanButton = QPushButton(self.__tr("Hide Files"), self)
        self.cleanButton.setGeometry(10, 10, 100, 30)
        self.cleanButton.clicked.connect(self.cleanButtonHandler)
        self.cleanButton.setEnabled(False)

        self.__deleteOption = bool(self.__organizer.pluginSetting(self.__name, "delete_files"))
        self.__unhideOption = bool(self.__organizer.pluginSetting(self.__name, "unhide"))
        if self.__deleteOption:
            self.cleanButton.setText(self.__tr("Delete Files"))
        elif self.__unhideOption:
            self.cleanButton.setText(self.__tr("Un-hide Files"))

        self.textarea = QPlainTextEdit(self)
        self.textarea.setReadOnly(True)

        layout1 = QVBoxLayout()
        layout2 = QHBoxLayout()
        layout2.addWidget(self.findButton)
        layout2.addWidget(self.cleanButton)
        layout1.addLayout(layout2)
        layout1.addWidget(self.textarea)
        self.setLayout(layout1)

    def findButtonHandler(self):
        self.__matchedFiles = []
        self.textarea.setPlainText("")
        self.textarea.appendHtml("<b style='color:blue'>" + self.__tr("Searching for rule configuration files...") + "</b><br>")
        self.cleanButton.setEnabled(False)

        self.searchThread = BroomSearchThread(self.__organizer, self.__name)
        self.searchThread.rulesSignal.connect(self.rulesSignalHandler)
        self.searchThread.matchSignal.connect(self.matchSignalHandler)
        self.searchThread.doneSignal.connect(self.doneSignalHandler)
        self.searchThread.errorSignal.connect(self.errorSignalHandler)
        self.searchThread.debugSignal.connect(self.debugSignalHandler)
        self.searchThread.start()

    def rulesSignalHandler(self, value):
        self.__rules = value

        if len(self.__rules) == 0:
            self.textarea.appendPlainText(self.__tr("No rules found. Make sure your Broom rules are properly installed as mods.") + "\n")
            return
        else:
            self.textarea.appendHtml("<b style='color:blue'>" + self.__tr("Rules found:") + "</b><br>")
            self.textarea.appendPlainText(value)

        self.textarea.appendHtml("<br><b style='color:blue'>" + self.__tr("Scanning modlist for files...") + "</b><br>")

    def matchSignalHandler(self, values):
        for v in values:
            self.__matchedFiles.append(v)
            self.textarea.appendPlainText(v.__str__())

    def doneSignalHandler(self):
        if len(self.__matchedFiles) == 0:
            self.textarea.appendPlainText(self.__tr("No files found."))
            return

        doneMsg = ""
        if self.__deleteOption:
            doneMsg = self.__tr("Done. Press the Delete Files button to complete the operation and delete the above files.")
        elif self.__unhideOption:
            doneMsg = self.__tr("Done. Press the Un-hide Files button to complete the operation and restore the above files.")
        else:
            doneMsg = self.__tr("Done. Press the Hide Files button to complete the operation and hide the above files.")

        self.textarea.appendHtml("<br><b style='color:crimson;'>" + doneMsg + "</b><br>")

        self.cleanButton.setEnabled(True)

    def errorSignalHandler(self, msg):
        self.textarea.appendPlainText(msg)

    def cleanButtonHandler(self):
        actionMsg = ""
        if self.__deleteOption:
            actionMsg = self.__tr("Deleting files...")
        elif self.__unhideOption:
            actionMsg = self.__tr("Restoring files...")
        else:
            actionMsg = self.__tr("Hiding files...")

        self.textarea.appendHtml("<b style='color:blue'>" + actionMsg + "</b><br>")

        self.fileThread = BroomFileThread(self.__organizer, self.__matchedFiles, self.__name)
        self.fileThread.fileSignal.connect(self.fileSignalHandler)
        self.fileThread.fileErrorSignal.connect(self.fileErrorSignalHandler)
        self.fileThread.start()

    def fileSignalHandler(self):
        outcomeMsg = ""
        if self.__deleteOption:
            outcomeMsg = self.__tr("were deleted")
        elif self.__unhideOption:
            outcomeMsg = self.__tr("were restored")
        else:
            outcomeMsg = self.__tr("were hidden")

        self.textarea.appendPlainText(len(self.__matchedFiles).__str__() + self.__tr(" files ") + outcomeMsg)

        self.cleanButton.setEnabled(False)

        if len(self.__matchedFiles):
            self.__organizer.refresh(True)

    def fileErrorSignalHandler(self, msg):
        self.textarea.appendPlainText(msg)
        self.cleanButton.setEnabled(False)

    def debugSignalHandler(self, msg):
        pass

    def __tr(self, str):
        return QCoreApplication.translate("Broom", str)


class BroomTool(mobase.IPluginTool):
    def __init__(self):
        super(BroomTool, self).__init__()
        self.__organizer = None
        self.__parentWidget = None

    def init(self, organizer):
        self.__organizer = organizer
        return True

    def name(self):
        return "Broom - The Loose File Sweeper"

    def localizedName(self):
        return self.__tr("Broom - The Loose File Sweeper")

    def author(self):
        return "mihaifm"

    def description(self):
        return self.__tr("Hide or delete loose files based on a configuration in your mod list")

    def version(self):
        return mobase.VersionInfo(1, 0, 0, 0)

    def requirements(self):
        return []

    def displayName(self):
        return self.__tr("Broom")

    def tooltip(self):
        return self.__tr("Hide or delete loose files based on a configuration in your mod list")

    def settings(self):
        return [
            mobase.PluginSetting("delete_files", self.__tr("Delete matched files instead of hiding them"), False),
            mobase.PluginSetting("unhide", self.__tr("Un-hide matching files"), False),
        ]

    def icon(self):
        return QIcon("")

    def setParentWidget(self, widget):
        self.__parentWidget = widget

    def display(self):
        broomWindow = BroomWindow(self.__parentWidget, self.__organizer, self.name())
        broomWindow.show()

    def __tr(self, str):
        return QCoreApplication.translate("Broom", str)


def createPlugin():
    return BroomTool()
