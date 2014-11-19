module.exports = function(grunt) {

	var dirConfig = {
		distPath: 'dist/'
	};

	grunt.initConfig({

		sass: {
			css: {
				src: ['sass/*.scss'],
				dest: dirConfig.distPath + 'css/nikwhite.css'
			}
			
		},

		uglify: {
			options: {
				//TODO: banner
				compress:false,
				mangle: false,
				beautify: true
			},
			dev: {
				src: ['js/*.js'],
				dest: dirConfig.distPath + 'js/nikwhite.min.js'
			}
		},

		copy: {
			html: {
				src: '*.html',
				dest: dirConfig.distPath
			}, 
			images: {
				src: ['img/*.jpg'],
				dest: dirConfig.distPath
			},
			fonts: {
				src: ['font/nikwhite/fonts/*.*'],
				dest: dirConfig.distPath 
			}
		},

		watch: {
			project: {
				files: ['sass/**', 'js/*.js', 'index.html'],
				tasks: ['default']
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['sass', 'uglify', 'copy']);
}