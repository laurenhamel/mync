// Load dependencies.
const fs        = require('fs-extra');
const path      = require('path');
const deepcopy  = require('deepcopy');
const keygen    = require('node-machine-id');
const router    = require('./router.js')();
const processr  = require('./processr.js');
const logger    = require('./logger.js')();
const Deferred  = require('deferred-js');
const username  = require('username');
const prompt    = require('prompt-async');
const {Errl}    = require('./errl.js');
const {Backrup} = require('./backrup');
const {exec}    = require('child_process');

// Load utilities.
require('./prototypes.js');

// Initialize utilities.
const earl     = new Errl();
const backrup  = new Backrup();

// Start the prompt.
prompt.start();

// Set error messages.
earl.says('NOSRC', (type) => `Source ${type} not found.`)
    .says('SAME', (identifier) => `${identifier.toCapitalize()} is already set to the given path.`)
    .says('NONEXIST', (type) => `${type.toCapitalize()} does not exist.`)
    .says('BADSYM', (type) => `${type.toCapitalize()} not synced with source.`)
    .says('NOSYM', (type) => `${type.toCapitalize()} not synced.`)
    .says('NOSYNC', (type) => `${type.toCapitalize()} not synced.`);

// Create Mync.
class Mync {
  
  constructor() {
    
    // Capture context.
    const self = this;
    
    // Define properties.
    self._id = keygen.machineIdSync();
    self._configSrc = '../data/config.json';
    self._configRoot = path.resolve(__dirname, self._configSrc);
    self._configBackup = path.resolve(__dirname, `${self._configSrc}.backup`);
    self._configDefault = path.resolve(__dirname, `${self._configSrc}.default`);
    self._configData = deepcopy(require(self._configSrc));
    self._root = function() { return router.merge(self._configData.storage.root) };
    self._directory = function() { return router.merge(self._configData.storage.directory) };
    self._storage = function() { return router.merge(`${self._root()}/${self._directory()}`) };
    self._backup = function() { return router.merge(`${self._storage()}/.backup`) };
    self._system = function() { return router.merge(`${self._backup()}/${self._id}`) };
    self._synced = function() { return router.merge(`${self._storage()}/.synced.json`) };
    self._config = function() { return router.merge(`${self._storage()}/.config.json`) };
    self._settings = function() { 
      
      return self._configData.settings.map((setting) => {
      
        setting.dest = router.merge(setting.dest);
        setting.src  = router.merge(`${self._storage()}/${setting.src}`);

        return setting;

      }) 
    
    };
    self._syncedData = function() { return fs.existsSync(self._synced()) ? require(self._synced()) : {} };
    
    // Define private methods.
    self._saveJson = function( file, data ) { fs.writeJsonSync(file, data, {spaces: 2}); }
    self._saveConfig = function() { this._saveJson(self._config(), self._configData); }
    self._openConfig = function( app ) {
      
      // Open the configuration file in the default app.
      if( !app || app == 'default' ) exec(`open ${_config}`);
  
      // Otherwise, open the configuration file in the preferred app.
      else exec(`open -a "${app}" ${_config}`);
      
    };
    self._saveSynced = function( data ) { 
      
      // Get the synced data.
      const _syncedData = self._syncedData();
      
      // Save the system data.
      _syncedData[self._id] = data;
      
      // Save the synced data.
      this._saveJson(this._synced(), _syncedData);
    
    }
    self._removeSynced = function() {
      
      // Get the synced data.
      const _syncedData = self._syncedData();
      
      // Remove the system data.
      delete _syncedData[self._id];
      
      // Save the synced data.
      this._saveJson(this._synced(), _syncedData);
      
    };
    self._hasLinkedConfig = function(){ return fs.lstatSync(this._configRoot).isSymbolicLink(); }
    self._unlinkConfig = function() {
      
      // Remove the symlink.
      if( fs.existsSync(self._configRoot) ) fs.removeSync(self._configRoot);

      // Attempt to restore the configuration file from its backup.
      if( fs.existsSync(self._configBackup) && !fs.lstatSync(self._configBackup).isSymbolicLink() ) {

        // Restore from the backup.
        fs.copySync(self._configBackup, self._configRoot);

      }

      // Otherwise, restore the configuration file from its default.
      else fs.copySync(self._configDefault, self._configRoot);
      
    };
    self._linkConfig = function() {
      
      // Delete any backups that may exists.
      fs.removeSync(self._configBackup);
      
      // Backup the configuratino file.
      fs.copySync(self._configRoot, self._configBackup);
      
      // Copy to storage if a stored configuration file doesn't already exist.
      if( !fs.existsSync(self._config()) ) fs.copySync(self._configRoot, self._config());
      
      // Delete the configuration file.
      fs.removeSync(self._configRoot);
      
      // Create a symlink to the configuratino file in storage.
      fs.symlinkSync(self._config(), self._configRoot);
      
    };
    self._userConfirmation = async function( message, type ) {
      
      // Initialize deferred.
      const defer = new Deferred();
      
      // Ask the user to confirm their intent before proceeding.
      logger[type](message);
      logger[type]('Do you wish to continue?');
      
      // Require the user to confirm their intent.
      try {
        
        // Prompt the user for their response.
        const {confirm} = await prompt.get([{
          name: 'confirm', 
          required: true,
          default: 'no',
          message: 'Please enter `yes` or `no`.',
          pattern: /^y(es)?|n(o)?$/
        }]);
        
        // Proceed to copy the setting.
        if( /^y(es)?$/.test(confirm) ) defer.resolve();
        
        // Otherwise, cancel.
        else throw earl.error('CANCELED');
        
      } catch(error) { throw error; }
      
      // Return.
      return defer.promise();
      
    };
    
  }
  
