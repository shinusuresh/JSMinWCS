var gulp = require('gulp')
	through = require('through2');
	gutil = require('gulp-util')
    concat = require('gulp-concat')
	usemin = require('gulp-usemin')
    uglify = require('gulp-uglify')
    assets = require('gulp-assets')
	at = require('gulp-asset-transform')
	injectstring = require('gulp-inject-string')
	inject = require('gulp-inject')
	tap = require('gulp-tap')
	recorder = require('stream-recorder')
	htmlbuild = require('gulp-htmlbuild')
	es = require('event-stream')
	modify = require('gulp-modify')
	notify = require('gulp-notify')
    livereloadForWas = require('gulp-livereload-for-was')
    readLine = require ("readline")
    args = require('yargs').argv;
	customminify = require('./');

var scriptlet = '<c:choose>\n<c:when test="${true eq param.jsdebug}">\n</c:when>\n<c:otherwise>\n' + 
									'<!-- build:js <%= min.name %> -->\n' +
									'<!-- endbuild -->\n' +
									'\n</c:otherwise>\n</c:choose>\n';
	
gulp.task('default', function(){
	console.log('Test Gulp');
});

gulp.task('test', function(){
	gutil.log('called test');
});

gulp.task('tap', function(){	
	gulp.src('src/jsp/*.jsp')	
		.pipe(tap(function(file, t) {
			console.log(file)
			console.log(t)
		}))		
});

gulp.task('recorder', function(){	
	gulp.src('src/jsp/*.jsp')	
		.pipe(recorder.obj(function(buffer) {
			console.log(buffer[0].contents)			
		}))		
});

gulp.task('modify', function(){	
	gulp.src('src/jsp/*.jsp')	
		.pipe(modify({
            fileModifier: function(file, contents) {
					console.log(file)
					console.log(contents)
                    return contents;
                }
        }))
		.pipe(gulp.dest('dist'));
});


gulp.task('transform', function(){	
	gulp.src('src/jsp/*.jsp')	
		.pipe(injectstring.before('<!-- at:jsmin', '<c:choose>\n<c:when test="${true eq param.jsdebug}">\n</c:when>\n<c:otherwise>\n'))    
		.pipe(injectstring.after('<!-- at:end -->', '\n</c:otherwise>\n</c:choose>\n'))		
		/* .pipe(recorder.obj(function(buffer) {
			console.log(buffer[0].contents)		
			console.log(buffer[0].isBuffer())
			var a = new Buffer('test adding buffer')
			var bData = Buffer.concat([a, buffer[0].contents])
			console.log(bData);
		})) */					
		
		.pipe(at({				
			/* tagTemplates:{                
                injectscriptlet:function(outputFilename){ 
					var scriptlet = '<c:choose>\n<c:when test="${true eq param.jsdebug}">\n</c:when>\n<c:otherwise>\n' + 
									'<!-- build:js ' + outputFilename + ' -->\n' +
									'<!-- endbuild -->\n' +
									'\n</c:otherwise>\n</c:choose>\n';
					//return scriptlet
					return ''
				}
            }, */
			jsmin: {
				stream: function (filestream, outputFilename){
						gutil.log('Entering stream ' )
						gutil.log(filestream)					
						
						gutil.log('File name in stream : '+outputFilename)
						
                    return filestream  						
                        .pipe(concat(outputFilename))												
						/* .pipe(usemin({			
							js: [uglify()]
						}))	 */
                }, 
					
				/* tagTemplate:
					function(outputFilename){ 
						gutil.log('Entering tagTemplate ')						
						var scriptlet = '<c:choose>\n<c:when test="${true eq param.jsdebug}">\n</c:when>\n<c:otherwise>\n' + 
										'<!-- build:js ' + outputFilename + ' -->\n' +										
										'\n<!-- endbuild -->\n' +
										'\n</c:otherwise>\n</c:choose>\n';							
						return scriptlet									
					}, */
					
			}			
		}))		
		/* .pipe(usemin({			
			js: [uglify()]
		})) */
		.pipe(gulp.dest('dist'));
});

function injectScriptlet(filename, string){
	var src = require('stream').Readable({ objectMode: true })
	src._read = function () {
		//this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
		//this.push(null)
		console.log(filename)
		console.log(string)
	  }
  return src
}


var gulpContents = function (opts) {
  var paths = es.through();
  var files = es.through();  
  
  //console.log(files)
  //var jsContents;
  paths.pipe(es.writeArray(function (err, srcs) {	  
	console.log('gulpContents')
	console.log(srcs)
	//jsContents = srcs;	    
  }));
  return es.duplex(paths, files);
};

