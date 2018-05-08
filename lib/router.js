// Load configurations.
let config = require('../data/config.json');

// Define router.
module.exports = function router() {
  
  const routes              = config.routes;
  const {root, directory}   = config.storage;
  
  return {
    
    merge( path ) {
      
      Object.keys(routes).forEach((route) => {
      
        path = path.replace(new RegExp(`:${route}`, 'g'), routes[route]);
        
      });
      
      return path.replace(/\/{2,}/g, '/');
      
    },
    
    src( path ) { 
      
      return this.merge( this.merge(`${root}/${directory}`) + path ); 
    
    },
    
    dest( path ) { 
      
      return this.merge( path ); 
    
    },
    
    resolve( setting ) {
      
      return {
        name: setting.name,
        src: this.src(setting.src),
        dest: this.dest(setting.dest)
      };
      
    }
    
  };
  
};