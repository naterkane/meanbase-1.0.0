'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validators = require('mongoose-validators');

var SharedContentSchema = new Schema({
  contentName: {
  	type: String,
  	unique: true,
  	required: true,
    validate: validators.isTitle()
  },
  data: Schema.Types.Mixed,
  config: Schema.Types.Mixed,
  type: {
  	type: String,
  	required: true,
  	validate: validators.isTitle()
  }
});

module.exports = mongoose.model('SharedContent', SharedContentSchema);