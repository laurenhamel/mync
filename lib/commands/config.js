// Load dependencies.
const path    = require('path');
const {exec}  = require('child_process')

module.exports = function config( app ) {
  
  // Get path to configuration file.
  const config = path.resolve(__dirname, '../../data/config.json');

  // Open in the given application.
  if( app ) exec(`open -a "${app}" ${config}`);
  
  // Otherwise, open in the default application.
  else exec(`open ${config}`);
  
};