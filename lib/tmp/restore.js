// Load dependencies.
const prompt    = require('prompt-async');
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const {Errl}    = require('../errl.js');
const {Mync} = require('../mync.js');

// Define `restore` command.
module.exports = function restore( options ) {
  
  // Initialize utilities.
  const earl = new Errl();
  const mync = new Mync();
  
  // Set errors messages.
  earl.says('NOBACKUP', 'No backup for your workstation was found.');
  
  // Initialize helper methods.
  const confirm   = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();

    // Ask the user to confirm before proceeding.
    logger.queue('Continuing will overwrite any existing settings on your workstation.', 'yellow')
          .queue('Do you wish to continue?')
          .out();
    
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
    if( mync.isBackedUp() ) {
      
      // Attempt to restore the user's system.
      try { 
        
        // Force the user to confirm their intent.
        await confirm(); 
        
        // Restore the user's system.
        mync.restore().then((results) => defer.resolve(results)).catch((error) => defer.reject(error));
        
      } catch(error) { defer.reject(error); }
      
    }
    
    // Otherwise, exit.
    else defer.reject(earl.error('NOBACKUP'));

    // Return.
    return defer.promise();

  };
  const success   = function( results ) {
    
    // Alert the user of any restore errors that occurred.
    if( options.verbose ) {
      
      // Alert the user of the error.
      results.forEach((result) => logger.warning(`Skipped '${error.dest}'. ${earl.say(error.error.code, error.data)}`));
      
    }
    
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
  restore().then((results) => success(results)).catch((error) => fail(error));

};