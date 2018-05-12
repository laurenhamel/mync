// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const deepcopy  = require('deepcopy');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Define `status` command.
module.exports = function status( options ) {
  
  // Get the system ID.
  const id = keygen.machineIdSync();
  
  // Look for synced data.
  const {root:_root, directory:_directory} = config.storage;
  const _storage = router.merge(`${_root}/${_directory}`);
  const _backup = router.merge(`${_storage}/.backup`);
  const _system = router.merge(`${_backup}/${id}`);
  const _settings = config.settings.map((setting) => {
    
    setting.dest  = router.merge(setting.dest);
    setting.src   = router.merge(`${_storage}/${setting.src}`);
    
    return setting;
    
  });
  const _synced = router.merge(`${_storage}/.synced.json`);
  
  // Get the synced data.
  const data = fs.existsSync(_synced) ? require(_synced) : {};
  
  // Initialize helper methods.
  const synced = function( synced ) {
    
    logger
        .delimit(' ')
        .queue('Your workstation is currently', (synced ? 'green' : 'red'))
        .delimit('')
        .queue((synced ? 'synced' : 'unsynced'), (synced ? 'green' : 'red'), 'bold')
        .queue('.', (synced ? 'green' : 'red'))
        .out();
    
  };
  const check = function() {
    
    // Initialize results.
    const results = [];
    
    // Look for each setting on the system.
    _settings.forEach((setting) => {
      
      // Check the access rights of the destination
      try {
        
          // Attempt to access the file for writing.
          fs.accessSync(setting.dest, fs.constants.W_OK);
        
          // Determine whether or not the setting has been symlinked.
          results.push(fs.lstatSync(setting.dest).isSymbolicLink());
        
      } catch(error) { }
      
      
    });
    
    // Check if all files are synced.
    if( results.every((result) => result === true) ) synced(true);
    
    // Otherwise, report not synced.
    else synced(false);
    
  };
  
  // Use the synced data if it exists.
  if( data ) {
    
    // Find the system ID in the synced data.
    if( data[id] ) synced(true);
    
    // Otherwise, check the settings.
    else check();
    
    
  }
  
  // Otherwise, use the settings.
  else check();
  
};