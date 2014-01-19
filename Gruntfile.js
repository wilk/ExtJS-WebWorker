module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig ({
		uglify: {
			dist: {
				files: {
					'WebWorker.min.js': 'WebWorker.js' ,
					'WebWorkerManager.min.js': 'WebWorkerManager.js'
				}
			}
		} ,
		jshint: {
			dist: {
				options: {
					globals: {
						Ext: true
					} ,
					eqeqeq: true ,
					undef: true ,
					eqnull: true ,
					browser: true ,
					smarttabs: true ,
					loopfunc: true
				} ,
				src: ['WebWorker.js', 'WebWorkerManager.js']
			}
		}
	});

	grunt.registerTask ('check', ['jshint']);
	grunt.registerTask ('minify', ['uglify']);
	grunt.registerTask ('build', ['check', 'minify']);
};
