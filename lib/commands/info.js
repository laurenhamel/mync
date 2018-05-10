// Load configurations.
let config = require('../../data/config.json');

// Load dependencies.
const logger  = require('../logger.js')();
const router  = require('../router.js')();

// Define `info` command.
module.exports = function info( name ) { 

  const settings = config.settings.filter((setting) => setting.name == name);
  
  // Name is not given.
  if( !name ) {
    
    logger.error('Cannot complete request. Arguments are missing. See `mync --help`.');
    
  }
  
  // Name is given.
  else {
  
    if( settings.length > 0 ) {

      settings.forEach((setting) => {

        setting = router.resolve(setting);
        
        let files = setting.files.map((file) => router.merge(`${setting.dest}/${file}`));
        let folders = setting.files.map((folder) => router.merge(`${setting.dest}/${folder}`));
        
        logger
          .queue(setting.name, 'bold')
          .queue(`src:`, 'green', 'bold')
          .queue(setting.src, 'green')
          .queue('dest:', 'red', 'bold');
        
        files.forEach((file) => logger.queue(file, 'red') );
        folders.forEach((folder) => logger.queue(folder, 'red') );

        logger.out();

      });

    }

    else {

      logger.error(`No information available for settings with the name '${name}'.`);

    }
    
  }
  
};