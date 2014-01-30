module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    dirs : {
      root: './',
      src: '<%= dirs.root %>src/',
      dist: '<%= dirs.root %>dist/'
    },

    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['<%= dirs.src %>javascripts/**/*.js'],
        dest: '<%= dirs.dist %>javascripts/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: '<%= dirs.dist %>javascripts/<%= pkg.name %>.min.js'
      }
    },

    jshint: {
      options: {
        jshintrc : '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= dirs.src %>stylesheets',
          src: ['*.scss'],
          dest: '<%= dirs.dist %>stylesheets',
          ext: '.css'
        }]
      }
    },

    watch: {
      gruntfile: {
        files: ['<%= jshint.gruntfile.src %>', '<%= jshint.scripts.src %>'],
        tasks: ['jshint:gruntfile']
      },
      sass: {
        files: '<%= dirs.src %>stylesheets/**',
        tasks: ['sass']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // Default task.
  grunt.registerTask('default', ['sass', 'jshint:gruntfile', 'concat', 'uglify']);

};
