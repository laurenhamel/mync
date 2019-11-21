// Load dependencies.
const utils = require('../utils');
const {Mync} = require('../mync.js');
const _ = require('lodash');

// Define `storage` command.
module.exports = ( storage ) => {
  
  // Initialize Mync.
  const mync = new Mync();
  
  // Register error messages.
  utils.error.register('SAME', 'The storage location is already set to the given path.')
             .register('NONEXIST', 'The given storage location does not exist.');
  
  
  // Get the storage location.
  if( _.isNil(storage) ) utils.log.message(mync.storage, 'cyan');
  
  // Otherwise, set the storage location.
  else {
    
    // Attempt to update the storage location.
    try {
    
      // Set the new storage location.
      mync.storage = storage;

      // Output a success message.
      utils.log.success('Storage location updated succesfully.');
      
    } catch( error ) {
      
      // Output an error message.
      utils.log.fail(error.message);
      
    }
    
  }
  
};