  isSynced() {
    
    // Capture context.
    const self = this;
    
    // Use synced data if it's available.
    if( self._syncedData() && self._syncedData()[self._id] ) return true;
    
    // Initialize results.
    const results = [];
    
    // Look for each setting on the system.
    self._settings().forEach((setting) => {
      
      // Check the access rights of the destination.
      try {
        
        // Attempt to access the file for writing.
        fs.accessSync(setting.dest, fs.constants.W_OK);
        
        // Determine whether or not the setting has been symlinked.
        results.push(fs.lstatSync(setting.dest).isSymbolicLink());
        
      } catch(error) { }
      
    })
    
    // Check if all files are synced.
    if( results.every((result) => result === true) ) return true;
    
    // Otherwise, report not synced.
    return false;
    
  }
  
  isBackedUp() { return backrup.status() }
  
  get storage() { return this._storage(); }
  
  set storage( storage ) {
    
    // Capture context.
    const self = this;
    
    // Initialize helper methods.
    const wait = async function( condition, delay = 100, kill = 5000, lapsed = 0, defer = null ) {
  
      // Initialize deferred.
      if( !defer ) defer = new Deferred();
      
      // Check the condition.
      if( (typeof condition == 'function' ? condition() : condition) ) defer.resolve();
      
      // Otherwise, check the kill time.
      else if( lapsed >= kill ) defer.reject();
      
      // Otherwise, continue waiting.
      else setTimeout(() => {
        
        wait(condition, delay, kill, (lapsed + delay), defer);
          
      }, delay);
      
      // Return.
      return defer.promise();
      
    };
    
    // Get storage paths.
    let _path = {
      old: self._root(),
      new: router.merge(storage)
    };
    
    // Get generalize storage path.
    storage = router.unmerge(storage);
    
    // Initialize helers.
    const _storage = function( path ) { return router.merge(`${path}/${self._directory()}`); };
    
    // Ignore locations that are the same.
    if( _path.old == _path.new ) throw earl.error('SAME', 'storage location');
    
    // Ignore invalid locations.
    if( !fs.existsSync(_path.new) ) throw earl.error('NONEXIST', 'path');
    
    // Otherwise, update the storage location.
    try {
      
      // Update the storage root.
      self._configData.storage.root = storage;
      
      // Set permissions
      try {
        
        exec(`chmod -R 755 ${_storage(_path.old)}`);
        
      } catch(error) { 
      
        try {
          
          exec(`sudo chmod -R 755 ${_storage(_path.old)}`);
          
        } catch(error) { throw error; }
        
      }
      
      // Get the contents of the source folder.
      const contents = fs.readdirSync(_storage(_path.old)).filter((content) => {
        
        // Ignore irrelevant files.
        return ![
          '.DS_Store',
          '.Trash',
          '.localized'
        ].includes(content);
        
      }).map((content) => {
        
        return {
          src: router.merge(`${_storage(_path.old)}/${content}`),
          dest: router.merge(`${_storage(_path.new)}/${content}`),
        };
        
      });
      
      // Check for an existing folder at the storage location.
      if( fs.existsSync(_storage(_path.new)) ) {
        
        // Change permissions on any existing folders.
        try {
        
          exec(`chmod -R 755 ${_storage(_path.new)}`);

        } catch(error) { 

          try {

            exec(`sudo chmod -R 755 ${_storage(_path.new)}`);

          } catch(error) { throw error; }

        }
        
      }
      
      // Move the storage directory and all of its contents.
      fs.moveSync(_storage(_path.old), _storage(_path.new), {overwrite: true});
      
      // Catch any errors.
      let error = false;
      
      // Wait for everything to finish moving.
      wait(() => {
        
        // Capture results.
        const results = [];
        
        // Check to see if the contents have been moved over.
        contents.forEach((content) => results.push(fs.existsSync(content.dest)));
        
        // Verify that everything was moved.
        return results.every((result) => result === true);
        
      }).then(() => {
        
        // Save the configuration file.
        self._saveConfig();
        
        // Remove the existing symlink to the configuration file.
        fs.removeSync(self._configRoot);
 
        // Recreate the symlink for the configuratino file.
        fs.symlinkSync(self._config(), self._configRoot);
        
        // Reapply syncing.
        if( self.isSynced() ) self.sync();
        
      }).catch((e) => error = e);
      
      // Check for errors.
      if( error ) throw error;
      
    } catch(error) { throw error; }
    
  }
  
