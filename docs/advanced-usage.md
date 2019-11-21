## Advanced Usage

### `mync storage [storage]`

Allows you to change the storage location that Mync uses

> TODO: This needs to be improved to allow the user to provide the sync location's path. This should also work as a getter and setter, where not supplying the storage path will return the storage path currently in use.

### `mync backup`

Backs up your workstation's settings

> TODO: This needs to be updated to use the `mync.yaml` file.

### `mync restore`

Restores your workstation's settings from its backup

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |

> TODO: This needs to be updated to use the `mync.yaml` file.

### `mync push`

Pushes your workstation's settings to storge

| Options             | Description                                             |
|---------------------|---------------------------------------------------------|
| `-v`, `--verbose`   | Outputs additional messages to the console              |
| `-o`, `--overwrite` | Forces overwriting of all settings in storage           |

> TODO: Remove this option in favor of user-maintained configuration file and manual setup and/or improved CLI.

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

> TODO: This should be improved to better work with the new `mync.yaml` configuration file. Ideally, a prompt system should allow the user to supply a `name` and `source` path for any file(s)/folder(s) that they wish to Sync, then (a) for folders, the user will be asked to indicate what contents he/she wishes to include in the sync; (b) the backup will occur automatically; (c) the files will be added to storage, optionally prompting the user if he/she wishes to override any existing files; and (d) the sync operation will finally put symlinks in place.

### `mync remove [name]`

Allows you to remove an existing setting from Mync's configuration file using the setting `name`

> TODO: This should be improved to better work with the new `mync.yaml` configuration file. The operation should (a) prompt the user to indicate if he/she wishes for the removed files to be restored to their originals (i.e., backup versions) or storage versions, then (b) should remove any symlinks that may be in place, replacing them with their source version, and (c) delete the entry from the configuration file.

### `mync config [app?]`

Opens Mync's configuration file for editing, optionally opening it in your preferred `app`

> TODO: This needs to be updated to open the `mync.yaml` file.

### `mync status`

Displays the sync status of your current workstation

> TODO: This should be updated to output a status for the overall system, then include a list of statuses for each item within storage.

### `mync list`

Lists the names of the settings in Mync's configuration file

> TODO: This needs to be updated to use the `mync.yaml` file.

### `mync info [name]`

Retrieves more information about a given setting in Mync's configuration file by setting `name`

> TODO: This needs to be updated to use the `mync.yaml` file.

### `mync [-h || --help]`

Displays some help