var gulpSrc = function (opts) {
  var paths = es.through();
  var files = es.through();    
  paths.pipe(es.writeArray(function (err, srcs) {	 
	console.log('gulpSrc')  
	console.log(srcs)
    gulp.src(srcs, opts).pipe(files);
  }));
  
  return es.duplex(paths, files);
};

gulp.task('htmlbuild', function(){
	return gulp.src('src/jsp/testhtmlbuild.jsp')
		.pipe(htmlbuild({
			js: htmlbuild.preprocess.js(function (block) {        				
				var cnts = gulpContents();
				var glpSrc = gulpSrc();
				
				//console.log(cnts)
				 block.pipe(glpSrc)				 				 
				/*  .pipe(jsBuild);
				
				block.end('js/concat.js'); */
				
			  }),
			content: function(block){								
				es.readArray([
				  '<!--',
				  '  processed by htmlbuild (' + block.args[0] + ')',
				  '-->'
				].map(function (str) {
				  return block.indent + str;
				})).pipe(block);
			}
		}))
		.pipe(gulp.dest('dist'));
})

gulp.task('inject:scriptlet', function(){
    return gulp.src('src/jsp/*.jsp')
        .pipe(injectstring.before('<!-- at:jsmin', '<c:choose>\n<c:when test="${true eq param.jsdebug}">\n</c:when>\n<c:otherwise>\n'))        		
		.pipe(injectstring.after('<!-- at:end', '\n</c:otherwise>\n</c:choose>\n'))        		
        .pipe(gulp.dest('dist'));
});

gulp.task('concatminify', function(){
	return gulp.src('src/jsp/*.jsp')
		.pipe(usemin({
			js: [uglify()]
			// in this case css will be only concatenated (like css: ['concat']). 
		  }))
      .pipe(gulp.dest('dist/'));
});

gulp.task('process-scripts', function(){
	return gulp.src('src/script/javascript/*.js')
	.pipe(concat('main.js'))
	.pipe(uglify())
	.pipe(gulp.dest('dist/scripts'))
})

/*
 * Minify
 */
var actionarg = (args.type != undefined ? args.type : 'append');
console.log('ARGUME Is '+actionarg);

gulp.task('watchminify', function(){
	gulp.src(WATCH_SOURCE_FOLDER)
	.pipe(customminify({
		action: actionarg,
    	enableHtmlComment: true
	}))
	.pipe(gulp.dest(WATCH_DEST_FOLDER))
})

/*
 * Live reload 
*/
var WATCH_SOURCE_FOLDER = '../../SiteAdministration/WebContent/dsl-ext.jsp';
var WATCH_DEST_FOLDER = '../../SiteAdministration/WebContent';
gulp.task('watch', [ 'removeLivereloadScript' ], function () {
    livereloadForWas.listen();
    gulp
        .src(WATCH_SOURCE_FOLDER)
        .pipe(livereloadForWas.insertScriptForWas())
        /*.pipe(customminify({
        	action: actionarg,
        	enableHtmlComment: true
        }))*/
        .pipe(gulp.dest(WATCH_DEST_FOLDER))
        .pipe(notify({
            message : 'livereload script added'
        }))
        
    gulp.watch(WATCH_SOURCE_FOLDER).on('change', livereloadForWas.changed);
    
    if (process.platform === "win32"){
        var rl = readLine.createInterface ({
            input: process.stdin,
            output: process.stdout
        });
        //console.log(rl)
        rl.on ("SIGINT", function (){
            process.emit ("SIGINT");
        });

    }
 
    //catches ctrl+c event 
    process.on('SIGINT', function () {
        gulp
            .src(WATCH_SOURCE_FOLDER)
            .pipe(livereloadForWas.removeScriptForWas())
            .pipe(gulp.dest(WATCH_DEST_FOLDER))
            .pipe(notify({
                message : 'livereload script removed'
            }))
            .pipe(livereloadForWas.exit());            
    });
    process.on('exit', function () {
        gulp
            .src(WATCH_SOURCE_FOLDER)
            .pipe(livereloadForWas.removeScriptForWas())
            .pipe(gulp.dest(WATCH_DEST_FOLDER))
            .pipe(notify({
                message : 'livereload script removed'
            }));
    });
});
 
// remove livereload script 
gulp.task('removeLivereloadScript', function () {
    gulp
        .src(WATCH_SOURCE_FOLDER)
        .pipe(livereloadForWas.removeScriptForWas())
        //.pipe(removeScriptletForJs())
        .pipe(gulp.dest(WATCH_DEST_FOLDER))
        .pipe(notify({
            message : 'livereload script removed'
        }))
                
});

//For appending scriptlet

function removeScriptletForJs() {
	console.log('Removing scriptlet contents')
}

