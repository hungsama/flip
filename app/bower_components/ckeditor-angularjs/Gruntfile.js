/**
 * Created by shini on 03/03/2015.
 */

module.exports = function (grunt) {
    grunt.initConfig({
        cmpnt: grunt.file.readJSON('bower.json'),
        banner: '/*! Ckeditor v<%= cmpnt.version %> Adrien Gandarias */\n',
        clean: {
            working: {
                src: ['src/ckeditor-angularjs.*', './.temp/']
            }
        },
        uglify: {
            build: {
                files: [{
                    src: 'src/ckeditor-angularjs.*',
                    dest: 'build/ckeditor-angularjs.min.js'
                }]
            }
        }
    });
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);

};