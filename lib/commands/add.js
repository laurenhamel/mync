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

module.exports = function add() {
  
  // Get configuration data.
  let _settings = config.settings;
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Start the prompt.
  prompt.start();
  
  // Initialize helper methods.
  const overwrite = async function( data, identical, defer = null ) {
    
    // Initialize deferred.
    if( !defer ) defer = new Deferred();
    
    // Warn the user that an identical setting already exists.
    logger.warning('A setting with the given destination already exists.');

    // Output the identical data.
    logger.warning(`name: ${identical.name}`);
    logger.warning(`src: ${identical.src}`);
    logger.warning(`dest: ${identical.dest}`);

    // Warn the user about continuing.
    logger.warning('Continuing will overwrite this setting.');

    // Ask the user to confirm.
    logger.log('Do you want to continue?');

    // Get the user's confirmation.
    const {overwrite} = await prompt.get([{
      name: 'overwrite',
      default: 'no',
      required: true,
      message: 'Please enter `yes` or `no`.',
      pattern: /^y(es)?|n(o)?$/
    }]);

    // Continue with overwriting the setting.
    if( /^y(es)?$/.test(overwrite) ) {
    
      // Delete the identical entry.
      _settings = _settings.filter((setting) => {

        return setting.name != identical.name &&
               setting.src != identical.src &&
               setting.dest != identical.dest;

      });
  
      // Add the new setting.
      await write(data, defer);
      
    }

    // Otherwise, exit.
    else defer.reject({message: 'canceled'});
    
  };
  const write = async function( data, defer = null ) {
    
    // Initialize deferred.
    if( !defer ) defer = new Deferred();

    // Add the new setting.
    _settings.push({
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
    
    // Resolve.
    defer.resolve();
    
  };
  const add = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();
      
    // Get data from the user.
    try { 
      
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
      const identical = _settings.filter((setting) => setting.dest == data.dest)[0];
      
      // Verify that a similar setting does not already exist.
      if( !identical ) await write(data, defer);

      // Otherwise, overwrite the existing setting.
      else await overwrite(data, identical, defer);
      
    } catch(error) { throw error; }
    
  };
  const success = function() {
    
    // Merge the new settings.
    config.settings = _settings;
    
    // Save the file.
    fs.writeJsonSync('./data/config.json', config, {spaces: 2});
    
    // Alert the user that the new setting was added.
    logger.success('Setting added successfully.');
    
  };
  const fail = function( error ) {
    
    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Could not add new setting to configuration file. ${earl.say(error.code)}`);
    
  };
  const cancel = function() {
    
    // Alert the user that something was canceled.
    logger.error('Addition canceled. All unchanged settings were left intact.');
    
  };
  
  // Add a new setting to the configuration file.
  add().then(() => success()).catch((error) => fail(error));
  
};