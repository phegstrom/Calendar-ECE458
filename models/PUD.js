var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var Schema = mongoose.Schema;
var collectionName = 'pudC';

var PUDSchema = new Schema({
	description: String,
	myDate: {type: Date},
	time: {type: Number, get: toHours, set: toMilli}, // stored in ms
	repeatInterval: Number, // days BUT SHOULD CHANGE TO MINUTES
	alertInterval: Number, // minutes
	alert: {type: Schema.Types.ObjectId, ref: 'Alert', default: null},
	expDate: {type: Date},
	willEscalate: {type: Boolean}
}, {collection: collectionName});

function toHours(n) {
	return n/3600000;
}

function toMilli(n) {
	return n*3600000;
}

PUDSchema.plugin(deepPopulate);

module.exports = mongoose.model('PUD', PUDSchema);