  async sync() {
    
    // Capture context.
    const self = this;
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Initialize the synced data for the current system.
    let _systemData = [];
    
    // Capture results.
    const results = [];
    
    // Initialize helper methods.
    const symlink = async function( type, src, dest ) {

      // Determine the path type.
      switch( type ) {

        case 'file': type = 'file'; break;

        case 'folder': type = 'dir'; break;

        default: type = fs.lstatSync(src).isDirectory() ? 'dir' : 'file';

      }

      // Check if the destination exists.
      if( fs.existsSync(dest) ) {

        // Change owner of the destination.
        try { await exec(`chown ${username.sync} ${dest}`); } catch(error) {

          try { await exec(`sudo chown ${username.sync} ${dest}`); } catch(error) { throw error; }

        }

        // Change permissions of the destination.
        try { await exec(`chmod -R 755 ${dest}`); } catch(error) {

          try { await exec(`sudo chmod -R 755 ${dest}`); } catch(error) { throw error; }

        }

        // Erase the destination if it exists.
        if( fs.existsSync(dest) ) fs.removeSync(dest);

      }

      // Replace the destination with a symbolic link to the source.
      fs.symlinkSync(src, dest, type);

    };
    const sync = async function( type, src, dest ) {

      // Initialize deferred.
      const defer = new Deferred();

      // Verify that the source exists.
      if( fs.existsSync(src) ) {

        try {

          // Generate a symlink.
          await symlink(type, src, dest);

          // Alert user that the setting was synced.
          results.push({message: `Synced '${dest}' successfully.`, type: 'success'});

          // Add synced data.
          _systemData.push({
            src: src,
            dest: dest,
            synced: true
          });

        }

        catch(error) {

          // Alert user of errors.
          results.push({message: `Skipped '${dest}'. ${earl.say(error.code, type)}`, type: 'warning'});

          // Add synced data.
          _systemData.push({
            src: src,
            dest: dest,
            synced: false,
            error: earl.say(error.code, type)
          });

        }

        // Resolve.
        defer.resolve();

      }

      // Otherwise, move on.
      else {

        // Alert user of missing setting.
        results.push({message: `Skipped '${dest}'. ${earl.say('NOSRC', type)}`, type: 'warning'});

        // Add synced data.
        _systemData.push({
          src: src,
          dest: dest,
          synced: false,
          error: earl.say('NOSRC', type)
        });

        // Resolve.
        defer.resolve();

      }

      // Return.
      return defer.promise();

    };

    // Make sure the user's system is backed up first.
    if( !fs.existsSync(self._system()) ) await self.backup();
    
    // Sync all settings.
    processr(self._settings(), sync).then(() => {
      
      // Save the system data.
      self._saveSynced(_systemData);
      
      // Resolve with results.
      defer.resolve(results);
      
    }).catch((error) => {
      
      // Reject with errors.
      defer.reject(error);
      
    });
    
    // Return.
    return defer.promise();
    
  }
  
