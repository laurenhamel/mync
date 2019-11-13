## Managing Configurations

Mync uses a `.json` file to manage its configuration data, which is stored in your preferred storage location for syncing across your workstations. Settings can be added or removed from this configuration file using `mync add` or `mync remove`, respectively, or the `mync storage` command can be used to change Mync's storage location. Alternatively, the configuration file can also be edited directly using `mync config`, but it's not recommended that the storage location be changed in this manner (see [Changing Storages](#changing-storages) for more details). Below are a few simple guidelines for attaining the best results when manging your configurations:

- Keep your setting names **unique**.
- Make sure `src` paths are always relative to the `storage` location.
- For brevity, you can define new `routes` and utilize them as `:route`.
- The `$username` variable is also available, which gets replaced with your username on your workstation.
- Keep `files` and `folders` as immediate children of the `dest` path (e.g. `settings.json` not `some/dir/settings.json`).

> Mync will attempt to manipulate all settings given in the configuration file but may run into some permissions errors during execution for certain files and/or folders. For example, Apache and PHP files can be backed up and pushed into storage for universal availability, but Mync will likely run into permissions error when attempting to sync or pull these files with workstations.