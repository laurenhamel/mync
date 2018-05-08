// Load configurations.
let config = require('../../data/config.json');

// Load dependencies.
const logger  = require('../logger.js')();
const router  = require('../router.js')();

// Define `info` command.
module.exports = function info( name ) { 

  const settings = config.settings.filter((setting) => setting.name == name);
  
  if( settings.length > 0 ) {
    
    settings.forEach((setting) => {
      
      setting = router.resolve(setting);
      
      logger.cue(setting.name, 'bold');
      logger.cue(`src: ${setting.src}`, 'green');
      logger.cue(`dest: ${setting.dest}`, 'red');
      logger.out();
      
    });
    
  }
  
  else {
    
    logger.error(`No information available for settings with the name '${name}.'`);
    
  }
  
};