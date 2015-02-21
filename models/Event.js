var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'eventsC';
var states = 'regular pud'.split(' ');
var User = require('./User');

// Date is a javascript Date object which you can query
// specific parts of it easily. just google javascript date object
var EventSchema = new Schema({
	name: String,
	evType: {type: String, enum: states, default: states[0]}, 
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
	parentID: {type: Schema.Types.ObjectId, ref: 'Event', default: null},

	// ID of request that this is associated with
	requestID: {type: Schema.Types.ObjectId, ref: 'Request', default: null},

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


// return displayable information for PUD
EventSchema.method.getPUD = function () {
	if (this.evType == 'pud') {
		User.findOne({_id: this.ownerID}, function (err, user) {
			var alottedTime = this.end - this.start;
			user.getBestPUD(alottedTime, function (pud) {
				if (pud == null) return null;	
				return pud;
			});
		});
	} 
	return null;
};


module.exports = mongoose.model('Event', EventSchema);