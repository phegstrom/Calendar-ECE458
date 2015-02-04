var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'eventsC';

// Date is a javascript Date object which you can query
// specific parts of it easily. just google javascript date object
var EventSchema = new Schema({
	name: String,
	description: String,
	location: String,
	start: {
		type: Date
	},
	end: {
		type: Date
	},
	calendar: {
		type: Schema.Types.ObjectId,
		ref: 'Calendar'
	},
	// alerts: [{type: Schema.Types.ObjectId, ref: 'Alert'}],
	alerts: [{
		time: Date,
		method: String
	}],
	// repeats: [{type: Schema.Types.ObjectId, ref: 'Repeat'}],
	repeats: [{
		frequency: {type: Number, default: null},
		endDate: {
			type: Date,
			default: null
		},
		days: [{
			type: Date
		}]
	}],

	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
}, {
	collection: collectionName
});

module.exports = mongoose.model('Event', EventSchema);