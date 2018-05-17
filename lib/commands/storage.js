// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

// Load utilities.
require('../prototypes.js');

// Define `storage` command.
module.exports = function storage( storage ) {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Set error messages.
  earl.says('SAME', 'Storage location is already set to the given path.')
      .says('NONEXIST', 'The path does not exist.');
  
  // Initialize helper methods.
  const success = function() {
    
    // Alert the user that the storage location was updated.
    logger.success('Storage location updated successfully.');
    
  };
  const fail = function( error ) { 
    
    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Storage location could not be changed. ${error.message}`);
    
  };
  const cancel = function() {
    
    // Alert the user that something was canceled.
    logger.fail('Storage location change canceled. All unchanged settings were left intact.');
    
  };
  
  // Output the current storage configuration.
  if( !storage ) logger.queue(mync.storage, 'blue').out();
  
  // Update the storage configuration.
  else {
    
    // Set the storage location.
    try {
      
      mync.storage = storage;
      
      success();
    
    } catch(error) { fail(error); }
    
  }
  
};