  async unsync() {
    
    // Capture content.
    const self = this;
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Capture results.
    const results = [];
    
    // Look for system data.
    const _systemData = self._syncedData()[self._id];
    
    // Initialize helper methods.
    const unsymlink = async function( type, src, dest ) {
    
      // Decipher ambiguous types.
      if( !['file', 'folder'].includes(type) ) type = fs.lstatSync(src).isDirectory() ? 'folder' : 'file';

      // Check if the destination exists.
      if( fs.existsSync(dest) ) {

        // Verify that the destination is a symlink.
        if( fs.lstatSync(dest).isSymbolicLink() ) {

          // Verify that the symlink path points to the source.
          if( fs.readlinkSync(dest) == src ) {

            // Change owner of the symlink.
            try { await exec(`chown ${username.sync} ${dest}`); } catch(error) {

              try { await exec(`sudo chown ${username.sync} ${dest}`); } catch(error) { throw error; }

            }

            // Change permissions of the symlink.
            try { await exec(`chmod -R 755 ${dest}`); } catch(error) {

              try { await exec(`sudo chmod -R 755 ${dest}`); } catch(error) { throw error; }

            }

            // Delete the symlink.
            fs.removeSync(dest);

            // Copy the source to the destination.
            switch(type) {

              case 'file':

                // Create an placeholder file.
                fs.writeFileSync(dest);

                // Handle files without an extension.
                if( !path.extname(src) ) {

                  // Write to the file.
                  fs.writeFileSync(dest, fs.readFileSync(src));

                }

                // Handle files with an extension.
                else {

                  // Overwrite the file.
                  fs.copySync(src, dest);

                }

                break;

              case 'folder':

                // Create a placeholder folder.
                fs.mkdirSync(dest);

                // Overwrite the placeholder with the source.
                fs.copySync(src, dest);

                break;

            }

          }

          // Otherwise, the symlink is not linked to the source.
          else throw {code: 'BADSYM'};

        }

        // Otherwise, the destination is not a symlink.
        else throw {code: 'NOSYM'};

      }

      // Otherwise, the destination does not exist.
      else throw {code: 'NONEXIST'};

    };
    const unsync = async function( type, src, dest ) {

      // Initialize deferred.
      const defer = new Deferred();

      // Initialize a synced status.
      let unsyncable = true;

      // Determine if the destination was previously synced.
      if( _systemData ) {

        // Lookup the synced settings.
        unsyncable = _systemData.filter((setting) => setting.src == src && setting.dest == dest)[0].synced;

      }

      // Only unsync if previously synced.
      if( unsyncable ) {

        // Verify that the source exists.
        if( fs.existsSync(src) ) {

          try {

            // Generate a symlink.
            await unsymlink(type, src, dest);

            // Alert user that the setting was unsynced.
            results.push({message: `Unsynced '${dest}' successfully.`, type: 'success'});

          }

          catch(error) {

            // Alert user of errors.
            results.push({message: `Skipped '${dest}'. ${earl.say(error.code, type)}`, type: 'warning'});

          }

          // Resolve.
          defer.resolve();

        }

        // Otherwise, move on.
        else {

          // Set error.
          const error = {code: 'ENOSRC'};

          // Alert user of missing setting.
          results.push({message: `Skipped '${dest}'. ${earl.say('NOSRC', type)}`, type: 'warning'});

          // Resolve.
          defer.resolve();

        }

      }

      // Otherwise, move on.
      else {

        // Alert user of unsyncable setting.
        results.push(`Skipped '${dest}'. ${earl.say('NOSYNC', type)}`);

        // Resolve.
        defer.resolve();

      }

      // Return.
      return defer.promise();

    };
    
    // Unsync all settings.
    processr((_systemData || self._settings()), unsync).then(() => {
      
      // Remove the system data.
      self._removeSynced();
      
      // Resolve with results.
      defer.resolve(results);
      
    }).catch((error) => {
      
      // Reject with errrors.
      defer.reject(error);
      
    });
    
    // Return.
    return defer.promise();
    
  }
  
