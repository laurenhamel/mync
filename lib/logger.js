const chalk   = require('chalk');

module.exports = function logger() {
  
  return {
    
    message: [],
    
    delimiter: "\n",
    
    delimit( delimiter ) {
      
      this.delimiter = delimiter;
      
      return this;
      
    },
    
    log() { 
      
      console.log(...arguments); 
      
      return this;
    
    },
    
    error() { 
      
      console.log(chalk.red(...arguments)); 
      
      return this;
    
    },
    
    warning() { 
      
      console.log(chalk.yellow(...arguments));
      
      return this;
    
    },
    
    success() { 
      
      console.log(chalk.green(...arguments)); 
      
      return this;
    
    },
    
    queue( message, ...styles ) {
      
      if( styles.length > 0 ) {
      
        styles = styles.join('.');
    
        this.message.push(chalk`{${styles} ${message}}`);
        
      }
      
      else { this.message.push(message); }
      
      this.message.push(this.delimiter);
      
      return this;
    
    },
    
    export() { return this.message; },
    
    import( message ) { this.message = message; },
      
    out() { 
      
      this.message.pop();
      
      console.log(this.message.join('')); 
      
      this.message = [];
      this.delimiter = "\n";
      
      return this;
    
    }
    
  };
  
};