/*
// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('./router.js')();
const logger    = require('./logger.js')();
const Deferred  = require('deferred-js');
const processr  = require('./processr.js');
const deepcopy  = require('deepcopy');
const username  = require('username');
const path      = require('path');
const {exec}    = require('child_process');

// Load configurations.
let config      = deepcopy(require('../data/config.json'));

// Define backrup.
class Backrup {
  
  constructor() {
    
    // Capture context.
    const self = this;
  
    // Get the system ID.
    self._id = keygen.machineIdSync();

    // Get path settings.
    self._root = config.storage.root;
    self._directory = config.storage.directory;
    self._storage = router.merge(`${self._root}/${self._directory}`);
    self._backup = router.merge(`${self._storage}/.backup`);
    self._system = router.merge(`${self._backup}/${self._id}`);
    self._settings = config.settings.map((setting) => {

      setting.dest = router.merge(setting.dest);
      setting.src = router.merge(`${self._system}/${setting.src}`);

      return setting;

    });

  }
  
  backup() { 
    
    // Capture context.
    const self = this;

    // Initialize deferred.
    const defer = new Deferred();

    // Create the backup folder if no backups have been stored previously.
    if( !fs.existsSync(self._backup) ) fs.mkdirSync(self._backup);

    // Delete the system backup folder if it currently exists.
    if( fs.existsSync(self._system) ) fs.removeSync(self._system);

    // Create the system backup folder.
    fs.mkdirSync(self._system);

    // Swap source and destination for settings to process correctly.
    const settings = self._settings.map((setting) => {

      const src   = setting.dest;
      const dest  = setting.src;

      setting.dest = dest;
      setting.src = src;

      return setting;

    });

    // Backup all settings.
    processr(settings, (type, src, dest) => {

      // Backup the setting.
      if( fs.existsSync(src) ) fs.copySync(src, dest);

    })
      .catch((error) => { defer.reject(error); })
      .then(() => defer.resolve());

    // Return promise.
    return defer.promise();

  }

  status() { 
    
    return fs.existsSync(this._system); 
  
  }

  restore() {
    
    // Capture context.
    const self = this;

    // Initialize deferred.
    const defer = new Deferred();
    
    // Prepare to capture any errors.
    const errors = [];

    // Restore all settings.
    processr(self._settings, (type, src, dest) => {

      // Make sure the source exists.
      if( fs.existsSync(src) ) {

        // Decipher ambiguous types.
        if( !['file', 'folder'].includes(type) ) type = fs.lstatSync(src).isDirectory() ? 'folder' : 'file';

        // Get the root of the destination.
        const root = dest.replace(/\/+$/, '').substring(0, dest.lastIndexOf('/'));

        // Determine if the destination exists.
        if( fs.existsSync(dest) ) {

          // Change owner of the destination.
          try { exec(`chown ${username.sync} ${dest}`); } catch(error) {

            try { exec(`sudo chown ${username.sync} ${dest}`); } catch(error) { 
              
              errors.push({
                error: error,
                src: src,
                dest: dest
              });
              
              return;
            
            }

          }

          // Change permissions of the destination.
          try { exec(`chmod -R 755 ${dest}`); } catch(error) {

            try { exec(`sudo chmod -R 755 ${dest}`); } catch(error) { 
            
              errors.push({
                error: error,
                src: src,
                dest: dest
              });
              
              return;
            
            }

          }

          // Remove the destination.
          try { fs.removeSync(dest); } catch(error) { 
          
            errors.push({
              error: error,
              src: src,
              dest: dest
            });
            
            return;
            
          }

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

      }

    })
      .catch((error) => defer.reject(error))
      .then(() => defer.resolve(errors));

    // Return promise.
    return defer.promise();

  }
  
}

// Export.
module.exports = {Backrup};*/