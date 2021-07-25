import React from 'react';
import { ComponentEx, Modal, types, util, fs, selectors } from 'vortex-api';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import { setOpenBroomDialog, addBroomMessages, clearBroomMessages, setBroomMatchedFiles } from '../actions/session';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import * as pathlib from 'path';

const globrex = require('../util/globrex');

interface IBaseProps {
}

interface IActionProps {
    onSetOpen: (open: boolean) => void;
    onAddMessages: (msgList: string[]) => void;
    onClearMessages: () => void;
    onSetMatchedFiles: (pathList: string[]) => void;
}

interface IComponentState {
    cleanButtonDisabled: boolean;
}

interface IConnectedProps {
    open: boolean;
    messages: string[];
    stagingPath: string | null;
    enabledMods: types.IMod[];
    deleteOption: boolean;
    unhideOption: boolean;
    matchedFiles: string[];
}

type IProps = IBaseProps & IConnectedProps & IActionProps;

class BroomDialog extends ComponentEx<IProps, IComponentState> {
    constructor(props: IProps) {
        super(props);

        this.initState({
            cleanButtonDisabled: true
        })
    }

    render(): JSX.Element {
        const { t, open, messages } = this.props
        const { cleanButtonDisabled } = this.state

        const styleObj = {
            userSelect: 'text'
        } as React.CSSProperties;

        var cleanButtonTitle = "Hide Files";
        if (this.props.deleteOption)
            cleanButtonTitle = "Delete Files";
        else if (this.props.unhideOption)
            cleanButtonTitle = "Un-hide Files";

        return (
            <Modal id='broom-page' show={open} onEnter={this.enter} onHide={this.close} bsSize="large" dialogClassName="broom-modal">
                <Modal.Header>
                    <Grid>
                        <Row className="show-grid">
                            <Col lg={4}>
                                <Button className="btn-block" onClick={this.findButtonHandler}>
                                    {'Find Files'}
                                </Button>{' '}
                            </Col>
                            <Col lg={4}>
                                <Button className="btn-block" onClick={this.cleanButtonHandler} disabled={cleanButtonDisabled}>
                                    {cleanButtonTitle}
                                </Button>
                            </Col>
                        </Row>
                    </Grid>
                </Modal.Header>
                <Modal.Body style={styleObj}>
                    {
                        messages.map(msg => <div style={styleObj} dangerouslySetInnerHTML={{ __html: msg }} />)
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.close}>{'Close'}</Button>
                </Modal.Footer>
            </Modal >
        )
    }

    private enter = () => {
        this.setState({ cleanButtonDisabled: true })
        this.props.onSetMatchedFiles([])
        this.props.onClearMessages()
    }

    private close = () => {
        this.setState({ cleanButtonDisabled: true })
        this.props.onClearMessages()
        this.props.onSetOpen(false);
    }

    private fileHandler = async () => {
        for (var file of this.props.matchedFiles) {
            if (this.isParentDir(file, this.props.stagingPath)) {
                if (this.props.deleteOption) {
                    await fs.unlinkAsync(file)
                }
                else if (this.props.unhideOption) {
                    await fs.renameAsync(file, file.replace(/.vohidden$/, ""))
                }
                else {
                    await fs.renameAsync(file, file + ".vohidden")
                }
            }
            else {
                this.errorHandler("Attempted to process a file outside the mods directory.")
                return
            }
        }

        this.doneFileHandler();
    }

    private isParentDir(child: string, parent: string): boolean {
        var prev = ""
        var current = child;
        while (current != prev) {
            prev = current;
            current = pathlib.dirname(current)
            if (current == parent)
                return true;
        }

        return false
    }

    private findFiles = async (path: string, patternList: RegExp[], skipPattern: RegExp | null, output: string[]) => {
        if ((await fs.lstatAsync(path)).isDirectory()) {
            const entries = await fs.readdirAsync(path);
            for (var entry of entries) {
                var entryPath = pathlib.join(path, entry);
                if ((await fs.lstatAsync(entryPath)).isDirectory()) {
                    await this.findFiles(entryPath, patternList, skipPattern, output)
                }
                else {
                    for (var pattern of patternList) {
                        if (entryPath.search(pattern) != -1 && output.indexOf(entryPath) == -1) {
                            if (skipPattern && entryPath.search(skipPattern) != -1) {
                            }
                            else {
                                output.push(entryPath)
                            }
                        }
                    }
                }
            }
        }
    }

    private search = async () => {
        const { stagingPath, enabledMods } = this.props;

        var globalRules = ""

        for (let mod of enabledMods) {
            var broomFiles = [];
            var modPath = pathlib.join(stagingPath, mod.installationPath)

            await this.findFiles(modPath, [/\.broom(\.vohidden)?$/i], null, broomFiles)

            for (var broomFilePath of broomFiles) {
                globalRules += fs.readFileSync(broomFilePath, 'utf8') + "\n"
            }
        }

        var globalRulesList = globalRules.split(/\r?\n/).map(x => x.trim()).filter(x => x.length > 0)

        if (this.props.unhideOption && !this.props.deleteOption)
            for (var i = 0; i < globalRulesList.length; i++)
                globalRulesList[i] += ".vohidden";

        this.rulesHandler(globalRulesList)

        if (globalRulesList.length == 0)
            return

        var globalRulesTranslated = globalRulesList.map(x => globrex(x, { flags: 'g' }).regex)

        var skipPattern = /\.vohidden$/
        if (this.props.deleteOption || this.props.unhideOption)
            skipPattern = null;

        for (let mod of enabledMods) {
            var filesToSweep = []
            var modPath = pathlib.join(stagingPath, mod.installationPath)
            await this.findFiles(modPath, globalRulesTranslated, skipPattern, filesToSweep)

            if (filesToSweep.length > 0) {
                this.matchHandler(filesToSweep)
            }
        }

        this.doneSearchHandler()
    }

