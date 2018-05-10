// Load configurations.
let config    = require('../../data/config.json');

// Load dependencies.
const fs        = require('fs-extra');
const prompt    = require('prompt');
const keygen    = require('node-machine-id');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const backrup   = require('../backrup.js')();

// Define `backup` command.
module.exports = function backup() {
  
  // Get the system ID.
  const id = keygen.machineIdSync();
  
  // Get path data.
  const {root, directory} = config.storage;
  const storage = router.merge(`${root}/${directory}`);
  const backup = router.merge(`${storage}/.backup`);
  const system = router.merge(`${backup}/${id}`);
  
  // The system backup folder already exists.
  if( fs.existsSync(system) ) {
    
    // Alert the user that their settings have already been backed up.
    logger.warning('Backups for your current workstation already exist. Continuing will overwrite the existing data.');
    
    // Ask the user if they would like overwrite the existing data.
    logger.log('Do you wish to continue?');
    
    // Start the prompt.
    prompt.start();
    
    // Prompt the user for their feedback.
    prompt.get([
      {
        name: 'continue', 
        required: true,
        default: 'no',
        message: 'Please enter `yes` or `no`.',
        pattern: /^(yes|no)$/
      }
    ], (error, result) => {
      
      // Proceed to backup the user's system.
      if( result.continue === 'yes' ) {
        
        // Backup the user's system.
        backrup.backup();
        
      }
      
      // Discontinue the backup process.
      else {
        
        // Alert the user that no changes have been made.
        logger.success('Backup canceled. Your existing backup data has been left intact.');
        
      }
               
    });
    
  }
  
  // The system backup folder does not exist.
  else {
    
    // Backup the user's system.
    backrup.backup();
    
  }
  
};