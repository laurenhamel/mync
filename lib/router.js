// Load configurations.
let path        = require('path');
let config      = require('../data/config.json');

// Load dependencies.
const username  = require('username');
const untildify = require('untildify');

// Define router.
module.exports = function router() {
  
  const routes = config.routes;
  const {root, directory} = config.storage;
  const data = {
    username: username.sync()
  };
  
  return {
    
    merge( path ) {
      
      // Merge routes.
      Object.keys(routes).forEach((route) => {
      
        path = path.replace(new RegExp(`:${route}`, 'g'), routes[route]);
        
      });
      
      // Merge data.
      Object.keys(data).forEach((key) => {
        
        path = path.replace(new RegExp(`\\$${key}`, 'g'), data[key]);
        
      });
      
      // Strip extra slashes.
      return untildify(path.replace(/\/{2,}/g, '/'));
      
    },
    
    src( path ) { 
      
      return this.merge( this.merge(`${root}/${directory}/`) + path ); 
    
    },
    
    dest( path ) { 
      
      return this.merge( path ); 
    
    },
    
    resolve( setting ) {
      
      setting.src = this.src(setting.src);
      setting.dest = this.dest(setting.dest);
      
      return setting;
      
    }
    
  };
  
};