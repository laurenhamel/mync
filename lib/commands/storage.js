// Load dependencies.
const logger    = require('../logger.js')();
const router    = require('../router.js')();
const fs        = require('fs-extra');
const path      = require('path');
const deepcopy  = require('deepcopy');
const Deferred  = require('deferred-js');
const {Errl}    = require('../errl.js');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Define `storage` command.
module.exports = function storage( storage ) {
  
  // Get configuration data.
  let {root:_root, directory:_directory} = config.storage;
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set error messages.
  earl
    .says('SAME', 'Storage location is already set to the given path.')
    .says('NONEXIST', 'The given path does not exist.');
  
  // Initialize helper methods.
  const change = function() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Get paths.
    let path = {
      old: router.merge(_root),
      new: router.merge(storage)
    };

    // Location is already set.
    if( path.old == path.new ) defer.reject({code: 'SAME'});

    // Location can be changed.
    else {

      // Valid location given.
      if( fs.existsSync(path.new) ) {

        try { 
          
          // Update the configurations.
          config.storage.root = _root = storage;

          // Save the file.
          fs.writeJsonSync('./data/config.json', config, {spaces: 2});

          // Set storage directory.
          storage = router.merge(`${_root}/${_directory}`);

          // Create storage directory.
          if( !fs.existsSync(storage) ) fs.mkdirSync(storage);

          // Resolve.
          defer.resolve();

        } catch(error) { defer.reject(error); }

      }

      // Invalid location given.
      else defer.reject({code: 'NONEXIST'});

    }
    
    // Return.
    return defer.promise();
    
  };
  const success = function() {
    
    // Alert the user that the storage location was updated.
    logger.success('Storage location updated successfully.');
    
  };
  const fail = function( error ) {
    
    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Storage location could not be changed. ${earl.say(error.code)}`);
    
  };
  const cancel = function() {
    
    // Alert the user that something was canceled.
    logger.fail('Storage location change canceled. All unchanged settings were left intact.');
    
  };
  
  // Output the current storage configuration.
  if( !storage ) {
    
    // Output storage.
    logger.queue(router.merge(`${_root}/${_directory}`), 'blue').out();
    
  }
  
  // Update the storage configuration.
  else {

    // Change storage location.
    change().then(() => success()).fail((error) => fail(error));
    
  }
  
};