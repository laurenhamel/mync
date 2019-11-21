// Load dependencies.
const chalk = require('chalk');

// Initialize log utility.
const log = {

  // Build the log message internally. 
  _message: [],

  // Set the default delimiter.
  _delimiter: "\n",

  // Change the delimiter on the fly.
  delimit( delimiter ) {

    this._delimiter = delimiter;

    return this;

  },

  // Bypass the message log, and output the given arguments as is.
  log() { 

    console.log(...arguments); 

    return this;

  },

  // Add an error message to the log.
  error() { 

    console.log(chalk.red(...arguments)); 

    return this;

  },

  // Add a warning message to the log.
  warning() { 

    console.log(chalk.yellow(...arguments));

    return this;

  },

  // Add a success message to the log.
  success() { 

    console.log(chalk.green(...arguments)); 

    return this;

  },

  // Queue one or more messages to the log.
  queue( message, ...styles ) {

    if( styles.length > 0 ) {

      styles = styles.join('.');

      this._message.push(chalk`{${styles} ${message}}`);

    }

    else { this._message.push(message); }

    this._message.push(this._delimiter);

    return this;

  },
  
  // Insert a line break in the message log.
  break() {
    
    this._message.push("\n");
    
    return this;
    
  },
  
  // Queue a message and then immediately call done.
  message( message, ...styles ) {
    
    // Add the message to the queue.
    this.queue(message, ...styles);
    
    // Then, immediately output the message.
    this.done();
    
  },

  // Export the message log.
  export() { return this._message; },

  // Import a message log.
  import( message ) { this._message = message; },

  // Output the message log when done.
  done() { 

    this._message.pop();

    console.log(this._message.join('')); 

    this._message = [];
    this._delimiter = "\n";

    return this;

  }
  
};

// Export the log method.
module.exports = {log};