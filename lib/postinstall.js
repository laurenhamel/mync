#!/usr/bin/env Node

// Load dependencies.
const logger    = require('./logger.js')();
const Deferred  = require('deferred-js');
const {Mync}    = require('./mync.js');

// Initialize utilities.
const mync = new Mync();

// Initialize helper methods.
const init = async function() {
  
  // Initialize deferred.
  const defer = new Deferred();
  
  // Inform the user about the setup process.
  logger.queue("This utility will help you setup Mync.")
        .queue("")
        .queue("If this is your first time installing Mync...")
        .delimit(" ")
        .queue("When you're done, use")
        .queue("`mync backup`", 'bold')
        .delimit("\n")
        .queue("to backup your workstation.")
        .delimit(" ")
        .queue("Then, use")
        .queue("`mync push`", 'bold') 
        .delimit("\n")
        .queue("to add your workstation's settings to storage.")
        .delimit(" ")
        .queue("Afterwards, you can use")
        .queue("`mync sync`", 'bold')
        .delimit("\n")
        .queue("on all your Macs to start syncing with Mync.")
        .queue("")
        .queue("Otherwise, if you already have Mync installed on your other workstations...")
        .delimit(" ")
        .queue("Simply use")
        .queue("`mync sync`", 'bold')
        .delimit("\n")
        .queue("afterwards to backup and sync in one fell swoop.")
        .queue("")
        .queue("Let's get started.")
        .out();
  
  // Resolve.
  defer.resolve();
  
  // Return.
  return defer.promise();
  
};
const success = function() {
  
  // Alert the user that setup was completed.
  logger.queue('Setup completed successfully. Mync is ready to use.', 'green')
        .delimit(' ')
        .queue('Use', 'green')
        .queue('`mync --help`', 'green', 'bold')
        .queue('at any time for more information on usage.', 'green')
        .out();
  
};
const fail = function( error ) { console.log(error);
  
  if( error.message == 'canceled' ) cancel();
  
  else logger.error(`Setup failed.`);
  
};
const cancel = function() {
  
  // Alert the user that the setup was canceled.
  logger.error('Setup canceled.');
  
};

// Run the setup.
init().then(() => mync.setup().then(() => success()).catch((error) => fail(error)));