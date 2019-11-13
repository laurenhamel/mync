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