var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var Schema = mongoose.Schema;
var collectionName = 'pudC';

var PUDSchema = new Schema({
	description: String,
	// length of time in milliseconds
	time: {type: Number, get: toHours, set: toMilli}
}, {collection: collectionName});

function toHours(n) {
	return n/3600000;
}

function toMilli(n) {
	return n*3600000;
}

PUDSchema.plugin(deepPopulate);

module.exports = mongoose.model('PUD', PUDSchema);