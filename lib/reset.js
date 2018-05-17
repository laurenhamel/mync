#!/usr/bin/env Node

// Load dependencies.
const {Mync}    = require('./mync.js');

// Initialize utilities.
const mync = new Mync();

// Remove any symlinks for the configuration file. 
if( mync._hasLinkedConfig() ) mync._unlinkConfig();