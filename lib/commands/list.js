// Load dependencies.
const logger    = require('../logger.js')();
const {Mync}    = require('../mync.js');

// Define `list` command.
module.exports = function list() {
  
  // Initialize utilities.
  const mync = new Mync();

  // List setting names.
  logger.log( mync.list().join("\n") );
  
};