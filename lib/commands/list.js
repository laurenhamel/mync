// Load dependencies.
const utils = require('../utils');
const {Mync}    = require('../mync.js');
const _ = require('lodash');

// Define `list` command.
module.exports = function list() {
  
  // Initialize utilities.
  const mync = new Mync();
  
  // Output the user configurations as a list.
  utils.log.table(mync.list(), 'gray');
  
};