# Broom - The Loose File Sweeper

Broom is a plugin for both [Mod Organizer](https://github.com/ModOrganizer2/modorganizer) and [Vortex](https://www.nexusmods.com/site/mods/1) that allows you to hide or delete files from other mods based on a configuration kept in your modlist.

MO2

![image](https://user-images.githubusercontent.com/981184/124805837-aef5cc80-df64-11eb-8a75-b15c5386f80b.png)

Vortex

![image](https://user-images.githubusercontent.com/981184/126915288-9e04cec9-5e84-4035-85e3-ebb993d50da0.png)

## Description

Broom allows you to automatically hide or delete files from various mods in your list. To achieve this, Broom reads a configuration file that is also installed as a mod in your list.
In the config file you can specify a set of rules (file names, patterns etc.) that Broom then uses to hide/delete mod files.

The idea is simple but it allows you to:

- resolve mod conflicts in a more automated way, allowing you to move the mods in the list independent of each other
- combine mods by hiding conflicting files and sharing the config without having to share the original assets
- keep track of file operations that had to be done manually before
- remove various files from a mod and share these changes without the need to share the original mod
- save some disk space but cleaning up unnecessary files, while keeping track of the changes at the same time

Consider the following scenario: you've just installed a retexture mod but don't like one of the textures included with it. You manually open the mod folder and delete the texture. Everything is fine until the texture mod gets an update, which you promptly install. The texture you had deleted a while ago is now back alive, and you probably don't remember its name or location.

This is where this plugin can be useful.

## Installation

MO2:    
Download the MO2 version, unzip, copy Broom.py into the plugin folder of your MO2 installation (e.g. C:\MO2\plugins)

Vortex:     
Download the Vortex version, unzip, copy the 3 files into %appdata%\Vortex\plugins\Broom

## Configuration Files

Before using Broom, you need to create a configuration file telling it what files it should hide/delete.

A sample file has been provided as an optional download. This can be installed as a mod directly with MO2/Vortex.

To make you own, simply create a file having the *.broom* extension, archive it and drag the archive into MO2/Vortex (for MO2 you might want to put the .broom file inside a recognized folder e.g. scripts, otherwise MO2 might complain about Data directory being invalid)

The configuration file should contain a list of [glob patterns](https://en.wikipedia.org/wiki/Glob_%28programming%29) matching the files you want to get rid of:

Example:

    riftenplazabrick01*
    *.png

The first rule matches all files containing riftenplazabrick01 (like riftenplazabrick01.dds and riftenplazabrick01_n.dds) while the second one matches all files with the png extension.

You can of course have multiple config files and enable/disable them in you modlist as you wish.

## Usage

#### MO2

To launch Broom, go to Tools -> Tool Plugins -> Broom

![image](https://user-images.githubusercontent.com/981184/124807511-7eaf2d80-df66-11eb-8543-8bc704bc0e0c.png)

Press the Find Files button and wait for it to scan your modlist. Review the matching files and press the Hide Files button to complete the operation.

All the matching files will be renamed with the .mohidden extension, preventing them to be loaded by the game.

#### Vortex

To launch Broom, go to MODS and press the Broom icon in the toolbar.

![image](https://user-images.githubusercontent.com/981184/127040342-8d8101e6-2baa-4212-b077-63ffb3a89e85.png)

Press the Find Files button and wait for it to scan your modlist. Review the matching files and press the Hide Files button to complete the operation.

All the matching files will be renamed with the .vohidden extension, preventing them to be loaded by the game.

## Settings

MO2:     
Tools -> Settings -> Plugins -> Broom

Vortex:     
Settings -> Interface -> Broom

### Un-hiding files

Broom's hide operations are **fully reversible** meaning that you can restore the files previously hidden. All you have to do is enable the option in the settings and re-run the tool. The same configuration file is used for both hiding an un-hiding.

### Deleting Files

If you're really low on disk space you can choose to delete files instead of hiding them. Files are permanently deleted so if you want to restore them you need to reinstall the respective mods. **Use this option with care**.

## License

MIT

**Enjoy!**
