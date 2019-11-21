// Load dependencies.
const path = require('path');
const glob = require('glob').sync;
const _ = require('lodash');

// Autoload all modules in the folder.
module.exports = _.reduce(glob(path.resolve(__dirname, '**/*'), {
  nodir: true
}), (result, module) => {
  
  // Get the module's name.
  const name = path.basename(module, '.js');
  
  // Require the command.
  const command = require(module);

  // Save the module.
  return _.set(result, name, command);
    
}, {});