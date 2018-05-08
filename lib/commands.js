// Load dependencies.
const fs    = require('fs');
const path  = require('path');

// Define commands.
module.exports = function commands() {
  
  let commands = {};
  
  let src = path.dirname(__filename) + '/commands/';
  
  fs.readdirSync(src).forEach((filename) => {
    
    let name = filename.substr(0, filename.lastIndexOf('.'));
 
    let command = require(path.join(src, filename));

    commands[name] = command;
    
  });

  return commands;
  
};