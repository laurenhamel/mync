#!/usr/bin/env Node

// Load dependencies.
const logger    = require('./logger.js')();
const router    = require('./router.js')();
const fs        = require('fs-extra');
const path      = require('path');
const deepcopy  = require('deepcopy');
const Deferred  = require('deferred-js');
const prompt    = require('prompt-async');
const {exec}    = require('child_process');

// Load configurations.
let config      = deepcopy(require('../data/config.json'));

// Get configuration data.
let {root:_root, directory:_directory} = config.storage;
let _storage = router.merge(`${_root}/${_directory}`);
let _config = path.resolve(__dirname, '../data/config.json');

// Initialize helper methods.
const setup = async function() {
  
  // Initialize deferred.
  const defer = new Deferred();
  
  // Walk the user through the setup process.
  try {
    
    // Inform the user about the setup process.
    logger.queue("This utility will help you setup Mync.")
          .queue("")
          .delimit(" ")
          .queue("When you're done, use")
          .queue("`mync backup`", 'bold')
          .delimit("\n")
          .queue("to backup your workstation.")
          .delimit(" ")
          .queue("Then, use")
          .queue("`mync push`", 'bold') 
          .delimit("\n")
          .queue("to add your workstation's settings to storage.")
          .delimit(" ")
          .queue("Afterwards, you can use")
          .queue("`mync sync`", 'bold')
          .delimit("\n")
          .queue("on all your Macs to start syncing with Mync.")
          .queue("")
          .queue("Let's get started.")
          .out();
    
    // Prompt the user for some information.
    const {storage, config} = await prompt.get([
      {
        name: 'storage',
        required: true,
        default: _root,
        description: 'Enter your preferred storage location',
      },
      {
        name: 'config',
        required: true,
        default: 'no',
        pattern: /^y(es)?|n(o)?$/,
        message: 'Please enter `yes` or `no`.',
        description: 'Do you wish to edit the configuration file now?'
      }
    ]);
    
    // Detect changes to storage.
    if( storage && storage != _root ) await change();
      
    // Start syncing the configuration file. 
    await sync();
    
    // Open the configuration file if requested.
    if( /^y(es)?$/.test(config) ) {
      
      // Ask the user if they'd like to specify an app to open the configuration file.
      const {app} = await prompt.get({
        name: 'app',
        required: false,
        description: "Choose an app to open the `.json` file or leave it blank to use the system default"
      });
      
      // Open the configuration file.
      await open( app );
      
    }
    
    // Resolve.
    defer.resolve();
    
  } catch(error) { defer.reject(error); }
  
  // Return.
  return defer.promise();
  
};
const change = async function() {
  
  // Initialize deferred.
  const defer = new Deferred();
  
  // Get paths.
    let path = {
      old: router.merge(_root),
      new: router.merge(storage)
    };
  
  // Verify that the path exists.
  if( fs.existsSync(path.new) ) {
    
    try {
      
      // Update the configurations.
      config.storage.root = _root = storage;
      
      // Save the file.
      fs.writeJsonSync('../data/config.json', config, {spaces: 2});
      
      // Set storage directory.
      storage = _storage = router.merge(`${_root}/${_directory}`);
      
      // Create storage directory.
      if( !fs.existsSync(storage) ) fs.mkdirSync(storage);

      // Resolve.
      defer.resolve();
      
    } catch(error) { defer.reject(error); }
    
  }
  
  // Return.
  return defer.promise();
  
};
const sync = async function() {
  
  // Initialize deferred.
  const defer = new Deferred();
  
  // Get the paths.
  const _src = _config;
  const _dest = router.merge(`${_storage}/.config.json`);
  const _backup = `${_src}.backup`;
  const _default = `${_src}.default`;
  
  // Check if the configuration file is a symbolic link.
  if( fs.lstatSync(_src).isSymbolicLink() ) {
    
    // Remove the link.
    fs.removeSync(_src);
    
    // Attempt to restore the configuration file from the backup file.
    if( fs.existsSync(_backup) && !fs.lstatSync(_backup).isSymbolicLink() ) fs.copySync(_backup, _src);
    
    // Otherwise, restore the configuration file from the default.
    else fs.copySync(_default, _src);
    
  }
  
  // Delete any backups that may exists.
  if( fs.existsSync(_backup) ) fs.removeSync(_backup);
  
  // Backup the configuration file.
  fs.copySync(_src, _backup);
  
  // Copy the configuration file to storage if one doesn't already exist.
  if( !fs.existsSync(_dest) ) fs.copySync(_src, _dest);
  
  // Delete the configuration file.
  fs.removeSync(_src);
  
  // Link the stored configuration file back to Mync.
  fs.symlinkSync(_dest, _src);
  
  // Resolve.
  defer.resolve();
  
  // Return.
  return defer.promise();
  
};
const open = async function( app ) {
  
  // Initialize deferred.
  const defer = new Deferred();
  
  // Open the configuration file in the default app.
  if( !app || app == 'default' ) exec(`open ${_config}`);
  
  // Otherwise, open the configuration file in the preferred app.
  else exec(`open -a "${app}" ${_config}`);
  
  // Resolve.
  defer.resolve();
  
  // Return.
  return defer.promise();
  
};
const success = function() {
  
  // Alert the user that setup was completed.
  logger.queue('Setup completed successfully. Mync is ready to use.', 'green')
        .delimit(' ')
        .queue('Use', 'green')
        .queue('`mync --help`', 'green', 'bold')
        .queue('at any time for more information on usage.', 'green')
        .out();
  
};
const fail = function( error ) { console.log(error);
  
  if( error.message == 'canceled' ) cancel();
  
  else logger.error(`Setup failed.`);
  
};
const cancel = function() {
  
  // Alert the user that the setup was canceled.
  logger.error('Setup canceled.');
  
};

// Run the setup.
setup().then(() => success()).catch((error) => fail(error));