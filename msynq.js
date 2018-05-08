#!/usr/bin/env Node

// Load configurations.
let config = require('./data/config.json');

// Load dependencies.
const program   = require('commander');
const package   = require('./package.json');
const commands  = require('./lib/commands.js')();
const logger    = require('./lib/logger.js')();

// Load utilities.
require('./lib/prototypes.js');
      
// Set the program version.
program .version(package.version);

// Create `storage` command.
program
  .command('storage [storage]')
  .description('sets the storage location')
  .action(commands.storage);

// Create `config` command.
program
  .command('config')
  .description('opens the Msynq config file for editing')
  .action(commands.config);

// Create `list` command.
program
  .command('list')
  .description('lists all sync configurations in the config file')
  .action(commands.list);

// Create `sync` command.
program
  .command('sync')
  .description('syncs all storage files with your system')
  .action(commands.sync);

// Create `unsync` command.
program
  .command('unsync')
  .description('unsyncs all storage files with your system')
  .action(commands.unsync);

// Create `add` command.
program
  .command('add [name] [src] [dest]')
  .description('adds a new file or folder to storage')
  .action(commands.add);

// Create `remove` command.
program
  .command('remove [name]')
  .description('removes a file or folder from storage')
  .action(commands.remove);

// Create `restore` command.
program
  .command('restore')
  .description('restores the default Msynq configurations')
  .action(commands.restore);
  
// Start the program.
program.parse(process.argv);

// Capture arguments.
const ARGV = process.argv.slice(2);

// Catch program errors.
const ERROR = {
  COMMAND: {
    UNKNOWN: ARGV.length > 0 && Object.keys(commands).intersection(ARGV).length === 0,
    NONEXISTENT: ARGV.length === 0
  }
};

if( ERROR.COMMAND.UNKNOWN ) {
  
  logger.error('An unknown command was given.'); 
  
  program.help();
  
}
if( ERROR.COMMAND.NONEXISTENT ) {
  
  program.help();
  
}