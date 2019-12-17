// Load dependencies.
//const processr  = require('./processr.js');
//const {Backrup} = require('./backrup');
//const {exec}    = require('child_process');
const fs = require('fs-extra');
const yaml = require('yaml');
const path = require('path');
const glob = require('glob').sync;
const mustache = require('mustache');
const inquirer = require('inquirer');
const keygen    = require('node-machine-id');
const username  = require('username');
const untildify = require('untildify');
const store = require('data-store');
const open = require('open');
const utils = require('./utils');
const _ = require('lodash');

// Set constants.
const CWD = process.cwd();

// Register error messages.
utils.error.register('NOSRC', (type) => `Source ${type} not found.`)
           .register('SAME', (identifier) => `${_.capitalize(identifier)} is already set to the given path.`)
           .register('NONEXIST', (type) => `${_.capitalize(type)} does not exist.`)
           .register('BADSYM', (type) => `${_.capitalize(type)} not synced with source.`)
           .register('NOSYM', (type) => `${_.capitalize(type)} not synced.`)
           .register('NOSYNC', (type) => `${_.capitalize(type)} not synced.`)
           .register('USRCONF', (error) => `An error was detected in the user configuration file: ${error}`)
           .register('SETUPERR', (error) => `An error occurred during setup: ${error}. You may need to reinstall Mync, and try again.`);

// Create Mync.
class Mync {
  
  // Construct the instance.
  constructor( setup = false ) {
    
    // Capture the instance's context.
    const THIS = this;
    
    // Initialize a set of utilities.
    this.UTILS = {
      
      // Initialize metadata utilities.
      METADATA: {
        
        // Initialize the metadata store if it doesn't exist already.
        init() {
          
          if( !THIS.METADATA ) THIS.METADATA = store({
            path: path.join(THIS.STORAGE(), '/.metadata.json'),
            indent: 2
          });
          
        },
        
        // Get some metadata for the current system.
        get( key = null ) {
          
          // Make sure the store is initialized.
          THIS.UTILS.METADATA.init();
          
          // Get the key, or get all metadata for the system.
          return THIS.METADATA.get(_.isNil(key) ? THIS.ID : `${THIS.ID}.${key}`);
          
        },
        
        // Determine if some key exists within the metadata.
        has( key = null ) {
          
          // Make sure the store is initialized.
          THIS.UTILS.METADATA.init();
          
          // Look for the key, or look for any metadata for the system.
          return THIS.METADATA.has(_.isNil(key) ? THIS.ID : `${THIS.ID}.${key}`);
          
        },
        
        // Update the metadata for the current system.
        update( data = {} ) {
          
          // Make sure the store is initialized.
          THIS.UTILS.METADATA.init();
        
          // Update the system's metadata with the given data.
          THIS.METADATA.set(THIS.ID, _.merge(THIS.METADATA.get(THIS.ID), data));

        },
      
        // Remove the metadata for the current system.
        remove() {
          
          // Make sure the store is initialized.
          THIS.UTILS.METADATA.init();
          
          // Remove the system's metadata.
          THIS.METADATA.del(THIS.ID);
          
        }
        
      },
      
      // Initialize MYNCRC utilities.
      MYNCRC: {
        
        // Initialize the MYNCRC data if not already initialized.
        init() {
          
          // Initialize the MYNCRC data if not already initialized.
          if( !THIS.MYNCRC ) THIS.MYNCRC = THIS.UTILS.MYNCRC.load();
          
        },
        
        // Load the MYNCRC file.
        load() {
          
          // Read the MYNCRC file, and parse it.
          return yaml.parse(fs.readFileSync(THIS.UTILS.MYNCRC.path(), 'utf8'));
          
        },
        
        // Update the MYNCRC file with the given data.
        update( data = {} ) {
          
          // Make sure the MYNCRC data is initialize.
          THIS.UTILS.MYNCRC.init();
          
          // Update the MYNCRC file's data.
          THIS.MYNCRC = _.merge(THIS.MYNCRC, data);
          
          // Generate a new MYNCRC file using the MYNCRC template and the updated data.
          const contents = mustache.render(THIS.TEMPLATES.myncrc, THIS.MYNCRC);

          // Save the new MYNCRC file.
          fs.writeFileSync(THIS.UTILS.MYNCRC.path(), contents);

        },
        
        // Get the MYNCRC file path.
        path() {
          
          // Return the MYNCRC file path.
          return path.resolve(CWD, '.myncrc');
          
        }
        
      },
      
      // Initialize storage utilities.
      STORAGE: {
        
        // Resolve the given volume location to a path on the current system.
        resolve( volume ) {

          // Resolve the storage volume.
          return path.resolve(_.startsWith(volume, '~/') ? untildify(volume) : volume);
          
        },
        
        // Get the storage path from the given location information.
        path() {
          
          // Make sure the MYNCRC data is initialize.
          THIS.UTILS.MYNCRC.init();
          
          // Resolve the volume, and join its path with the given directory.
          return path.join(THIS.UTILS.STORAGE.resolve(THIS.MYNCRC.STORAGE_VOLUME), `/${THIS.MYNCRC.STORAGE_DIRECTORY}`);
        
        },
        
        // Move the contents of an old storage location to a new storage location.
        move( src, dest ) {
          
          // Move the contents of the old storage location to the new storage location.
          _.each(glob(path.join(src, '*')), (item) => {

            // Get the item's name.
            const name = path.basename(item);

            // Move the item from the old storage location to the new storage location.
            fs.moveSync(path.resolve(src, item), path.join(dest, name), {overwrite: true});

          });
        
        }
        
      },
      
      // Initialize backup utilities.
      BACKUP: {
        
        // Resolve the backup location for a given file or folder.
        resolve( src ) {
          
          // Get the parts of the file or folder;
          const basename = path.basename(src);
          const dirname = path.dirname(src);

          // Get the backup location.
          return path.resolve(dirname, `.backup.${basename}`);
          
        }
        
      },
      
      // Initialize user configuration utilities.
      CONFIG: {
        
        // Make sure the user configuration data is intialized if not already.
        init() {
          
          // Initialize the user configuration data if not already initialized.
          if( !THIS.CONFIG ) THIS.CONFIG = THIS.UTILS.CONFIG.load();
          
        },
        
        // Load the user configuration file.
        load() {
          
          // Try to load the user configuration file.
          try {

            // Read and parse the user configuration file.
            const data = yaml.parse(fs.readFileSync(THIS.UTILS.CONFIG.path(), 'utf8'));
            
            // Return the data.
            return data;
            
          }
          
          // Otherwise, catch any errors that occur.
          catch(error) {
            
            // Throw the error.
            throw utils.error.exception('USRCONF', error);
            
          }
          
        },
        
        // Update the user configuration file with the given data.
        update( data = {} ) {
          
          // Make sure user configuration data is initialized.
          THIS.UTILS.CONFIG.init();
          
          // Update the MYNCRC file's data.
          THIS.CONFIG = _.merge(THIS.CONFIG, data);
          
          // Generate a new MYNCRC file using the MYNCRC template and the updated data.
          const contents = mustache.render(THIS.TEMPLATES.mync, {CONFIG: yaml.stringify(THIS.CONFIG)});

          // Save the new MYNCRC file.
          fs.writeFileSync(path.resolve(THIS.UTILS.STORAGE.path(), 'mync.yaml'), contents);

        },
        
        // Get the user configuration file path.
        path() {
          
          // Return the user configuration file path.
          return path.resolve(THIS.UTILS.STORAGE.path(), 'mync.yaml');
          
        }
        
      }
      
    };
    
    // Define properties.
    this.ID = keygen.machineIdSync();
    this.USERNAME = username.sync();
    this.TEMPLATES = _.reduce(glob(path.resolve(CWD, 'templates/**/*')), (templates, file) => {
      
      // Get the template's name and extension.
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      
      // Get the template's contents.
      const template = fs.readFileSync(file, 'utf8');
      
      // Save the template by name.
      return _.set(templates, name, template);
      
    }, {});
    this.MYNCRC = {};
    this.CONFIG = {};
    this.STORAGE = this.UTILS.STORAGE.path;

    // Always initialize Mync unless the setup flag is given.
    if( !setup ) this.init();
    
    // Always verify that Mync is setup correctly.
   // this.VERIFIED = this.verify();
    
  }
  
