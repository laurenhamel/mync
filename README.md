# Mync

Mync is intended to be an easy-to-use CLI for syncing your workstation configurations and application settings across Macs.


## Table of Contents

- [How it Works](#how-it-works)
- [Getting Started](#getting-started)
- [Advanced Usage](#advanced-usage)
- [Changing Storages](#changing-storages)
- [Managing Configurations](#managing-configurations)
- [Why Mync](#just-why)
- [Become a Contributor](#become-a-contributor)


## How it Works

Mync can be configured to backup and sync your system configurations and application settings across various Macs. This can be useful for eliminating the painstaking process of setting up a new workstation or can simply be used to ensure that all of your existing workstations remain in sync. When syncing, Mync will backup your system's current state to the storage location of your choosing and create symbolic links on your system pointing to your stored configuration data. When unsyncing, Mync will replace those symbolic links it previously created with a hard copy of the file or folder it has saved in storage.


## Getting Started

First, install Mync.

```
npm install -g mync
```

Then, before you can start syncing across workstations, you'll need to add something to storage.

1. Optionally, set your preferred storage location. See [Changing Storages](#changing-storages).

2. Optionally, configure Mync. See [Managing Configurations](#managing-configurations).

3. Backup your current system with `mync backup`.

4. Add your workstation's settings to storage with `mync push`.

5. Start syncing your workstations with `mync sync`.

6. Check the status of your workstation at anytime using `mync status`.

And finally, on your other workstations, install Mync and instantly backup your workstation and sync your settings with `mync sync`.


## Advanced Usage

### `mync storage [storage]`

Allows you to change the storage location that Mync uses

### `mync backup`

Backs up your workstation's settings

### `mync restore`

Restores your workstation's settings from its backup

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |

### `mync push`

Pushes your workstation's settings to storge

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |
| `-o`, `--overwrite` | Forces overwriting of all settings in storage           |

### `mync pull`

Pulls a copy of whatever settings are in storage onto your current workstation

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |
| `-o`, `--overwrite` | Forces overwriting of all settings on your workstation  |

> `mync pull` works similarly to performing `mync sync` then `mync unsync` in sequence.

### `mync sync`

Syncs the settings in storage with your workstation using symbolic links

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |

### `mync unsync`

Unsyncs your workstation by replacing the symbolic links with a copy of your settings from storage

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |

### `mync add`

Enables you to add a new setting to Mync's configuration file

### `mync remove [name]`

Allows you to remove an existing setting from Mync's configuration file using the setting `name`

### `mync config [app?]`

Opens Mync's configuration file for editing, optionally opening it in your preferred `app`

### `mync status`

Displays the sync status of your current workstation

### `mync list`

Lists the names of the settings in Mync's configuration file

### `mync info [name]`

Retrieves more information about a given setting in Mync's configuration file by setting `name`

### `mync [-h || --help]`

Displays some help


## Changing Storages

By default, Mync uses **iCloud Drive** for storage. If you prefer to use something else, you can change the storage location using the `mync storage` command or by editing the configuration file directly with `mync config`. However, the latter method is not recommended unless you're comfortable with manually moving your Mync folder from its old storage location to the new one you decide. In other words, when using the `mync storage` command, two things will happen: (1) your configuration file will be updated with the new storage location and (2) your existing storage folder will be moved to its new location. The configuration file has some preset `routes` defined, which can also be used, or you can add your own. These include:

| Route             | Path                                              |
|-------------------|---------------------------------------------------|
| `:home`           | `~`                                               |
| `:apps`           | `~/Applications/`                                 |
| `:appdata`        | `~/Library/Application Support/`                  |
| `:appprefs`       | `~/Library/Preferences`                           |
| `:icloud`         | `~/Library/Mobile Documents/com~apple~CloudDocs`  |
| `:dropbox`        | `~/Dropbox/`                                      |
| `:onedrive`       | `~/OneDrive/`                                     |
| `:box`            | `~/Box Sync/`                                     |
| `:gdrive`         | `~/Google Drive/`                                 |
| `:odrive`         | `~/odrive/`                                       |

> It's worth noting that the configuration file is also used to define your storage directory's name. By default, this folder name is set to `Mync`. Currently, the CLI does not provide a way to change the storage directory's name, but the name could be changed manually if you're opposed to using the default value (i.e. use `mync config` to open and edit the storage directory's name then renaming the physical folder in storage).

## Managing Configurations

Mync uses a `.json` file to manage its configuration data, which is stored in your preferred storage location for syncing across your workstations. Settings can be added or removed from this configuration file using `mync add` or `mync remove`, respectively, or the `mync storage` command can be used to change Mync's storage location. Alternatively, the configuration file can also be edited directly using `mync config`, but it's not recommended that the storage location be changed in this manner (see [Changing Storages](#changing-storages) for more details). Below are a few simple guidelines for attaining the best results when manging your configurations:

- Keep your setting names **unique**.
- Make sure `src` paths are always relative to the `storage` location.
- For brevity, you can define new `routes` and utilize them as `:route`.
- The `$username` variable is also available, which gets replaced with your username on your workstation.
- Keep `files` and `folders` as immediate children of the `dest` path (e.g. `settings.json` not `some/dir/settings.json`).

> Mync will attempt to manipulate all settings given in the configuration file but may run into some permissions errors during execution for certain files and/or folders. For example, Apache and PHP files can be backed up and pushed into storage for universal availability, but Mync will likely run into permissions error when attempting to sync or pull these files with workstations.

## Why Mync

Mync was born out of sheer frustration of always having to copy system settings and application configurations across workstations. Now, it's never been easier to switch from your work computer to your personal setup and back again. With Mync, you're able to keep all your Macs in sync all the time.


## Become a Contributor

Have some suggestions? Want to help port this project to other operating systems? Let's collaborate.