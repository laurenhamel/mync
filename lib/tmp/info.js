// Load dependencies.
const logger    = require('../logger.js')();
const {Mync}    = require('../mync.js');

// Define `info` command.
module.exports = function info( name ) {

  // Load utilities.
  const mync = new Mync();
  
  // Name is not given.
  if( !name ) logger.error('Cannot get setting information without a name. See `mync --help`.');
  
  // Name is given.
  else {
    
    // Retrieve information about settings.
    const settings = mync.info(name);
  
    // Information was found.
    if( settings ) {
      
      settings.forEach((setting) => {

        logger.queue(setting.name, 'bold')
              .queue(`src:`, 'green', 'bold')
              .queue(setting.src, 'green')
              .queue('dest:', 'red', 'bold');
        
        if( setting.files.length > 0 ) logger.queue(setting.files.join("\n"), 'red');
        if( setting.folders.length > 0 ) logger.queue(setting.folders.join("\n"), 'red');
        
        logger.out();
        
      });

    }

    // Information was not found.
    else logger.error(`No information available for settings with the name '${name}'.`);
    
  }
  
};