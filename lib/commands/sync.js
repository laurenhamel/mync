// Load dependencies.
const fs        = require('fs-extra');
const keygen    = require('node-machine-id');
const router    = require('../router.js')();
const logger    = require('../logger.js')();
const Deferred  = require('deferred-js');
const processr  = require('../processr.js');
const username  = require('username');
const deepcopy  = require('deepcopy');
const {exec}    = require('child_process');
const {Errl}    = require('../errl.js');
const {Backrup} = require('../backrup.js');

// Load configurations.
let config      = deepcopy(require('../../data/config.json'));

// Load utilities.
require('../prototypes.js');

// Define `sync` command.
module.exports = function sync( options ) {

  // Get the system ID.
  const id = keygen.machineIdSync();

  // Get path data.
  const {root:_root, directory:_directory} = config.storage;
  const _storage = router.merge(`${_root}/${_directory}`);
  const _backup = router.merge(`${_storage}/.backup`);
  const _system = router.merge(`${_backup}/${id}`);
  const _settings = config.settings.map((setting) => {

    setting.dest  = router.merge(setting.dest);
    setting.src   = router.merge(`${_storage}/${setting.src}`);

    return setting;

  });
  const _synced = router.merge(`${_storage}/.synced.json`);

  // Get the synced data.
  const data = fs.existsSync(_synced) ? require(_synced) : {};

  // Initialize error handler.
  const earl = new Errl();

  // Set errors messages.
  earl.says('NOSRC', (type) => `Source ${type} not found.`);

  // Initialize backup system.
  const backrup = new Backrup();

  // Initialize the synced data for the current system.
  data[id] = [];

   // Initialize helper methods.
  const symlink = async function( type, src, dest ) {

    // Determine the path type.
    switch( type ) {

      case 'file': type = 'file'; break;

      case 'folder': type = 'dir'; break;

      default: type = fs.lstatSync(src).isDirectory() ? 'dir' : 'file';

    }

    // Check if the destination exists.
    if( fs.existsSync(dest) ) {

      // Change owner of the destination.
      try { await exec(`chown ${username.sync} ${dest}`); } catch(error) {

        try { await exec(`sudo chown ${username.sync} ${dest}`); } catch(error) { throw error; }

      }

      // Change permissions of the destination.
      try { await exec(`chmod -R 755 ${dest}`); } catch(error) {

        try { await exec(`sudo chmod -R 755 ${dest}`); } catch(error) { throw error; }

      }

      // Erase the destination if it exists.
      if( fs.existsSync(dest) ) fs.removeSync(dest);

    }

    // Replace the destination with a symbolic link to the source.
    fs.symlinkSync(src, dest, type);

  };
  const sync = async function( type, src, dest ) {

    // Initialize deferred.
    const defer = new Deferred();

    // Initialize an error message.
    let message = '';

    // Verify that the source exists.
    if( fs.existsSync(src) ) {

      try {

        // Generate a symlink.
        await symlink(type, src, dest);

        // Alert user that the setting was synced.
        if( options.verbose ) logger.success(`Synced '${dest}' successfully.`);

        // Add synced data.
        data[id].push({
          src: src,
          dest: dest,
          synced: true
        });

      }

      catch(error) {

        // Alert user of errors.
        if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);

        // Add synced data.
        data[id].push({
          src: src,
          dest: dest,
          synced: false,
          error: message === '' ? true : message
        });

      }

      // Resolve.
      defer.resolve();

    }

    // Otherwise, move on.
    else {

      // Set the error.
      const error = {code: 'NOSRC'};

      // Alert user of missing setting.
      if( options.verbose ) logger.warning(`Skipped '${dest}'. ${earl.say(error.code, type)}`);

      // Add synced data.
      data[id].push({
        src: src,
        dest: dest,
        synced: false,
        error: message
      });

      // Resolve.
      defer.resolve();

    }

    // Return.
    return defer.promise();

  };
  const save = function( file, data ) {

    // Create the sync file if needed.
    if( !fs.existsSync(file) ) fs.writeFileSync(file);

    // Save data to the file.
    fs.writeJsonSync(file, data, {spaces: 2});

  };
  const success = function() {

    // Alert the user that the sync was completed.
    logger.success('Sync completed successfully.');

    // Save the synced data.
    save(_synced, data);

  };
  const fail = function( error ) {

    switch( error.message ) {

      case 'canceled':

        // Alert the user that the sync was canceled.
        logger.error('Sync operation canceled.');

        break;

      default:

        // Alert the user that the sync could not be completed due to errors.
        logger.error('Sync could not be completed. An error occurred. Please check your configurations and try again.');

    }

  };
  const cancel    = function( error = {} ) {

    // Alert the user that the restore was canceled.
    logger.error(`Sync canceled. Could not backup your workstation. ${earl.say(error.code)}`);

    // Exit the process.
    process.exit(1);

  };

  // Make sure the user's system is backed up first.
  if( !fs.existsSync(_system) ) {

    backrup.backup().then(() => {

      // Sync all settings.
      processr(_settings, sync).then(() => success()).catch((error) => fail(error));

    }).fail((error) => cancel(error));

  }

  // Sync only after the user's system is backed up.
  else {

    // Sync all settings.
      processr(_settings, sync).then(() => success()).catch((error) => fail(error));

  }

};