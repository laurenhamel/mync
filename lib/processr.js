// Load dependencies.
const Deferred  = require('deferred-js');
const router    = require('./router.js')();

// Define processor.
module.exports = async function processr( settings, callback ) {
  
  // Initialize deferred.
    const defer = new Deferred();

    // Capture promises.
    const promises = [];

    // Push each settings.
    for( let setting of settings ) { 

      // Push files.
      if( setting.files && setting.files.length > 0 ) {

        // Push each file.
        for( let file of setting.files ) {

          // Get the file paths.
          const src   = router.merge(`${setting.src}/${file}`);
          const dest  = router.merge(`${setting.dest}/${file}`);

          // Push the file.
          promises.push( await callback('file', src, dest) );

        }

      }

      // Push folders.
      if( setting.folders && setting.folders.length > 0 ) {

        // Push each folder.
        for( let folder of setting.folders ) {

          // Get the file paths.
          const src   = router.merge(`${setting.src}/${folder}`);
          const dest  = router.merge(`${setting.dest}/${folder}`);

          // Push the folder.
          promises.push( await callback('folder', src, dest) );

        }

      }

      // Push everything else.
      if( !setting.files && !setting.folders ) {

        // Push the setting.
        promises.push( await callback('setting', setting.src, setting.dest) );

      }

    }

    // Handle promises.
    Deferred.when(promises).done(() => defer.resolve());

    // Return
    return defer.promise();
  
};