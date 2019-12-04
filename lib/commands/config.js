// Load dependencies.
const utils = require('../utils');
const {Mync} = require('../mync.js');

// Define `config` command.
module.exports = ( app ) => {
  
  // Initialize Mync.
  const mync = new Mync();
  
  // Alert the user that the configuration file is opening.
  utils.log.delimit(' ')
           .queue("The configuration file should open in another window.", 'gray')
           .done();
  
  // Attempt to open the MYNCRC configuration file in the given app, if applicable, and wait for changes.
  mync.config(app);
  
};