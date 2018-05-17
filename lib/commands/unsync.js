// Load dependencies.
const logger    = require('../logger.js')();
const {Errl}    = require('../errl.js');
const {Mync}    = require('../mync.js');

// Define `unsync` command.
module.exports = function unsync( options ) {
  
  // Initialize utilies.
  const earl = new Errl();
  const mync = new Mync();
  
  // Initialize helper methods.
  const success = function( results ) {
    
    // Report results.
    if( options.verbose ) {
      
      // Alert user of the results.
      results.forEach((result) => logger[result.type](result.message));
      
    }

    // Alert the user that the sync was completed.
    logger.success('Unsync completed successfully.');

  };
  const fail = function( error ) {
    
    // Alert the user that the sync was canceled.
    if( error.message == 'canceled' ) cancel(error);

    // Alert the user that the sync could not be completed due to errors.
    else logger.error(`Unsync could not be completed. ${earl.say(error.code)}`);

  };
  const cancel    = function( error = {} ) {

    // Alert the user that the restore was canceled.
    logger.error(`Unsync canceled. ${earl.say(error.code)}`);

    // Exit the process.
    process.exit(1);

  };

  // Unsync.
  mync.unsync().then((results) => success(results)).catch((error) => fail(error));
  
};