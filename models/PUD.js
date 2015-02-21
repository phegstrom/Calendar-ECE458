var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var Schema = mongoose.Schema;
var collectionName = 'PUDC';

var PUDSchema = new Schema({
	description: String,
	time: Date
}, {collection: collectionName});

PUDSchema.plugin(deepPopulate);

module.exports = mongoose.model('PUD', PUDSchema);