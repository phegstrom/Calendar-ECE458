var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'repeatsC';

var RepeatSchema = new Schema({
	Frequency: Number,
	endDate: {type: Date, default: null},
	days: [{type: Date}]
}, {collection: collectionName});

module.exports = mongoose.model('Repeat', RepeatSchema);