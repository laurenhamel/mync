#!/usr/bin/env Node

// Load dependencies.
const program = require('commander');
const pkg = require('./package.json');
const commands = require('./lib/commands');
const utils = require('./lib/utils');
const _ = require('lodash');
      
// Set the program version.
program .version(pkg.version);

// Create `storage` command.
program
  .command('storage [storage]')
  .description('gets/sets the storage location')
  .action(commands.storage);

// Create `status` command.
program
  .command('status')
  .description('indicates if the workstation is currently synced')
  .action(commands.status);

// Create `config` command.
program
  .command('config [app]')
  .description('opens the configuration file for editing')
  .action(commands.config);

// Create `list` command.
/*program
  .command('list')
  .description('lists the settings by name in the configuration file')
  .action(commands.list);
*/
// Create `info` command.
/*program
  .command('info [name]')
  .description('gets additional information about a setting in the configuration file')
  .action(commands.info);
*/
// Create `sync` command.
/*program
  .command('sync')
  .description('syncs settings with your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.sync);
*/
// Create `unsync` command.
/*program
  .command('unsync')
  .description('unsyncs settings with your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.unsync);
*/
// Create `add` command.
/*program
  .command('add')
  .description('adds a new setting to the configuration file')
  .action(commands.add);
*/
// Create `remove` command.
/*program
  .command('remove [name]')
  .description('removes a setting from the configuration file')
  .action(commands.remove);
*/
// Create `backup` command.
/*program
  .command('backup')
  .description('backs up the default workspace settings')
  .action(commands.backup);
*/
// Create `restore` command.
/*program
  .command('restore')
  .description('restores the default workspace settings') 
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.restore);
*/
// Create `push` command.
/*program 
  .command('push')
  .description('pushes settings from your workstation to storage')
  .option('-o, --overwrite', 'Forces overwriting of existing settings in storage')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.push);
*/
// Create `pull` command.
/*program 
  .command('pull')
  .description('pulls settings from storage to your workstation')
  .option('-o, --overwrite', 'Forces overwriting of existing settings on your workstation')
  .option('-v, --verbose', 'Outputs additional status messages to the console')
  .action(commands.pull);
*/

// Catch instances where an unknown command was given.
program.on('command:*', () => {
  
  // Alert the user that an unknown command was given.
  utils.log.error('An unknown command was given. See below for a list of available commands.');
  
  // Then, output the help information.
  program.help();
  
});

// Start the program.
program.parse(process.argv);

// Catch instances where no command was given.
if( program.args.length === 0 ) {
  
  // Alert the user than a command is required.
  utils.log.error('A command is required to proceed. See below for a list of available commands.');
  
  // Then, output the help information.
  program.help();
  
}

// FOR DEVELOPMENT USE
/*process.on('unhandledRejection', (reason, promise) => console.log(reason));*/