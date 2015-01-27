var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'alerts';

var AlertSchema = new Schema({
	time: Date,
	method: String 
}, {collection: collectionName});

mongoose.model('Alert', AlertSchema);

