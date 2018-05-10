// Load configurations.
let config      = require('../data/config.json');

// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('./router.js')();
const logger    = require('./logger.js')();

// Define backrup.
module.exports = function backrup() {
  
  // Extract settings.
  const settings = config.settings;
  const {root, directory} = config.storage;
  const storage = router.merge(`${root}/${directory}`);
  const backup = router.merge(`${storage}/.backup`);
  
  return {
    
    backup() {
      
      // Initialize a system ID.
      const id = keygen.machineIdSync();
      
      // Set the system backup folder.
      const system = router.merge(`${backup}/${id}`);
      
      // Delete the system backup folder if it currently exists.
      if( fs.existsSync(backup) ) fs.removeSync(backup);
      
      // Gets exact paths for settings.
      const paths = settings.map((setting) => {
        
        const src   = setting.dest = router.merge(setting.dest);
        const dest  = setting.src = router.merge(`${system}/${setting.src}`);
        
        setting.dest = dest;
        setting.src = src;
        
        return setting;
        
      });
      
      // Create backup folder if one doesn't already exist.
      if( !fs.existsSync(backup) ) fs.mkdirSync(backup);
        
      // Create the system backup folder.
      fs.mkdirSync(system);
      
      // Backup each setting.
      paths.forEach((path) => {
        
        // Backup files.
        if( path.files && path.files.length > 0 ) {
        
          path.files.forEach((file) => {
          
            // Get the file paths.
            const __src   = router.merge(`${path.src}/${file}`);
            const __dest  = router.merge(`${path.dest}/${file}`);

            // Backup the file.
            if( fs.existsSync(__src) ) fs.copySync(__src, __dest);

          });
          
        }
        
        // Backup folders.
        if( path.folders && path.folders.length > 0 ) {
          
          path.folders.forEach((folder) => {
          
            // Get the folder paths.
            const __src   = router.merge(`${path.src}/${folder}`);
            const __dest  = router.merge(`${path.dest}/${folder}`);

            if( fs.existsSync(__src) ) fs.copySync(__src, __dest);

          });
          
        }
        
        // Backup everything else.
        if( !path.files && !path.folders ) {
          
          if( fs.existsSync(path.src) ) fs.copySync(path.src, path.dest);
          
        }
        
        
      }); 
      
      // Output status.
      logger.success('Backup completed successfully.');
      
    },
    
    status() {},
    
    restore() {}
    
  };
  
};