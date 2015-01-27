var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'repeats';

var RepeatSchema = new Schema({
	Frequency: Number,
	endDate: {type: Date, default: null},
	days: [{type: Date}]
}, {collection: collectionName});

mongoose.model('Repeat', RepeatSchema);