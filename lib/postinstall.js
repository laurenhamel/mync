#!/usr/bin/env Node

// Load dependencies.
const utils = require('./utils');
const {Mync}    = require('./mync.js');

// Initialize Mync for the first time.
const mync = new Mync();
  
// Inform the user about the setup process.
utils.log.delimit(' ')
         .queue("Mync is intended to help you sync all of your configurations across multiple workstations.")
         .queue("If this is your first time installing Mync, then use")
         .queue("`mync --help`", 'cyan')
         .queue("to learn more about about how to use the CLI.")
         .queue("Otherwise, if you already have Mync installed on your other workstations, then just use")
         .queue("`mync sync`", 'cyan')
         .queue("to start syncing this computer. That's it.")
         .queue("Happy syncing!", 'magenta')
         .break()
         .break()
         .done();
  
// Alert the user that setup was completed.
utils.log.message('Setup completed successfully. Mync is ready to use.', 'green');