// Load dependencies.
const prompt    = require('prompt-async');
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const processr  = require('../processr.js');
const {Errl}    = require('../errl.js');
const {Backrup} = require('../backrup.js');

// Load utilities.
require('../prototypes.js');

// Define `restore` command.
module.exports = function restore( options ) {
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Set errors messages.
  earl
    .says('NOBACKUP', 'No backup for your workstation was not found.');
  
  // Initialize backup system.
  const backrup = new Backrup();
  
  // Initialize helper methods.
  const confirm   = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();

    // Ask the user to confirm before proceeding.
    logger.warning('Continuing will overwrite any existing settings on your workstation.');

    // Ask the user if the would like to overwrite the setting.
    logger.log('Do you wish to continue?');
    
    // Require the user to confirm their intent.
    try {

      // Prompt the user for their response.
      const {overwrite} = await prompt.get([{
        name: 'overwrite', 
        required: true,
        default: 'no',
        message: 'Please enter `yes` or `no`.',
        pattern: /^y(es)?|n(o)?$/
      }]);

      // Proceed to copy the setting.
      if( /^y(es)?$/.test(overwrite) ) defer.resolve();

      // Otherwise, cancel.
      else defer.reject({message: 'canceled'});
      
    } catch(error) { defer.reject(error); }

  };
  const restore   = async function() {

    // Initialize deferred.
    const defer = new Deferred();

    // Verify that system backup folder exists.
    if( backrup.status() === true ) {
      
      // Attempt to restore the user's system.
      try { 
        
        // Force the user to confirm their intent.
        await confirm(); 
        
        // Restore the user's system.
        backrup.restore()
          .then((errors) => defer.resolve(errors))
          .fail((error) => defer.reject(error));
        
      } catch(error) { defer.reject(error); }
      
    }
    
    // Otherwise, exit.
    else defer.reject({code: 'NOBACKUP'});

    // Return.
    return defer.promise();

  };
  const success   = function( errors ) {
    
    // Alert the user of any restore errors that occurred.
    errors.forEach((error) => {
      
      // Alert the user of the error.
      logger.warning(`Skipped '${error.dest}'. ${earl.say(error.error.code, error.data)}`);
      
    });
    
    // Alert the user that the restore was completed.
    logger.success('Restore completed successfully.');
    
  };
  const fail      = function( error ) { console.log(error);

    // Handle cancelations.
    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Restore failed. ${earl.say(error.code, error.data)}`);
    
  };
  const cancel    = function() {
    
    // Alert the user that the restore was canceled.
    logger.error('Restore canceled. All unchanged settings on your workstation were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };

  // Restore the user's system.
  restore().then((errors) => success(errors)).catch((error) => fail(error));

};