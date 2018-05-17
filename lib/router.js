// Load configurations.
let path        = require('path');
let config      = require('../data/config.json');

// Load dependencies.
const username  = require('username');
const untildify = require('untildify');
const tildify   = require('tildify');

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
      
      // Strip extra slashes, and expand tildes.
      return untildify(path.replace(/\/{2,}/g, '/'));
      
    },
    
    unmerge( path ) {
      
      // Condense tildes.
      path = tildify(path);
      
      // Unmerge routes.
      Object.keys(routes).filter((route) => routes[route] !== '~').forEach((route) => {
        
        path = path.replace(new RegExp(routes[route], 'g'), `:${route}`);
        
      });
      
      // Unmerge data.
      Object.keys(data).forEach((key) => {
        
        path = path.replace(data[key], `$${key}`);
        
      })
      
      // Strip extra slashes.
      return path.replace(/\/{2,}/g, '/');
      
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