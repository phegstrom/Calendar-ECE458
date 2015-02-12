var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'eventsC';

// Date is a javascript Date object which you can query
// specific parts of it easily. just google javascript date object
var EventSchema = new Schema({
	name: String,
	description: String,
	location: String,
	start: {type: Date},
	end: {type: Date},

	// need to phase this out
	// calendar: {type: Schema.Types.ObjectId, ref: 'Calendar'},
	
	// original creator of event
	ownerID: {type: Schema.Types.ObjectId, ref: 'User'},

	// original event if this event is a copy
	// null if this is an original event
	originalID: {type: Schema.Types.ObjectId, ref: 'Event'},

	// ID of request that this is associated with
	requestID: {type: Schema.Types.ObjectId, ref: 'Request'},

	alerts: [{type: Schema.Types.ObjectId, ref: 'Alert'}],
	repeats: [{
		frequency: {type: Number, default: null},
		endDate: {type: Date, default: null},
		days: [{type: Date}]
	}],

	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
}, {
	collection: collectionName
});

module.exports = mongoose.model('Event', EventSchema);