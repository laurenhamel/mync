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