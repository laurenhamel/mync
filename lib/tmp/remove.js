// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

module.exports = function remove( name ) {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Initialize helper methods.
  const success = function() {
    
    // Alert the user that the setting was removed.
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
  if( !name ) logger.error('Cannot remove setting without a name. See `mync --help`.');

  // Otherwise, remove the setting by name.
  else mync.remove(name).then(() => success()).catch((error) => fail(error));
  
};