  async push( force, canceler ) {
    
    // Capture context.
    const self = this;
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Capture results.
    const results = [];
    
    // Initialize helper methods.
    const push      = async function( type, src, dest ) {

      // Initialize deferred.
      const defer = new Deferred();

      // Overwrite.
      if( fs.existsSync(dest) && !force ) await overwrite(type, src, dest, defer);

      // Write.
      else await write(type, src, dest, defer);

      // Return.
      return defer.promise();

    };
    const overwrite = async function( type, src, dest, defer = null ) {

      // Initialize deferred.
      if( !defer ) defer = new Deferred();

      // Alert the user that the setting already exists, and ask them to confirm overwriting.
      logger.queue(`'${dest}' already exists.`, 'yellow')
            .queue(`Continuing will overwrite this ${type}.`, 'yellow')
            .queue('Do you wish to continue?', 'yellow')
            .out();
      
      // Require the user to confirm their intent.
      try {

        // Prompt the user for their response.
        const {overwrite:_overwrite} = await prompt.get([{
          name: 'overwrite', 
          required: true,
          default: 'no',
          message: 'Please enter `yes` or `no`.',
          pattern: /^y(es)?|n(o)?$/
        }]);

        // Proceed to copy the setting.
        if( /^y(es)?$/.test(_overwrite) ) await write(type, src, dest, defer);

        // Skip the setting.
        else {

          // Alert the user that the setting has been skipped.
          results.push({message: `Skipped '${dest}'.`, type: 'success'});

          // Done.
          defer.resolve();

        }
        
      } catch(error) { 
        
        // Check for cancelations.
        if( error.message == 'canceled' ) canceler();
        
        // Otherwise, alert the user that the setting was skipped.
        else results.push({message: `Skipped ${dest}. ${earl.say(error.code, type)}`, type: 'warning'});
        
        // Resolve.
        defer.resolve();
        
      }
      
      // Return.
      return defer.promise();

    };
    const write     = async function( type, src, dest, defer = null ) { 

      // Initialize deferred.
      if( !defer ) defer = new Deferred();

      // Make sure the source file exists.
      if( fs.existsSync(src) ) {

        // Decipher ambiguous types.
        if( !['file', 'folder'].includes(type) ) type = fs.lstatSync(src).isDirectory() ? 'folder' : 'file';

        // Create a placeholder.
        switch(type) {

          case 'file':

            // Get root folder.
            const root = dest.replace(/\/+$/, '').substring(0, dest.lastIndexOf('/'));

            // Create root directory.
            if( !fs.existsSync(root) ) mkdirp.sync(root);

            // Create an empty file.
            fs.writeFileSync(dest);

            break;

          case 'folder':

            // Delete the folder if it already exists.
            if( fs.existsSync(dest) ) fs.removeSync(dest);

            // Create an empty folder.
            fs.mkdirSync(dest);

            break;

        }

        // Copy the setting.
        fs.copySync(src, dest);

        // Alert the user that the setting has been copied.
        results.push({message: `Pushed ${type} '${dest}' successfully.`, type: 'success'});

      }

      // Otherwise, move on.
      else {

        // Alert the user that the source could not be found.
        results.push({message: `Skipped ${src}. ${earl.say('NOSRC', type)}`, type: 'warning'});

      }

      // Resolve.
      defer.resolve();
      
      // Return.
      return defer.promise();

    };
    
    // Get settings and swap source and destination for proper handling.
    const _settings = self._settings().map((setting) => {
      
      let src = setting.src;
      let dest = setting.dest; 
      
      setting.src = dest;
      setting.dest = src;
      
      return setting;
      
    });
    
    // Push all settings to storage.
    processr(_settings, push).then(() => defer.resolve(results)).catch((error) => defer.reject(error));
    
    // Return.
    return defer.promise();
    
  }
  
