// Load dependencies.
const deepcopy  = require('deepcopy');
const logger    = require('../logger.js')();

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Define `list` command.
module.exports = function list() {

  config.settings.forEach((setting) => {
    
    logger.queue(setting.name);
    
  });
  
  logger.out();
  
};