// Load tasks.
module.exports = (grunt) => {
  
  // Initialize configurations.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      config: {
        files: [
          'Gruntfile.js',
          'package.json',
          '.jshintrc',
          '.myncrc'
        ],
        tasks: [],
        options: {
          reload: true
        }
      },
      js: {
        files: ['**/*.js'],
        tasks: ['jshint']
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      dev: {
        src: [
          'mync.js',
          'lib/**/*.js'
        ]
      }
    }
  });
  
  // Load tasks.
  require('load-grunt-tasks')(grunt);
  
  // Register tasks.
  grunt.registerTask('default', ['dev']);
  grunt.registerTask('dev', ['watch']);
  
};