  async pull( force, canceler ) {
    
    // Capture context.
    const self = this;
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Capture results.
    const results = [];
    
    // Initialize helper methods.
    const pull = async function( type, src, dest ) {
      
      // Initialize deferred.
      const defer = new Deferred();
      
      // Attempt to pull the setting.
      try {
        
        // Overwrite if the setting already exists.
        if( fs.existsSync(dest) && !force ) await overwrite(type, src, dest, defer);
        
        // Otherwise, write the setting.
        else await write(type, src, dest, defer);
        
      } catch(error) {
        
        // Capture the result.
        result.push({message: `Skipped '${dest}'. ${earl.say(error.code, type)}`, type: 'warning'});
        
        // Resolve.
        defer.resolve();
        
      }
      
      // Return.
      return defer.promise();
      
    };
    const overwrite = async function( type, src, dest, defer = null ) {
      
      // Initialize deferred.
      if( !defer ) defer = new Deferred();

      // Alert the user that the setting already exists, and ask them to confirm overwriting.
      logger.queue(`'${dest}' already exists.`, 'yellow')
            .queue(`Continuing will overwrite this ${type}.`, 'yellow')
            .queue('Do you wish to continue?', 'yellow')
            .out();

      // Require the user to confirm their intent.
      try {

        // Prompt the user for their response.
        const {overwrite:_overwrite} = await prompt.get([{
          name: 'overwrite', 
          required: true,
          default: 'no',
          message: 'Please enter `yes` or `no`.',
          pattern: /^y(es)?|n(o)?$/
        }]);

        // Proceed to copy the setting.
        if( /^y(es)?$/.test(_overwrite) ) await write(type, src, dest, defer);

        // Skip the setting.
        else {

          // Alert the user that the setting has been skipped.
          results.push({message: `Skipped '${dest}'.`, type: 'success'});

          // Resolve.
          defer.resolve();

        }

      } catch(error) { 
        
        // Check for cancelations.
        if( error.message == 'canceled' ) canceler();
        
        // Otherwise, alert the user that the setting was skipped.
        else results.push({message: `Skipped ${dest}. ${earl.say(error.code, type)}`, type: 'warning'});

        // Resolve.
        defer.resolve();
        
      }
        
      // Return.
      return defer.promise();
      
    };
    const write = async function( type, src, dest, defer = null ) {
      
      // Initialize deferred.
      if( !defer ) defer = new Deferred();
      
      // Make sure the source exists.
      if( fs.existsSync(src) ) {
        
        // Decipher ambiguous types.
        if( !['file', 'folder'].includes(type) ) type = fs.lstatSync(src).isDirectory() ? 'folder' : 'file';

        // Get the root of the destination.
        const root = dest.replace(/\/+$/, '').substring(0, dest.lastIndexOf('/'));

        // Determine if the destination exists.
        if( fs.existsSync(dest) ) {

          // Change owner of the destination.
          try { await exec(`chown ${username.sync} ${dest}`); } catch(error) {

            try { await exec(`sudo chown ${username.sync} ${dest}`); } catch(error) { throw error; }

          }

          // Change permissions of the destination.
          try { await exec(`chmod -R 755 ${dest}`); } catch(error) {

            try { await exec(`sudo chmod -R 755 ${dest}`); } catch(error) { throw error; }

          }

          // Remove the destination.
          fs.removeSync(dest);

        }

        // Otherwise, determine if the root of the destination exists.
        else if( !fs.existsSync(root) ) {

          // Create the root of the destination.
          mkdrip.sync(root);

        }

        // Copy the source to the destination.
        switch(type) {

          case 'file':

            // Create a placeholder file.
            fs.writeFileSync(dest);

            // Handle files without an extension.
            if( !path.extname(src) ) {

              // Write to the file.
              fs.writeFileSync(dest, fs.readFileSync(src));

            }

            // Handle files with an extension.
            else {

              // Overwrite the file.
              fs.copySync(src, dest);

            }

            break;

          case 'folder':

            // Create a placeholder folder.
            fs.mkdirSync(dest);

            // Overwrite the placeholder with the source.
            fs.copySync(src, dest);

            break;

        }

        // Alert the user that the setting has been copied.
        results.push({message: `Pulled ${type} '${dest}' successfully.`, type: 'success'});
        
      }
      
      // Otherwise, move on.
      else {
        
        // Alert the user that source does not exist.
        results.push({message: `Skipped '${src}'. ${earl.say('NOSRC', type)}`, type: 'warning'});
        
      }
      
      // Resolve.
      defer.resolve();
      
      // Return.
      return defer.promise();
      
    };
    
    // Pull all settings to workstation.
    processr(self._settings(), pull).then(() => defer.resolve(results)).catch((error) => defer.reject(error));
    
    // Return.
    return defer.promise();
    
  }
  
