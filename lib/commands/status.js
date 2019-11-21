// Load dependencies.
const utils = require('../utils');
const {Mync} = require('../mync.js');

// Define `status` command.
module.exports = () => {
  
  // Initialize Mync.
  const mync = new Mync();
  
  // Get the synced status.
  const isSynced = mync.isSynced();
  
  // Alert the user.
  utils.log.delimit(' ')
           .queue('Your workstation is currently', 'gray')
           .delimit('')
           .queue((isSynced ? 'synced' : 'unsynced'), isSynced ? 'green' : 'red', 'bold')
           .queue('.', 'gray')
           .done();
  
};