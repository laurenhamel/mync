// Load utilities.
require('./prototypes.js');

// Create Errl.
class Errl {
  
  constructor() {
    this.script = {
      DEFAULT:    'An error occurred.',
      EACCES:     'Permissions denied.',
      EPERM:      'Not permitted.',
      EEXIST:     'File already exists.',
      EISDIR:     'A file was expected but a directory was found.',
      ENOTDIR:    'A directory was expected but not found.',
      ENOTEMPTY:  'The directory is not empty.',
      CANCELED:   'canceled'
    };
  }
    
  says( code, message ) { this.script[code] = message; return this; }
  
  say( code, ...params ) { 
    
    if( !this.script[code] ) return this.script.DEFAULT;
    
    if( typeof this.script[code] === 'function' ) return this.script[code](...params);
    
    return this.script[code];
  
  }
  
  error( code, ...params ) { 
  
    const error = new Error(this.say(code, ...params));
    
    error.code = code;
    
    return error;
    
  }
  
}

// Export.
module.exports = {Errl};