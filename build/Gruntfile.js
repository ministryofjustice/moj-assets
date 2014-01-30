module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('../package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    dirs : {
      root: '../',
      src: '<%= dirs.root %>src/',
      dist: '<%= dirs.root %>dist/',
      govuk_template: '<%= dirs.root %>../govuk_template/source/assets/',
      govuk_toolkit: '<%= dirs.root %>../govuk_frontend_toolkit/',
      moj_boilerplate: '<%= dirs.root %>../moj_boilerplate/app/assets/'
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

    clean: {
      src: {
        options: {
          force: true
        },
        src: ['<%= dirs.src %>*', '!.gitkeep']
      },
      dist: {
        options: {
          force: true
        },
        src: ['<%= dirs.dist %>*', '!.gitkeep']
      }
    },

    copy: {
      scripts: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_template %>',
            src: ['javascripts/**'],
            dest: '<%= dirs.src %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>',
            src: ['javascripts/**'],
            dest: '<%= dirs.src %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>',
            src: ['javascripts/**'],
            dest: '<%= dirs.src %>'
          }
        ]
      },
      styles: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_template %>',
            src: ['stylesheets/**'],
            dest: '<%= dirs.src %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>',
            src: ['stylesheets/**'],
            dest: '<%= dirs.src %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>',
            src: ['stylesheets/**'],
            dest: '<%= dirs.src %>'
          }
        ]
      },
      images: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_template %>',
            src: ['images/**'],
            dest: '<%= dirs.dist %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>',
            src: ['images/**'],
            dest: '<%= dirs.dist %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>',
            src: ['images/**'],
            dest: '<%= dirs.dist %>'
          }
        ]
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
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // Default task.
  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['clean', 'copy', 'sass', 'concat', 'uglify']);

};
