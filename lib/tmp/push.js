// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

// Define `push` command.
module.exports = function push( options ) {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Initialize helper methods.
  const success   = function( results ) {
    
    // Alert the user of any results.
    if( options.verbose ) {
      
      results.forEach((result) => logger[result.type](result.message));
      
    }
    
    // Alert the user that the push was completed.
    logger.success('Push completed successfully.');
    
  };
  const fail      = function( error ) {
    
    // Alert the user that the push was canceled.
    if( error.message == 'canceled' ) cancel();
      
    // Alert the user that the push could not be completed due to errors.  
    else logger.error(`Push failed. ${earl.say(error.code)}`);
    
  };
  const cancel    = function() {
    
    // Alert the user that the pull was canceled.
    logger.error('Push canceled. All unchanged settings in your storage were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };
  
  // Push.
  mync.push((options.overwrite || false), cancel).then((results) => success(results)).catch((error) => fail(error));

};