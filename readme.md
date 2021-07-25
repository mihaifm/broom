# Broom - The Loose File Sweeper

Broom is a plugin for both [Mod Organizer](https://github.com/ModOrganizer2/modorganizer) and [Vortex](https://www.nexusmods.com/site/mods/1) that allows you to hide or delete mod files using a configuration kept in your modlist.

MO2

![image](https://user-images.githubusercontent.com/981184/124805837-aef5cc80-df64-11eb-8a75-b15c5386f80b.png)

Vortex

![image](https://user-images.githubusercontent.com/981184/126915288-9e04cec9-5e84-4035-85e3-ebb993d50da0.png)

## Description

Let's say you've just installed a texture pack mod but don't like one of the textures included with it. You manually open the mod folder and delete the texture.
If you're a pro you might rename it with the .mohidden extension.

All is good until the texture pack gets an update, which you promptly install. The texture that you had deleted a while ago is now back. Did you remember the name of the texture you had deleted?
Probably not.

Enter this plugin.

With Broom you can keep track of files that you want to hide/delete using configuration files in you mod list. When you run Broom, it scans your mod list for these configuration files and hides (or deletes) the files for you.

The idea is simple but it allows you to:

- resolve mod conflicts in a more automated way, allowing you to move the mods in the list independent of each other
- combine mods by hiding conflicting files and sharing the config without having to share the original assets or any detailed manual instructions
- keep track of file operations that had to be done manually before
- remove various files from a mod and share these changes without the need to share the original mod
- save some disk space but cleaning up unnecessary files, while keeping track of the changes at the same time

## Installation

Download the Broom.py file and copy it to the plugin folder of your MO2 installation (e.g. C:\MO2\plugins)

## Usage

To launch Broom, go to Tools -> Tool Plugins -> Broom

![image](https://user-images.githubusercontent.com/981184/124807511-7eaf2d80-df66-11eb-8543-8bc704bc0e0c.png)

At this stage, clicking the Find Files button would display "No rules found" because we don't have a configuration yet telling it which files to hide.

So let's resolve that. Install the Sample Broom Rules file as a mod in Mod Organizer. You can use this sample as a starting point for creating your config files.

After Re-launching Broom and pressing the Find Files button, the rules will be detected and you will get a list of files that match the rules.

You can now review the files and press the Hide Files button to complete the operation. All the files in the list will be renamed with the .mohidden extension, preventing them to be loaded by the game.

## Configuration Files

Broom searches your modlist for configuration files having the .broom extension.

The configuration files should contain a list of [glob patterns](https://en.wikipedia.org/wiki/Glob_%28programming%29).

Example:

    riftenplazabrick01*
    *.png

The first rule matches all files containing riftenplazabrick01 (like riftenplazabrick01.dds and riftenplazabrick01_n.dds) while the second one matches all files with the png extension.

A sample file has been provided as an optional download. This should be installed as a mod in MO2. 
The .broom files can be placed under any folder hierarchy but MO2 might complain about Data directory being invalid. The sample file has been placed under a folder recognized by MO2 (scripts/source)

## Settings

To access plugin settings, go to Tools -> Settings -> Plugins -> Broom

![image](https://user-images.githubusercontent.com/981184/124813800-f3d23100-df6d-11eb-8157-51279ab150a6.png)

### Un-hiding files

Broom's hide operations are **fully reversible** meaning that you can restore the files previously hidden. All you have to do is enable the option in the settings. Make sure to disable the option after restoring the files.

### Deleting Files

If you're really low on disk space you can choose to delete files instead of hiding them. Files are permanently deleted so if you want to restore them you need to reinstall the respective mods. **Use this option with care**.

## License

MIT

**Enjoy!**
