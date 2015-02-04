var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'alertsC';

var AlertSchema = new Schema({
	time: Date,
	method: String,
	owner: {type: Schema.Types.ObjectId, ref: 'User'}
}, {collection: collectionName});

module.exports = mongoose.model('Alert', AlertSchema);