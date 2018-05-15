// Load dependencies.
const prompt    = require('prompt-async');
const logger    = require('../logger.js')();
const router    = require('../router.js')();
const fs        = require('fs-extra');
const path      = require('path');
const deepcopy  = require('deepcopy');
const Deferred  = require('deferred-js');
const {Errl}    = require('../errl.js');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

module.exports = function remove( name ) {
  
  // Get configuration data.
  let _settings = config.settings;
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set error messages.
  earl.says('NONEXIST', (name) => `A setting with the name ${name} was not found.`);
  
  // Start the prompt.
  prompt.start();
  
  // Initialize helper methods.
  const confirm   = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();

    // Ask the user to confirm before proceeding.
    logger.warning('Continuing will delete the existing settings.');

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
      if( /^y(es)?$/.test(overwrite) ) defer.resolve();

      // Otherwise, cancel.
      else throw {message: 'canceled'};
      
    } catch(error) { throw error; }

  };
  const remove = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Look for the setting with the given name.
    const match = _settings.filter((setting) => setting.name == name )[0];

    // Make sure the setting exists.
    if( match ) {
      
      // Show the user of the match data.
      logger.warning(`The following setting was found:`);
      logger.warning(`name: ${match.name}`);
      logger.warning(`src: ${match.src}`);
      logger.warning(`dest: ${match.dest}`);
      logger.warning(`files: ${match.files.join(', ')}`);
      logger.warning(`folders: ${match.folders.join(', ')}`);
      
      // Attempt to remove the setting.
      try {
        
        // Force the user to confirm the deletion.
        await confirm();
        
        // Delete the setting.
        _settings = _settings.filter((setting) => {
          
          return setting.name != match.name &&
                 setting.src != match.src &&
                 setting.dest != match.dest;
          
        });

      } catch(error) { throw error; }
      
    }
    
    // Otherwise, exit.
    else throw {code: 'NONEXIST'};
    
  };
  const success = function() {
    
    // Merge the remaining settings.
    config.settings = _settings;
    
    // Save the file.
    fs.writeJsonSync('./data/config.json', config, {spaces: 2});
    
    // Alert the user that the new setting was added.
    logger.success('Setting removed successfully.');
    
  };
  const fail = function( error ) {

    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Could not remove existing setting from configuration file. ${earl.say(error.code)}`);
    
  };
  const cancel = function() {
    
    // Alert the user that something was canceled.
    logger.error('Removal canceled. All unchanged settings were left intact.');
    
  };

  // Make sure a name was given.
  if( !name ) {
    
    logger.error('Cannot remove setting without a name. See `mync --help`.');
    
  }

  // Remove the setting by name.
  else {
    
    // Remove an existing setting from the configuration file.
    remove().then(() => success()).catch((error) => fail(error));
    
  }
  
};