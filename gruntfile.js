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
			dev: {
				src: ['js/*.js'],
				dest: dirConfig.distPath + 'js/nikwhite.js',
				options: {
					compress: false,
					mangle:   false,
					beautify: true
				}
			},
			prod: {
				src: ['js/*.js'],
				dest: dirConfig.distPath + 'js/nikwhite.js',
				options: {
					compress: {},
					mangle:   true,
					beautify: false
				}
			}
		},

		copy: {
			html: {
				src: '*.html',
				dest: dirConfig.distPath
			}, 
			images: {
				src: ['img/*.jpg', 'img/*.png'],
				dest: dirConfig.distPath
			},
			fonts: {
				src: ['font/nikwhite/fonts/*.*'],
				dest: dirConfig.distPath 
			}
		},

		watch: {
			html: {
				files: ['index.html'],
				tasks: ['copy']
			},
			sass: {
				files: ['sass/**'],
				tasks: ['sass', 'copy']
			},
			js: {
				files: ['js/*.js'],
				tasks: ['uglify:dev', 'copy']
			}
		},

		connect: {
			server: {
				options: {
					port: 8000,
					base: 'dist',
					hostname: 'localhost',
					logger: 'dev',
					middleware: function (connect, options, defaultMiddleware) {
						return [
							require('grunt-connect-proxy/lib/utils').proxyRequest
						].concat(defaultMiddleware);
					}
				},
				proxies: [
					{
						context:'/sayhello',
						host: 'localhost',
						port: 8080,
						secure: false,
						rewrite: {
							'/sayhello': '/sayhello'
						}
					}
				]
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-connect-proxy');

	grunt.registerTask('default', [
		'sass',
		'uglify:dev',
		'copy',
		'configureProxies:server',
		'connect',
		'watch'
	]);
	
	grunt.registerTask('prod', [
		'sass',
		'uglify:prod',
		'copy'
	]);
}