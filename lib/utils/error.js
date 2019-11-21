// Load dependencies.
const _ = require('lodash');

// Initialize error utility.
const error = {
  
  // Initialize the default error scripts.
  script: {
    DEFAULT:    'An error occurred.',
    EACCES:     'Permissions denied.',
    EPERM:      'Not permitted.',
    EEXIST:     'File already exists.',
    EISDIR:     'A file was expected but a directory was found.',
    ENOTDIR:    'A directory was expected but not found.',
    ENOTEMPTY:  'The directory is not empty.',
    CANCELED:   'canceled'
  },
    
  // Register a new error message script.
  register( code, message ) { 
    
    // Add the message to the script.
    this.script[code] = message; 
    
    // Make chainable.
    return this; 
  
  },
  
  // Output an error message from the script.
  message( code, ...params ) { 
    
    // If the code is not recognized, then output the default script.
    if( !this.script[code] ) return this.script.DEFAULT;
    
    // If the code matches a script function, then run the script with the given parameters.
    if( _.isFunction(this.script[code]) ) return this.script[code](...params);
    
    // Otherwise, output the script's message.
    return this.script[code];
  
  },
  
  // Get a throwable exception based on a predefined error script.
  exception( code, ...params ) { 
  
    // Initialize the error.
    const error = new Error(this.say(code, ...params));
    
    // Set the error's code.
    error.code = code;
    
    // Return the error.
    return error;
    
  }
  
};

// Export utility.
module.exports = {error};