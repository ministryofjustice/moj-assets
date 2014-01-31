module.exports = function(grunt) {
  'use strict';

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
      build: '<%= dirs.root %>build/',
      temp: '<%= dirs.build %>temp/',
      govuk_template: '<%= dirs.root %>../govuk_template/',
      govuk_template_assets: '<%= dirs.govuk_template %>source/assets/',
      govuk_toolkit: '<%= dirs.root %>../govuk_frontend_toolkit/',
      moj_boilerplate: '<%= dirs.root %>../moj_boilerplate/'
    },

    // Task configuration.
    concat: {
      govuk_toolkit: {
        src: [
          '<%= dirs.temp %>govuk_toolkit/javascripts/vendor/**/*.js',
          '<%= dirs.temp %>govuk_toolkit/javascripts/govuk/*.js',
          '<%= dirs.temp %>govuk_toolkit/javascripts/*.js'
        ],
        dest: '<%= dirs.dist %>javascripts/govuk-toolkit.js'
      },
      moj_boilerplate: {
        options: {
          banner: '<%= banner %>',
          stripBanners: true
        },
        src: [
          '<%= dirs.temp %>moj_boilerplate/javascripts/moj.js',
          '<%= dirs.temp %>moj_boilerplate/javascripts/**/*.js'
        ],
        dest: '<%= dirs.dist %>javascripts/moj.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      govuk_toolkit: {
        src: '<%= concat.govuk_toolkit.dest %>',
        dest: '<%= dirs.dist %>javascripts/govuk-toolkit.min.js'
      },
      moj_boilerplate: {
        src: '<%= concat.moj_boilerplate.dest %>',
        dest: '<%= dirs.dist %>javascripts/moj.min.js'
      }
    },

    clean: {
      options: {
        force: true
      },
      prebuild: {
        src: [
          '<%= dirs.src %>*',
          '<%= dirs.dist %>*',
          '<%= dirs.temp %>',
          '!.gitkeep'
        ]
      },
      postbuild: {
        src: [
          '<%= dirs.temp %>'
        ]
      }
    },

    replace: {
      govuk_template: {
        src: ['<%= dirs.temp %>govuk_template/views/layouts/govuk_template.html'],
        overwrite: true,
        replacements: [{
          from: '{{ assetPath }}',
          to: '{{{ assetPath }}}'
        }]
      }
    },

    mustache_render: {
      govuk_template: {
        files: [{
          data: {
            assetPath: './',
            head: grunt.file.read('moj-template/partials/head.mustache'),
            cookieMessage: grunt.file.read('moj-template/partials/cookie-message.mustache'),
            footerTop: grunt.file.read('moj-template/partials/footer-top.mustache'),
            bodyEnd: grunt.file.read('moj-template/partials/body-end.mustache')
          },
          template: '<%= replace.govuk_template.src %>',
          dest: '<%= dirs.dist %>moj_template.html'
        }]
      }
    },

    copy: {
      govuk_mustache: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_template %>pkg/',
            src: ['mustache_govuk_template-*/**'],
            dest: '<%= dirs.temp %>/',
            rename: function (dest, src) {
              var path = require('path'),
                  component = src.split(path.sep).slice(0, 1)[0];

              return dest + src.replace(component, 'govuk_template');
            }
          }
        ]
      },
      govuk_assets: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.temp %>govuk_template/assets/',
            src: ['**'],
            dest: '<%= dirs.dist %>'
          }
        ]
      },
      moj_partials: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>app/views/layouts/partials/',
            src: ['**'],
            dest: '<%= dirs.temp %>/moj_boilerplate/partials/'
          }
        ]
      },
      sass: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_template %>app/assets/stylesheets/',
            src: ['**'],
            dest: '<%= dirs.src %>sass/'
          },
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>stylesheets/',
            src: ['**'],
            dest: '<%= dirs.src %>sass/'
          },
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>app/assets/stylesheets/',
            src: ['**'],
            dest: '<%= dirs.src %>sass/'
          }
        ]
      },
      govuk_frontend_toolkit: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>',
            src: ['images/**'],
            dest: '<%= dirs.dist %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.govuk_toolkit %>',
            src: ['javascripts/**'],
            dest: '<%= dirs.temp %>govuk_toolkit/'
          }
        ]
      },
      moj_boilerplate: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>app/assets/',
            src: ['images/**'],
            dest: '<%= dirs.dist %>'
          },
          {
            expand: true,
            cwd: '<%= dirs.moj_boilerplate %>app/assets/',
            src: ['javascripts/**'],
            dest: '<%= dirs.temp %>moj_boilerplate/'
          }
        ]
      }
    },

    sass: {
      dist: {
        files: {
          '<%= dirs.dist %>stylesheets/moj.css': '<%= dirs.src %>sass/moj-base.scss'
        }
      }
    },

    haml: {
      moj_partials: {
        files: {
          '<%= dirs.temp %>moj_boilerplate/partials/_content.html': '<%= dirs.temp %>moj_boilerplate/partials/_content.html.haml'
        }
        // files: grunt.file.expandMapping(['<%= dirs.temp %>moj_boilerplate/partials/*.haml'], '<%= dirs.temp %>moj_boilerplate/haml/', {
        //   rename: function(base, path) {
        //     return base + path.replace(/\.haml$/, '.js');
        //   }
        // })
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-mustache-render');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-haml');

  // Default task.
  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', [
    'clean:prebuild',
    'copy:govuk_mustache',
    'replace:govuk_template',
    'mustache_render:govuk_template',
    'copy:govuk_assets',
    'copy:moj_partials',
    'copy:govuk_frontend_toolkit',
    'copy:moj_boilerplate',
    'copy:sass',
    'sass',
    'concat',
    'uglify',
    'clean:postbuild'
  ]);

};


