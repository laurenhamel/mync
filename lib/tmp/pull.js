// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

// Define `pull` command.
module.exports = function pull( options ) {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Initialize helper methods.
  const success   = function( results ) {
    
    // Alert the user of any results.
    if( options.verbose ) {
      
      results.forEach((result) => logger[result.type](result.message));
      
    }
    
    // Alert the user that the pull was completed.
    logger.success('Pull completed successfully.');
    
  };
  const fail      = function( error ) {
    
    // Alert the user that the pull was canceled.
    if( error.message == 'canceled' ) cancel();
      
    // Alert the user that the pull could not be completed due to errors.  
    else logger.error(`Pull failed. ${earl.say(error.code)}`);
    
  };
  const cancel    = function() {
    
    // Alert the user that the pull was canceled.
    logger.error('Pull canceled. All unchanged settings on your workstation were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };

  // Pull.
  mync.pull((options.overwrite || false), cancel).then((results) => success(results)).catch((error) => fail(error));

};