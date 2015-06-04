'use strict';

var _ = require('lodash');
var Themes = require('./themes.model');
var CRUD = require('../../components/CRUD');
var setGlobalTheme = require('../../components/themes');
var compileIndex = require('../../components/index');
var collection = new CRUD(Themes);
var fs = require('fs');
var config = require('../../config/environment');
var Decompress = require('decompress');
var zip = require('decompress-unzip');
var formidable = require('formidable');
var initThemes = require('../../init/themes.js');
var fse = require('fs-extra');
var config = require('../../config/environment');
var app = config.app;

// Get list of themes
exports.findAll = function(req, res) {
  collection.findAll(req, res);
};

exports.activate = function(req, res) {
	if(!req.body.id) { return res.send(500); }
	Themes.update({}, {active: false}, {multi: true}, function(err, found) {
	  if (err) { return res.send(500, err); }
	  Themes.update({_id: req.body.id}, {active: true}, function(error, found) {
	  	if (error) { return res.send(500, error); }
	  	if(!found) { return res.send(404); }
	  	compileIndex();
	  	return res.json(found);
	  });
	});
};

// Get some pages
exports.find = function(req, res) {
  collection.find(req, res);
};

// Creates a new pages in the DB.
exports.create = function(req, res) {
  collection.create(req, res);
};

// Extracts a new theme to the database.
exports.upload = function(req, res) {
  var createdFolderName = '125098dsflkj1324';
	try {
		var form = new formidable.IncomingForm();
		form.keepExtensions = true;
		form.parse(req, function(err, fields, files) { 
      if(err) { uploadingThemeError(err, res, createdFolderName); }
    	var tempFilePath = files.file.path;
    	var userFileName  = files.file.name;
    	var contentType   = files.file.type;

      createdFolderName = userFileName.replace(/\.[^/.]+$/, "");

      var decompress = new Decompress()
        .src(tempFilePath)
        .dest(app.get('appPath') + 'themes/' + createdFolderName)
        .use(zip({strip: 1}));
      decompress.run(function (err, files) {
        if (err) { throw err; }
        initThemes(function(error) {
          if(error) { return uploadingThemeError(error, res, createdFolderName); }
          res.status(200).send();
        });
      });
	  });
	} catch(e) {
		uploadingThemeError(e, res, createdFolderName);
	}
};


// Updates themes in the database
exports.update = function(req, res) {
  collection.update(req, res, updateFile);
};

// Deletes a themes from the DB.
exports.delete = function(req, res) {
  collection.delete(req, res, function(identifier) {
  	if(identifier && identifier.url) {
  		try {
  			fse.remove(app.get('appPath') + 'themes/' + req.query.url);
  			return res.status(204).send();
  		} catch(e) {
  			console.log('Could not delete theme', e);
  			return res.status(500).send();
  		}
  	}
  });
};

// Get a single themes
exports.findById = function(req, res) {
  collection.findById(req, res);
};

// Updates an existing page in the DB.
exports.updateById = function(req, res) {
  collection.updateById(req, res);
};

// Deletes a themes from the DB.
exports.deleteById = function(req, res) {
  collection.deleteById(req, res);
};

function uploadingThemeError(err, res, folderName) {
	console.log('Could not upload theme.', err);
  if(folderName && folderName !== '') {
    try {
      fse.remove(app.get('appPath') + 'themes/' + folderName);
    } catch(e) {
      console.log('could not delete theme from themes folder', e);
    }
    
  }
	res.status(500).send(err);
}

function updateFile(theme) {
  if(!theme) { return false; }
  var postTheme = {
    "author": theme.author,
    "email": theme.email,
    "title": theme.title,
    "website": theme.website,
    "description": theme.description
  };
	if(theme.themeJSONPath) { var themeJSONPath = theme.themeJSONPath; delete theme.themeJSONPath; }
	var themeJSON = JSON.stringify(postTheme, null, 2);
	fs.writeFileSync(app.get('appPath') + themeJSONPath, themeJSON);
}