const chalk   = require('chalk');

module.exports = function logger() {
  
  return {
    
    message: [],
    
    delimiter: "\n",
    
    log() { console.log(...arguments); },
    
    error() { console.log(chalk.red(...arguments)); },
    
    warning() { console.log(chalk.yellow(...arguments)); },
    
    success() { console.log(chalk.green(...arguments)); },
    
    cue( message, ...styles ) {
      
      if( styles.length > 0 ) {
      
        styles = styles.join('.');
    
        this.message.push(chalk`{${styles} ${message}}`);
        
      }
      
      else { this.message.push(message); }
    
    },
      
    out() { console.log(this.message.join(this.delimiter)); this.message = []; }
    
  };
  
};