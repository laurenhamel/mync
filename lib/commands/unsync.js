// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const processr  = require('../processr.js');
const username  = require('username');
const path      = require('path');
const deepcopy  = require('deepcopy');
const {exec}    = require('child_process');
const {Errl}    = require('../errl.js');
const {Backrup} = require('../backrup.js');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Load utilities.
require('../prototypes.js');

// Define `unsync` command.
module.exports = function unsync( options ) {
  
  // Get the system ID.
  const id = keygen.machineIdSync();
  
  // Get path data.
  const {root:_root, directory:_directory} = config.storage;
  const _storage = router.merge(`${_root}/${_directory}`);
  const _backup = router.merge(`${_storage}/.backup`);
  const _system = router.merge(`${_backup}/${id}`);
  const _settings = config.settings.map((setting) => {
    
    setting.dest  = router.merge(setting.dest);
    setting.src   = router.merge(`${_storage}/${setting.src}`);
    
    return setting;
    
  });
  const _synced = router.merge(`${_storage}/.synced.json`);
  
  // Get the synced data.
  const data = fs.existsSync(_synced) ? require(_synced) : {};
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set errors messages.
  earl
      .says('BADSYM', (type) => `${type.toCapitalize()} not synced with source.`)
      .says('NOSYM', (type) => `${type.toCapitalize()} not synced.`)
      .says('NOSYNC', (type) => `${type.toCapitalize()} not synced.`)
      .says('NONEXIST', (type) => `${type.toCapitalize()} does not exist.`)
      .says('NOSRC', (type) => `Source ${type} not found.`);
  
  // Initialize backup system.
  const backrup = new Backrup();
  
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
    if( data[id] ) {
      
      // Lookup the synced settings.
      unsyncable = data[id].filter((setting) => setting.src == src && setting.dest == dest)[0].synced;
      
    }
    
    // Only unsync if previously synced.
    if( unsyncable ) {
    
      // Verify that the source exists.
      if( fs.existsSync(src) ) {

        try {

          // Generate a symlink.
          await unsymlink(type, src, dest);

          // Alert user that the setting was unsynced.
          if( options.verbose ) logger.success(`Unsynced '${dest}' successfully.`);

        }

        catch(error) {

          // Alert user of errors.
          if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);

        }

        // Resolve.
        defer.resolve();

      }

      // Otherwise, move on.
      else {

        // Set error.
        const error = {code: 'ENOSRC'};

        // Alert user of missing setting.
        if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);

        // Resolve.
        defer.resolve();

      }
      
    }
    
    // Otherwise, move on.
    else {
      
      // Set the error.
      const error = {code: 'NOSYNC'};
      
      // Alert user of unsyncable setting.
      if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);
      
      // Resolve.
      defer.resolve();
      
    }
    
    // Return.
    return defer.promise();
    
  };
  const save = function( file, data ) {
    
    // Create the sync file if needed.
    if( !fs.existsSync(file) ) fs.writeFileSync(file);
    
    // Remove the synced data for the system.
    if( data[id] ) delete data[id];
    
    // Save data to the file.
    fs.writeJsonSync(file, data, {spaces: 2});
    
  };
  const success = function() {
    
    // Alert the user that the unsync was completed.
    logger.success('Unsync completed successfully.');
    
    // Save the synced data.
    save(_synced, data);
    
  };
  const fail = function( error ) {
    
    switch( error.message ) {
        
      case 'canceled':
        
        // Alert the user that the unsync was canceled.
        logger.error('Unsync operation canceled.');
        
        break;
        
      default:
        
        // Alert the user that the unsync could not be completed due to errors.
        logger.error('Unsync could not be completed. An error occurred. Please check your configurations and try again.');
        
    }
    
  };
  
  // Use synced data if available.
  if( data[id] ) {
    
    // Unsync all synced data.
    processr(data[id], unsync).then(() => success()).catch((error) => fail(error));
    
  }
  
  // Otherwise, use settings.
  else {
    
    // Unsync all settings
    processr(_settings, unsync).then(() => success()).catch((error) => fail(error));
    
  }
  
};