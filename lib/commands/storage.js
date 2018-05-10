// Load configurations.
let config = require('../../data/config.json');

// Load dependencies.
const logger    = require('../logger.js')();
const router    = require('../router.js')();
const fs        = require('fs-extra');
const untildify = require('untildify');
const path      = require('path');

// Define `storage` command.
module.exports = function storage( storage ) {
  
  // Extract the storage configurations.
  let {root, directory} = config.storage;
  
  // Output the current storage configuration.
  if( !storage ) {
    
    // Output storage.
    logger.queue(router.merge(`${root}/${directory}`), 'blue').out();
    
  }
  
  // Update the storage configuration.
  else {

    // Get location preferences.
    let location = {
      old: untildify(router.merge(root)),
      new: untildify(router.merge(storage))
    };

    // Location is already set.
    if( location.old == location.new ) {

      // Output a status message.
      logger.success('Storage location is already set.');

    }

    // Location can be changed.
    else {

      // Valid location given.
      if( fs.existsSync(location.new) ) {

        // Update the configurations.
        config.storage.root = root = storage;

        // Save the file.
        fs.writeJsonSync('./data/config.json', config, {spaces: 2});

        // Output a status message.
        logger.success('Storage location updated successfully.');

        // Set storage directory.
        storage = router.merge(`${root}/${directory}`);

        // Create storage directory.
        if( !fs.existsSync(storage) ) {

          fs.mkdirSync(storage, (error) => {

            // Output error message.
            if( error ) logger.error('Storage directory could not be created.');

            // Output success message.
            else logger.success('Storage directory created successfully.');

          });

        }

        // Storage directory already exists.
        else {

          // Output status message.
          logger.success('Storage directory already exists.');

        }

      }

      // Invalid location given.
      else {

        // Output a status message.
        logger.error('Storage location could not be changed. Invalid path given.');

      }

    }
    
  }
  
};