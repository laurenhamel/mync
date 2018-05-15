// Load dependencies.
const fs        = require('fs-extra');
const prompt    = require('prompt-async');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const mkdirp    = require('mkdirp');
const processr  = require('../processr.js');
const deepcopy  = require('deepcopy');
const {Errl}    = require('../errl.js');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Define `push` command.
module.exports = function push( options ) {
  
  // Get path data.
  const {root:_root, directory:_directory}   = config.storage;
  const _storage             = router.merge(`${_root}/${_directory}`);
  const _settings            = config.settings.map((setting) => {
    
    const src   = setting.dest = router.merge(setting.dest);
    const dest  = setting.src = router.merge(`${_storage}/${setting.src}`);
    
    setting.src = src;
    setting.dest = dest;
    
    return setting;
    
  });
  
    // Initialize error handler.
  const earl = new Errl();
  
  // Set errors messages.
  earl.says('NOSRC', (type) => `Source ${type} not found.`);
  
  // Initialize helper methods.
  const overwrite = async function( type, src, dest, defer = null ) {
    
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
    if( /^y(es)?$/.includes(overwrite) ) await write(type, src, dest, defer);

    // Skip the setting.
    else {

      // Alert the user that the setting has been skipped.
      if( options.verbose) logger.success(`Skipped '${dest}'.`);

      // Done.
      defer.resolve();

    }

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
      if( options.verbose) logger.success(`Pushed ${type} '${dest}' successfully.`);

    }
    
    // Otherwise, move on.
    else {
      
      // Set error.
      const error = {code: 'NOSRC'};
      
      // Alert the user that the source could not be found.
      logger.warning(`Skipped ${src}. ${earl.say(error.code, type)}`);
      
    }

    // Resolve.
    defer.resolve();

  };
  const push      = async function( type, src, dest ) {

    // Initialize deferred.
    const defer = new Deferred();

    // Overwrite.
    if( fs.existsSync(dest) && !options.overwrite ) await overwrite(type, src, dest, defer);

    // Write.
    else await write(type, src, dest, defer);

    // Return.
    return defer.promise();

  };
  const success   = function() {
    
    // Alert the user that the push was completed.
    logger.success('Push completed successfully.');
    
  };
  const fail      = function( error ) {

    // Handle errors.
    switch( error.message ) {
        
      case 'canceled': cancel(); break;
        
      default:
        
        // Alert the user that the push could not be completed due to errors.
        logger.error('Push failed. An error occurred. Please check your configurations and try again.');
        
    }
    
  };
  const cancel    = function() {
    
    // Alert the user that the push was canceled.
    logger.error('Push canceled. All unchanged settings in your storage were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };
  
  // Start the prompt.
  prompt.start();
  
  // Push all settings to storage.
  processr(_settings, push).then(() => success()).catch((error) => fail(error));

};