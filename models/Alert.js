var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'alertsC';

var AlertSchema = new Schema({
	time: Date,
	method: String 
}, {collection: collectionName});

module.exports = mongoose.model('Alert', AlertSchema);