  // Setup and configure Mync with user input.
  setup() {
    
    // Capture the instance's context.
    const THIS = this;
    
    // Initialize a promise.
    return new Promise((resolve, reject) => {
    
      // Prompt the user to configure their preferred storage location.
      const prompt = inquirer.prompt([
        {
          type: 'input',
          name: 'STORAGE_VOLUME',
          message: "Please, provide the storage volume that Mync will use. This should be a cloud drive that is shared across your workstations.",
          default: '~/.CMVolumes/Dropbox',
          validate(storage) {
            
            // Resolve the storage location.
            storage = THIS.UTILS.STORAGE.resolve(storage);

            // Validate that the given location exists.
            if( fs.existsSync(storage) ) return true;

            // Indicate that the location could not be found, and prompt the user again.
            return 'The given storage location cannot be found on your system. Please try again.';

          }
        },
        {
          type: 'input',
          name: 'STORAGE_DIRECTORY',
          message: "Please, provide the name of the storage directory that Mync will use.",
          default: 'Sync'
        }
      ]);

      // Use the provided storage location to setup Mync.
      prompt.then((MYNCRC) => {
        
        // Attempt to update the configurations and initialize Mync.
        try {

          // Save the configurations to the MYNCRC file.
          this.UTILS.MYNCRC.update(MYNCRC);

          // Then, initialize, register, and scaffold.
          this.register().scaffold().init();

          // Resolve.
          resolve();
          
        }
        
        // Otherwise, catch any errors that occurred.
        catch(error) {
          
          // Throw the error.
          reject(error);
          
        }

      }).catch((error) => {
        
        // Throw the error.
        reject(utils.error.exception('SETUPERR', error));
        
      });
      
    });
    
  }

