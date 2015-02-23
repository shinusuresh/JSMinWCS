/*
 * Plugin which can inject jsp scriptlet code around minification to have more control 
 * for debugging javascript code in production environments
 */

var fs = require('fs');
	glob = require('glob');
	path = require('path');
	gutil = require('gulp-util');
	blocksBuilder = require('./lib/blocksBuilder.js')
	htmlBuilder = require('./lib/htmlBuilder.js')


	
var plugin = function(options) {
	return through.obj(function(file, enc, callback) {		
	    if (file.isStream()) {	      
	      this.emit('error', new gutil.PluginError('gulp-usemin', 'Streams are not supported!'));
	      callback();
	    }else if (file.isNull()){	    	
	    	callback(null, file); // Do nothing if no contents
	    }else {
	      try {	    	
	        var blocks = blocksBuilder(file, options);
	    	//block[0] - Contains file contents before <!-- build: --> tag
	    	//block[1] - contain object which has the real content to process for minification
	    	//block[2] - Contains file contents before <!-- endbuild --> tag
	    	console.log(blocks[1]);	    	
	        //console.log('JS CONTENTS : '+blocks[1].files[1].contents);
	        htmlBuilder(file, blocks, options, this.push.bind(this), callback);
	      } catch(e) {
	        this.emit('error', e);
	        callback();
	      }
	    }
	});
}

module.exports = plugin;