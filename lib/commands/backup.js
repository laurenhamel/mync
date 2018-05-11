// Load dependencies.
const prompt    = require('prompt');
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const {Errl}    = require('../errl.js');
const {Backrup} = require('../backrup.js');

// Define `backup` command.
module.exports = function backup() {
  
  // Initialize error handler.
  const earl = new Errl();
  
  // Initialize backup system.
  const backrup = new Backrup();
  
  // Initialize helper methods.
  const confirm     = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();

    // Ask the user to confirm before proceeding.
    logger.warning('A backup for your workstation already exists. Continuing will overwrite this backup.');

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
  const backup     = async function() {
    
    // Initialize deferred.
    const defer = new Deferred();
    
    // Verify that a system backup folder does not exist already.
    if( backrup.status() === false ) {
      
      // Backup the user's system.
      backrup.backup().always((error) => {
        
        if( error ) defer.reject(error);
        
        else defer.resolve();
        
      });
      
    }
    
    // Otherwise, the user must confirm to overwrite.
    else {
      
      // Attempt to backup the user's system.
      try {
      
        // Force the user to confirm their intent.
        await confirm();
      
        // Backup the user's system.
        backrup.restore()
          .then(() => defer.resolve())
          .fail((error) => defer.reject(error));
        
      } catch(error) { defer.reject(error); }
      
    }
      
    // Return.
    return defer.promise();
    
  };
  const success = function() {
    
    // Alert the user that the backup was completed.
    logger.success('Backup completed successfully.');
    
  };
  const fail    = function( error ) {
    
    if( error.message == 'canceled' ) cancel();
    
    else logger.error(`Backup failed. ${earl.say(error.code)}`);
    
  };
  const cancel  = function() {
    
    // Alert the user that the backup was canceled.
    logger.error('Backup canceled. All unchanged settings in your storage were left intact.');
    
    // Exit the process.
    process.exit(1);
    
  };
  
  // Backup the user's system.
  backup().then(() => success()).catch((error) => fail(error));
  
};