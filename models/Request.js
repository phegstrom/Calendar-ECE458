var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'RequestsC';

var RequestSchema = new Schema({
	info: String,

	// ID of event that this is associated with
	eventID: {type: Schema.Types.ObjectId, ref: 'Event'},
	userIDs: [{type: Schema.Types.ObjectId, ref: 'User'}],
	usersStatus: {},
	edits: [{}]
});

module.exports = mongoose.model('Request', RequestSchema);
