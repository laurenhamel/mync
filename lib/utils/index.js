// Load dependencies.
const path = require('path');
const glob = require('glob').sync;
const _ = require('lodash');

// Autoload all modules in the folder.
module.exports = _.reduce(glob(path.resolve(__dirname, '**/*'), {
  nodir: true
}), (result, module) => {
  
  // Require the module.
  const methods = require(module);

  // Save the module.
  return _.merge(result, methods);
    
}, {});