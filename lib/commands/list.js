// Load configurations.
let config = require('../../data/config.json');

// Load dependencies.
const logger  = require('../logger.js')();

// Define `list` command.
module.exports = function list() {

  config.settings.forEach((setting) => {
    
    logger.queue(setting.name);
    
  });
  
  logger.out();
  
};