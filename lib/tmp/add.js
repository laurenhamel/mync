// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

module.exports = function add() {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Initialize helper methods.
  const success = function() {
    
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
  mync.add().then(() => success()).catch((error) => fail(error));
  
};