  async backup() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Force and unsync if the system is synced.
    if( this.isSynced() ) await this.unsync();
    
    // Backup the user's system.
    backrup.backup().then(() => defer.resolve()).fail((error) => defer.reject(error));
    
    // Return.
    return defer.promise();
    
  }
  
  async restore() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Restor the user's system.
    backrup.restore().then((errors) => defer.resolve(errors)).fail((error) => defer.reject(error));
    
    // Return.
    return defer.promise();
    
  }
  
  async setup() {
    
    // Capture context.
    const self = this;
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Check if the configuration file was previously symlinked or doesn't exist, and restore it if so.
    if( self._hasLinkedConfig() ) self._unlinkConfig();
    
    // Walk the user through the setup process.
    try {

      // Don't throw any errors until after the configuration file has been symlinked.
      let thrown = false;

      // First, verify the storage location and set it up.
      try {

        // Prompt the user for some information.
        const {storage} = await prompt.get([{
          name: 'storage',
          required: true,
          default: router.unmerge(self._root()),
          description: 'Enter your preferred storage location',
        }]);

        // Detect changes to storage.
        if( storage && router.merge(storage) != self._root() ) {
          
          // Attempt to set the storage location.
          try { self.storage = storage;  } catch(error) { thrown = error; }
          
        }

      } catch(error) { thrown = error; }

      // Then, symlink the configuration file to storage.
      self._linkConfig();

      // Check for any errors that were previously thrown.
      if( thrown ) throw thrown;

      // Next, ask about manging configurations.
      try {

        // Prompt the user for their preference.
        const {config} = await prompt.get([{
          name: 'config',
          required: true,
          default: 'no',
          pattern: /^y(es)?|n(o)?$/,
          message: 'Please enter `yes` or `no`.',
          description: 'Do you wish to edit the configuration file now?'
        }]);

        // Open the configuration file if requested.
        if( /^y(es)?$/.test(config) ) {

          // Ask the user if they'd like to specify an app to open the configuration file.
          const {app} = await prompt.get({
            name: 'app',
            required: false,
            description: "Choose an app to open the `.json` file or leave it blank to use the system default"
          });

          // Open the configuration file.
          self._openConfig(app);

        }

      } catch(error) { throw error; }

      // Resolve.
      defer.resolve();

    } catch(error) { defer.reject(error); }
    
    // Return.
    return defer.promise();
    
  }
  
  async add() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Capture context.
    const self = this;
    
    // Initialize helper methods.
    const overwrite = async function( data, identical, defer = null ) {
    
      // Initialize deferred.
      if( !defer ) defer = new Deferred();

      // Warn the user that an identical setting already exists.
      logger.warning('A setting with the given destination already exists.')
            .warning(`name: ${identical.name}`)
            .warning(`src: ${identical.src}`)
            .warning(`dest: ${identical.dest}`)
            .warning(`files: ${identical.files.join(', ')}`)
            .warning(`folders: ${identical.folders.join(', ')}`);
      
      // Attempt to add the identical setting.
      try {
        
        // Force the user to confirm their intent.
        await self._userConfirmation('Continuing will overwrite the setting.', 'warning');
          
        // Delete the identical setting.
        self._configData.settings = self._configData.settings.filter((setting) => {

          return setting.name != identical.name &&
                 setting.src  != identical.src &&
                 setting.dest != identical.dest;

        });
        
        // Add the new setting.
        await write(data, defer);
        
      } catch(error) { throw error; }
      
      // Return.
      return defer.promise();

    };
    const write = async function( data, defer = null ) {

      // Initialize deferred.
      if( !defer ) defer = new Deferred();

      // Add the new setting.
      self._configData.settings.push({
        name: data.name,
        src: data.src,
        dest: data.dest,
        files: data.files.split(',')
          .map((file) => file.replace(',', '').trim())
          .filter((file) => file != '' && file != null & file != undefined),
        folders: data.folders.split(',')
          .map((file) => file.replace(',', '').trim())
          .filter((file) => file != '' && file != null & file != undefined)
      });
      
      // Save the new setting.
      self._saveConfig();

      // Resolve.
      defer.resolve();
      
      // Return.
      return defer.promise();

    };
    
    // Require the user to provide relevant information.
    try {
      
      // Prompt the user for some information.
      const data = await prompt.get([{
        name: 'name',
        required: true,
        description: "Enter a unique name for your setting",
      }, {
        name: 'src',
        required: true,
        description: "Enter the setting's storage path"
      }, {
        name: 'dest',
        required: true,
        description: "Enter the setting's system path"
      }, {
        name: 'files',
        pattern: /(.+?)(?=,|$)/g,
        description: "List the files you would like to add",
        message: 'Enter multiple files using a comma-delimited list.'
      }, {
        name: 'folders',
        pattern: /(.+?)(?=,|$)/g,
        description: "List the folders you would like to add",
        message: 'Enter multiple folders using a comma-delimited list.'
      }]);
  
      // Look for identical settings.
      const identical = self._configData.settings.filter((setting) => setting.dest == data.dest)[0];
      
      // Verify that a similar setting does not already exist.
      if( !identical ) await write(data, defer);

      // Otherwise, overwrite the existing setting.
      else await overwrite(data, identical, defer);
      
    } catch(error) { defer.reject(error); }
    
    // Return.
    return defer.promise();
    
  }
  
  async remove( name ) {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Capture context.
    const self = this;

    // Look for any settings with the given name.
    const _setting = self._configData.settings.filter((setting) => setting.name == name)[0];
    
    // Verify that the setting exists.
    if( _setting ) {
        
      // Show the user the match data.
      logger.warning(`The following setting was found:`)
            .warning(`name: ${_setting.name}`)
            .warning(`src: ${_setting.src}`)
            .warning(`dest: ${_setting.dest}`)
            .warning(`files: ${_setting.files.join(', ')}`)
            .warning(`folders: ${_setting.folders.join(', ')}`);

      // Attempt to remove the setting.
      try {

        // Force the user to confirm their intent.
        await self._userConfirmation('Continuing will delete the setting.', 'warning');

        // Delete the setting.
        self._configData.settings = self._configData.settings.filter((setting) => {

          return setting.name != _setting.name &&
                 setting.src  != _setting.src &&
                 setting.dest != _setting.dest;

        });
        
        // Save the settings.
        self._saveConfig();
        
        // Resolve.
        defer.resolve();

      } catch(error) { defer.reject(error); }
      
    }
    
    // Otherwise, exit.
    else defer.reject(earl.error('NONEXIST', `setting with name '${name}'`));
    
    // Return.
    return defer.promise();
    
  }
  
  list() { return this._settings().map((setting) => setting.name); }
  
  info( name ) { return this._settings().filter((setting) => setting.name == name).map((setting) => {
    
    setting.files = setting.files.map((file) => router.merge(`${setting.dest}/${file}`));
    setting.folders = setting.folders.map((folder) => router.merge(`${setting.dest}/${folder}`));
    
    return setting;
    
  }); }
  
}

// Export.
module.exports = {Mync};