    private findButtonHandler = async () => {
        var searchMsg = "<b style='color:lightblue'>Searching for rule configuration files...</b>"
        this.props.onAddMessages([searchMsg, "</br>"])

        await this.search()
    }

    private rulesHandler = (globalRulesList: string[]) => {
        var ruleMessages = []

        if (globalRulesList.length == 0) {
            ruleMessages.push("No rules found. Make sure your Broom rules are properly installed as mods.")
        }
        else {
            ruleMessages.push("<b style='color:lightblue'>Rules found:</b>", "</br>")
            ruleMessages = ruleMessages.concat(globalRulesList)
            ruleMessages.push("</br>", "<b style='color:lightblue'>Scanning modlist for matching files...</b>", "</br>")
        }

        this.props.onAddMessages(ruleMessages)
    }

    private matchHandler = (values: string[]) => {
        const { matchedFiles } = this.props;

        this.props.onSetMatchedFiles(matchedFiles.concat(values))
        this.props.onAddMessages(values)
    }

    private doneSearchHandler = () => {
        var doneMessages = []

        if (this.props.matchedFiles.length == 0) {
            doneMessages.push("No files found.")
        }
        else {
            var doneMessage = ""

            if (this.props.deleteOption)
                doneMessage = "Done. Press the Delete Files button to delete the above files.";
            else if (this.props.unhideOption)
                doneMessage = "Done. Press the Un-hide Files button to restore the above files.";
            else
                doneMessage = "Done. Press the Hide Files button to hide the above files.";

            doneMessages.push("</br>", `<b style='color:orange;'>${doneMessage}</b>`, "</br>");

            this.setState({ cleanButtonDisabled: false })
        }

        this.props.onAddMessages(doneMessages)
    }

    private errorHandler = (msg: string) => {
        this.props.onAddMessages([msg, "</br>"])
    }

    private cleanButtonHandler = () => {
        var actionMsg = ""

        if (this.props.deleteOption)
            actionMsg = "Deleting files..."
        else if (this.props.unhideOption)
            actionMsg = "Restoring files..."
        else
            actionMsg = "Hiding files..."

        actionMsg = `<b style='color:lightblue'>${actionMsg}</b>`

        this.props.onAddMessages([actionMsg, "</br>"])

        this.fileHandler();
    }

    private doneFileHandler = () => {
        var outcomeMsg = "";

        if (this.props.deleteOption)
            outcomeMsg = "were deleted"
        else if (this.props.unhideOption)
            outcomeMsg = "were restored"
        else
            outcomeMsg = "were hidden"

        outcomeMsg = "" + this.props.matchedFiles.length + " files " + outcomeMsg

        var finalMessage = "<b style='color:orange'>Close this dialog and Deploy Mods to complete the operation.</b>"

        this.setState({ cleanButtonDisabled: true })
        this.props.onAddMessages([outcomeMsg, "</br>", finalMessage])
    }
}

function mapDispatchToProps(dispatch): IActionProps {
    return {
        onSetOpen: (open) => dispatch(setOpenBroomDialog(open)),
        onAddMessages: (msgList) => dispatch(addBroomMessages(msgList)),
        onClearMessages: () => dispatch(clearBroomMessages([])),
        onSetMatchedFiles: (pathList) => dispatch(setBroomMatchedFiles(pathList))
    };
}

function mapStateToProps(state: types.IState): IConnectedProps {
    const gameId = selectors.activeGameId(state);
    var mods = util.getSafe(state.persistent, ['mods', gameId], {})
    var profile = selectors.activeProfile(state);
    var profileMods = util.getSafe(profile, ['modState'], {});

    return {
        open: util.getSafe(state, ['session', 'broom', 'open'], false),
        messages: util.getSafe(state, ['session', 'broom', 'messages'], []),
        matchedFiles: util.getSafe(state, ['session', 'broom', 'matchedFiles'], []),
        stagingPath: selectors.installPathForGame(state, gameId),
        enabledMods: Object.keys(profileMods).filter(m => profileMods[m].enabled).map(x => mods[x]),
        deleteOption: util.getSafe(state, ['settings', 'interface', 'broomDeleteFiles'], false),
        unhideOption: util.getSafe(state, ['settings', 'interface', 'broomUnhide'], false),
    };
}

export default withTranslation(['common', 'broom'])(
    connect(mapStateToProps, mapDispatchToProps)(BroomDialog) as any) as React.ComponentClass<IBaseProps>;
