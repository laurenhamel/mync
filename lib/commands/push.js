// Load configurations.
let config    = require('../../data/config.json');

// Load dependencies.
const fs        = require('fs-extra');
const prompt    = require('prompt-async');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const mkdirp    = require('mkdirp');
const processr   = require('../processr.js');

// Define `push` command.
module.exports = function push( options ) {
  
  // Get path data.
  const {root, directory}   = config.storage;
  const storage             = router.merge(`${root}/${directory}`);
  const settings            = config.settings.map((setting) => {
    
    const src   = setting.dest = router.merge(setting.dest);
    const dest  = setting.src = router.merge(`${storage}/${setting.src}`);
    
    setting.src = src;
    setting.dest = dest;
    
    return setting;
    
  });
  
  // Initialize helper methods.
  const overwrite   = async function( type, src, dest, defer = null ) {
    
    // Initialize deferred.
    if( !defer ) defer = new Deferred();

    // Alert the user that the setting already exists.
    logger.warning(`'${dest}' already exists. Continuing will overwrite this ${type}.`);

    // Ask the user if the would like to overwrite the setting.
    logger.log('Do you wish to continue?');

    // Prompt the user for their response.
    const {overwrite} = await prompt.get([{
      name: 'overwrite', 
      required: true,
      default: 'no',
      message: 'Please enter `yes` or `no`.',
      pattern: /^y(es)?|n(o)?$/
    }]);

    // Proceed to copy the setting.
    if( ['yes', 'y'].includes(overwrite) ) await write(type, src, dest, defer);

    // Skip the setting.
    else {

      // Alert the user that the setting has been skipped.
      if( options.verbose) logger.success(`Skipped ${type} '${dest}'.`);

      // Done.
      defer.resolve();

    }

  };
  const write       = async function( type, src, dest, defer = null ) {

    // Initialize deferred.
    if( !defer ) defer = new Deferred();

    // Make sure the source file exists.
    if( fs.existsSync(src) ) {

      // Create a placeholder.
      switch(type) {

        case 'file':

          // Get parent folder(s).
          const parent = dest.replace(/\/+$/, '').substring(0, dest.lastIndexOf('/'));

          // Create directory structure.
          if( !fs.existsSync(parent) ) mkdirp.sync(parent);

          // Create an empty file.
          fs.writeFileSync(dest);

          break;

        case 'folder':

          // Create an empty folder.
          fs.mkdirSync(dest);

          break;

      }

      // Copy the setting.
      fs.copySync(src, dest);

      // Alert the user that the setting has been copied.
      if( options.verbose) logger.success(`Pushed ${type} '${dest}' successfully.`);

    }

    // Done
    defer.resolve();

  };
  const push        = async function( type, src, dest ) {

    // Initialize deferred.
    const defer = new Deferred();

    // Overwrite.
    if( fs.existsSync(dest) && !options.overwrite ) await overwrite(type, src, dest, defer);

    // Write.
    else await write(type, src, dest, defer);

    // Return.
    return defer.promise();

  };
  
  // Start the prompt.
  prompt.start();
  
  // Push all settings to storage.
  processr(settings, push).then(() => {
          
    // Alert the user that the push was completed.
    logger.success('Push completed successfully.');
    
  }).catch((error) => {
    
    // Handle errors.
    switch( error.message ) {
        
      case 'canceled':
        
        // Alert the user that the push was canceled.
        logger.error('Push operation canceled. Your existing settings were left intact.');
        
        break;
        
      default:
        
        // Alert the user that the push could not be completed due to errors.
        logger.error('Push could not be completed. An error occurred. Please check your configurations and try again.');
        
    }
    
  });

};