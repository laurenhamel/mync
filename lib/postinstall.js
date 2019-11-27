#!/usr/bin/env Node

// Load dependencies.
const utils = require('./utils');
const {Mync}    = require('./mync.js');
const _ = require('lodash');

// Inform the user about the setup process.
utils.log.delimit(' ')
         .queue("Welcome to Mync.", 'gray')
         .queue("Mync is intended to help you sync all of your configurations across multiple workstations.", 'gray')
         .queue("Your system is currently being setup.", 'gray')
         .break()
         .break()
         .done();

// Initialize Mync for the first time.
const mync = new Mync();

// Determine if the storage location was verified.
mync.VERIFIED

  // Determine if the verification was completed successfully.
  .then(() => {

    // Alert the user that setup was completed.
    utils.log.success('Setup completed successfully. Mync is ready to use.');
  
  })

  // Otherwise, the verification failed.
  .catch((error) => {
  
    // Alert the user that setup is done, but they will need to fix any errors that occurred later.
    utils.log.delimit(' ')
             .queue("Setup completed successfully, but Mync may not be configured fully:", 'yellow')
             .queue(`${_.trimEnd(error.message, '.')}.`, 'gray')
             .queue("It's recommended that you resolve these errors before running Mync again.", 'gray')
             .queue("Don't worry, though, if this issue persists the next time you use Mync, we'll alert you again.", 'gray')
             .break()
             .done();
  
  })

  // Finally, always output some helpful tips to get them started.
  .finally(() => {
  
    // Inform the user about how to get started.
    utils.log.delimit(' ')
             .break()
             .queue("If this is your first time installing Mync, then use", 'gray')
             .queue("`mync --help`", 'cyan')
             .queue("to learn more about how to use the CLI.", 'gray')
             .queue("Otherwise, if you already have Mync installed on your other workstations, then just use", 'gray')
             .queue("`mync sync`", 'cyan')
             .queue("to start syncing this computer.", 'gray')
             .queue("If you need to make changes to Mync's configurations in '.myncrc' (e.g., to update storage locations), you can use", 'gray')
             .queue("`mync config`", 'cyan')
             .queue("at any time.", 'gray')
             .queue("That's it.", 'gray')
             .queue("Happy syncing!", 'magenta')
             .break()
             .break()
             .done();
  
  });