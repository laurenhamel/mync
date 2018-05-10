// Load configurations.
let config    = require('../../data/config.json');

// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const backrup   = require('../backrup.js')();
const Deferred  = require('deferred-js');
const processr  = require('../processr.js');
const username  = require('username');
const {exec}    = require('child_process');
const {Errl}      = require('../errl.js');

// Load utilities.
require('../prototypes.js');

// Define `sync` command.
module.exports = function sync( options ) {
  
  // Get the system ID.
  const id = keygen.machineIdSync();
  
  // Get path data.
  const {root, directory}   = config.storage;
  const storage             = router.merge(`${root}/${directory}`);
  const backup              = router.merge(`${storage}/.backup`);
  const system              = router.merge(`${backup}/${id}`);
  const settings            = config.settings.map((setting) => {
    
    setting.dest  = router.merge(setting.dest);
    setting.src   = router.merge(`${storage}/${setting.src}`);
    
    return setting;
    
  });
  const synced              = router.merge(`${storage}/.synced.json`);
  
  // Get the synced data.
  const data = fs.existsSync(synced) ? require(synced) : {};
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set errors messages.
  earl.says('NOSRC', (type) => `Source ${type} not found.`);
  
  // Make sure the system is backed up.
  if( !fs.existsSync(system) ) backrup.backup();
  
  // Initialize the synced data for the current system.
  data[id] = [];
  
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
    
    // Initialize an error message.
    let message = '';
    
    // Verify that the source exists.
    if( fs.existsSync(src) ) {
      
      try {
        
        // Generate a symlink.
        await symlink(type, src, dest);
        
        // Alert user that the setting was synced.
        if( options.verbose ) logger.success(`Synced '${dest}' successfully.`);
        
        // Add synced data.
        data[id].push({
          src: src,
          dest: dest,
          synced: true
        });
        
      }
      
      catch(error) {
        
        // Alert user of errors.
        if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);
        
        // Add synced data.
        data[id].push({
          src: src,
          dest: dest,
          synced: false,
          error: message === '' ? true : message
        });
        
      }
      
      // Resolve.
      defer.resolve();
    
    }
    
    // Otherwise, move on.
    else {
      
      // Set the error.
      const error = {code: 'NOSRC'};
      
      // Alert user of missing setting.
      if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);
      
      // Add synced data.
      data[id].push({
        src: src,
        dest: dest,
        synced: false,
        error: message
      });
      
      // Resolve.
      defer.resolve();
      
    }
    
    // Return.
    return defer.promise();
    
  };
  const save = function( file, data ) {
    
    // Create the sync file if needed.
    if( !fs.existsSync(file) ) fs.writeFileSync(file);
    
    // Save data to the file.
    fs.writeJsonSync(file, data, {spaces: 2});
    
  };
  const success = function() {
    
    // Alert the user that the sync was completed.
    logger.success('Sync completed successfully.');
    
    // Save the synced data.
    save(synced, data);
    
  };
  const fail = function( error ) {
    
    switch( error.message ) {
        
      case 'canceled':
        
        // Alert the user that the sync was canceled.
        logger.error('Sync operation canceled.');
        
        break;
        
      default:
        
        // Alert the user that the sync could not be completed due to errors.
        logger.error('Sync could not be completed. An error occurred. Please check your configurations and try again.');
        
    }
    
  };
  
  // Sync all settings.
  processr(settings, sync).then(() => success()).catch((error) => fail(error));
  
};