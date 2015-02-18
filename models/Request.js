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

	edits: [{type: Schema.Types.Mixed}]
}, {
	collection: collectionName
});

RequestSchema.methods.changeUsersStatus = function (status, cb) {
	var obj = this.usersStatus;

	this.usersStatus = null;

	for (var i = 0; i < this.userIDs.length; i++) {
		var currId = this.userIDs[i];
		if (obj[currId].status != 'removed') {
			console.log("changed "+currId + " to "+ status);
			obj[currId].status = status;
		}
	}
	this.usersStatus = obj;

	this.save(function (err, saved) {
		cb(saved);
	});
};

module.exports = mongoose.model('Request', RequestSchema);