  // Scaffold the file and folder structure for Mync if not already setup.
  scaffold() {
    
    // Ensure that the storage location exists.
    fs.ensureDir(this.STORAGE());
    
    // Ensure that the user configuration file exists.
    fs.ensureFile(this.UTILS.CONFIG.path());
    
    // Make this method chainable.
    return this;
    
  }
  
  // Initialize Mync by loading its properties.
  init() {
    
    // Load internal property data that requires setup and scaffolding to be completed first.
    this.MYNCRC = this.UTILS.MYNCRC.load();
    this.CONFIG = this.UTILS.CONFIG.load();
    
    // Make this method chainable.
    return this;
    
  }
  
  // Determine if the current system is registered with Mync.
  isRegistered() {
    
    // Assume the system is registered if the machine ID is found in the data store.
    return this.UTILS.METADATA.has();
    
  }
  
  // Register the system with Mync if not already registered.
  register() {
    
    // Only register the system if not already registered.
    if( !this.isRegistered() ) {
      
      // Get the current datetime.
      const now = new Date();
      
      // Initialize the system's data in the store.
      this.UTILS.METADATA.update({
        registered: now,
        registeredBy: this.USERNAME,
        modified: now,
        modifiedBy: this.USERNAME,
        synced: false,
        backup: false,
        storage: this.STORAGE()
      });
      
    }
    
    // Make this method chainable.
    return this;
    
  }
  
  // Unregister the system with Mync if registered.
  unregister() {
    
    // Only unregister the system if previously registered.
    if( this.isRegistered() ) {
      
      // Remove the system's data from the store.
      this.UTILS.METADATA.remove();
      
    }
    
  }
  
  // Determine if the current system is synced.
  isSynced() {
    
    // Check the data store to determine if the current system is synced.
    return this.UTILS.METADATA.get(`synced`);

  }
  
  // Determine if a backup exists for the current system.
  isBackedUp() {
    
    // Check the data store to determine if the current system is backed up.
    return this.UTILS.METADATA.get(`backup`);
    
  }
  
  // Get the storage location.
  get storage() {
    
    // Return the storage location.
    return this.STORAGE();
  
  }
  
  // Set the storage location.
  set storage( volume ) {
    
    // Only continue if the given storage location exists.
    if( fs.existsSync(path.resolve(volume)) ) {
    
      // Get the old storage location.
      const src = this.STORAGE();

      // Update the storage volume location.
      this.MYNCRC.STORAGE_VOLUME = volume;
      
      // Upate the MYNCRC file.
      this.UTILS.MYNCRC.update();

      // Get the new storage location.
      const dest = this.STORAGE();

      // Move the contents of the old storage location to the new storage location.
      this.UTILS.STORAGE.move(src, dest);
      
      // Update the storage location in metadata.
      this.UTILS.METADATA.update({storage: dest});
      
    }
    
    // Otherwise, throw an error.
    else throw utils.error.exception('NONEXIST');
  
  }
  
  // Open the MYNCRC configurations file for editing.
  config( app = null, wait = false ) {
    
    // Get the MYNCRC file location.
    const myncrc = this.UTILS.MYNCRC.path();
    
    // Attempt to open the MYNCRC file in the given app, if applicable, and return the promise.
    return open(myncrc, {app, wait});
    
  }
  
  // List the settings in the user configuration file.
  list() {
    
    // Return the user configurations as an associated list.
    return _.reduce(this.CONFIG, (list, Path, Config) => _.concat(list, {Config, Path}), []);
    
  }
  
  // Backs up the workstation's configurations.
  backup() {
    
    // Check if the system is already backed up, and if so, do nothing else.
    
    // Otherwise, check if the system is synced, and if so, unsync it now.
    
    // Get the contents of the user configuration.
    
    // Expand the the configuration paths.
    
    // Loop through the user configuration paths.
    
      // Get a list of the storage contents.
    
      // Locate the same configurations on the system. 
    
      // Create a backup copy of the configurations on the system.
    
    // Done.
    
  }
  
  
  sync() {/*
    
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
    
  */}
  
  unsync() {/*
    
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
    
  */}
  
  push( force, canceler ) {/*
    
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
    
  */}
  
  pull( force, canceler ) {/*
    
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
    
  */}
  
  restore() {/*
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Restor the user's system.
    backrup.restore().then((errors) => defer.resolve(errors)).fail((error) => defer.reject(error));
    
    // Return.
    return defer.promise();
    
  */}
  
  add() {/*
    
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
    
  */}
  
  remove( name ) {/*
    
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
    
  */}
  
}

// Export.
module.exports = {Mync};