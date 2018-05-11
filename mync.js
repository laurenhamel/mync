#!/usr/bin/env Node

// Load dependencies.
const program   = require('commander');
const deepcopy  = require('deepcopy');
const package   = require('./package.json');
const commands  = require('./lib/commands.js')();
const logger    = require('./lib/logger.js')();

// Load utilities.
require('./lib/prototypes.js');

// Load configurations.
let config      = deepcopy(require('./data/config.json'));
      
// Set the program version.
program .version(package.version);

// Create `storage` command.
program
  .command('storage [storage]')
  .description('sets the storage location')
  .action(commands.storage);

// Create `config` command.
program
  .command('config [app]')
  .description('opens the configuration file for editing')
  .action(commands.config);

// Create `list` command.
program
  .command('list')
  .description('lists the settings by name in the configuration file')
  .action(commands.list);

// Create `info` command.
program
  .command('info [name]')
  .description('gets additional information about a settinging in the configuration file')
  .action(commands.info);

// Create `sync` command.
program
  .command('sync')
  .description('syncs settings with your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.sync);

// Create `unsync` command.
program
  .command('unsync')
  .description('unsyncs settings with your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.unsync);

// Create `add` command.
program
  .command('add')
  .description('adds a new setting to the configuration file')
  .action(commands.add);

// Create `remove` command.
program
  .command('remove [name]')
  .description('removes a setting from the configuration file')
  .action(commands.remove);

// Create `backup` command.
program
  .command('backup')
  .description('backs up the default workspace settings')
  .action(commands.backup);

// Create `restore` command.
program
  .command('restore')
  .description('restores the default workspace settings')
  .action(commands.restore);

// Create `push` command.
program 
  .command('push')
  .description('pushes settings from your workstation to storage')
  .option('-o, --overwrite', 'Forces overwriting of existing settings in storage')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.push);

// Create `pull` command.
program 
  .command('pull')
  .description('pulls settings from storage to your workstation')
  .option('-o, --overwrite', 'Forces overwriting of existing settings on your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.pull);
  
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