// Load dependencies.
const logger    = require('../logger.js')();
const {Mync}    = require('../mync.js') 

// Define `status` command.
module.exports = function status( options ) {
  
  // Initialize Mync.
  const mync = new Mync();
  
  // Get the synced status.
  const isSynced = mync.isSynced();
  
  // Set the output color.
  const color = isSynced ? 'green' : 'red';
  
  // Alert the user.
  logger.delimit(' ')
        .queue('Your workstation is currently', color)
        .delimit('')
        .queue((isSynced ? 'synced' : 'unsynced'), color, 'bold')
        .queue('.', color)
        .out();
  
};