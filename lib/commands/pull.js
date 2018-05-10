// Load configurations.
let config    = require('../../data/config.json');

// Load dependencies.
const fs        = require('fs-extra');
const prompt    = require('prompt-async');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const processr  = require('../processr.js');
const mkdirp    = require('mkdirp');
const username  = require('username');
const path      = require('path');
const {Errl}    = require('../errl.js');
const {exec}    = require('child_process');

// Load utilities.
require('../prototypes.js');

// Define `pull` command.
module.exports = function pull( options ) {
  
  // Get path data.
  const {root, directory}   = config.storage;
  const storage             = router.merge(`${root}/${directory}`);
  const settings            = config.settings.map((setting) => {
    
    setting.dest = router.merge(setting.dest);
    setting.src = router.merge(`${storage}/${setting.src}`);
    
    return setting;
    
  });
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set errors messages.
  earl
      .says('NOSRC', (type) => `Source ${type} not found.`);
  
  // Initialize helper methods.
  const overwrite = async function( type, src, dest, defer = null ) {
    
    // Initialize deferred.
    if( !defer ) defer = new Deferred();

    // Alert the user that the setting already exists.
    logger.warning(`'${dest}' already exists. Continuing will overwrite this ${type}.`);

    // Ask the user if the would like to overwrite the setting.
    logger.log('Do you wish to continue?');
    
    // Require the user to confirm their intent.
    try {

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
        if( options.verbose) logger.success(`Skipped '${dest}'.`);

        // Resolve.
        defer.resolve();

      }
      
    } catch(error) { 
      
      // Handle errors.
      switch( error.message ) {
          
        case 'canceled': cancel(); break;
          
        default: logger.warning(`Skipped ${dest}. ${earl.say(error.code)}`);
        
      }
      
      // Resolve.
      defer.resolve();
      
    }

  };
  const write     = async function( type, src, dest, defer = null ) {

    // Initialize deferred.
    if( !defer ) defer = new Deferred();

    // Make sure the source exists.
    if( fs.existsSync(src) ) {
      
      // Determine the placeholder type.
      let placeholder = type;
      
      // Decipher ambiguous placeholder types.
      if( !['file', 'folder'].includes(placeholder) ) placeholder = fs.lstatSync(src).isDirectory() ? 'folder' : 'file';
      
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
      switch(placeholder) {

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
      if( options.verbose) logger.success(`Pulled ${type} '${dest}' successfully.`);

    }
    
    // Otherwise, move on.
    else {
      
      // Set the error.
      const error = {code: 'NOSRC'};
      
      // Alert the user that source does not exist.
      if( options.versbose ) logger.warning(`Skipped '${src}'. ${earl.say(error.code)}`);
      
    }

    // Resolve.
    defer.resolve();

  };
  const pull      = async function( type, src, dest ) {

    // Initialize deferred.
    const defer = new Deferred();

    // Start pulling.
    try {
      
      // Overwrite.
      if( fs.existsSync(dest) && !options.overwrite ) await overwrite(type, src, dest, defer);

      // Write.
      else await write(type, src, dest, defer);
      
    } catch(error) { 
      
      // Alert the user that the setting could not be pulled.
      if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code)}`);
      
      // Resolve.
      defer.resolve();
      
    }

    // Return.
    return defer.promise();

  };
  const success   = function() {
    
    // Alert the user that the pull was completed.
    logger.success('Pull completed successfully.');
    
  };
  const fail      = function( error ) {
    
    // Handle errors.
    switch( error.message ) {
        
      case 'canceled': cancel(); break;
      
      // Alert the user that the push could not be completed due to errors.  
      default: logger.error('Pull could not be completed. An error occurred. Please check your configurations and try again.');
        
    }
    
  };
  const cancel    = function() {
    
    // Alert the user that the pull was canceled.
    logger.error('Pull operation canceled. All unchanged settings on your workstation were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };
  
  // Start the prompt.
  prompt.start();
  
  // Pull all settings to workstation.
  processr(settings, pull).then(() => success()).catch((error) => fail(error));

};