module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			client: {
				src: ['game/**/*.js'],
				dest: 'public/js/browserify/bundle.js'
			}
		},
		watch: {
			files: [ 'game/**/*.js'],
			tasks: [ 'browserify' ]
		},
		nodemon: {
			dev: {
				script: 'app.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-nodemon');

	grunt.registerTask('default', [
		'browserify',
		'nodemon'
	]);
};
