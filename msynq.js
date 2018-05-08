#!/usr/bin/env Node

const program = require('commander'),
      chalk = require('chalk'),
      package = require('package.json'),
      config = require('data/config.json');
      

program 
  .version(package.version)
  .command('storage [storage]', 'sets the storage location')
  .command('config', 'opens the Msynq config file for editing')
  .command('list', 'lists all sync configurations in the config file', {isDefault: true})
  .command('sync', 'syncs all storage files with your system')
  .command('unsync', 'unsyncs all storage files with your system')
  .command('add [name] [src] [dest]', 'adds a new file or folder to storage')
  .command('remove [name]', 'removes a file or folder from storage')
  .command('restore', 'restores the default Msynq configurations')
  .parse(process.argv);