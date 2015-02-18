var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'requestsC';

var RequestSchema = new Schema({
	info: String,

	// ID of event that this is associated with
	eventID: {type: Schema.Types.ObjectId, ref: 'Event', default: null},
	userIDs: [{type: Schema.Types.ObjectId, ref: 'User'}],

	// usersStatus: {uID: {status: String, calId: calendarID, email: String, copyEventId: eventID}}
	usersStatus: {type: Schema.Types.Mixed},
	creator: String,

	edits: [{type: Schema.Types.Mixed}]
}, {
	collection: collectionName
});

module.exports = mongoose.model('Request', RequestSchema);
