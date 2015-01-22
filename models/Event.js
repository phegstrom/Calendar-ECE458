var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
	name: {type: String},
	description: {type: String},
	location: {type: String},

	// does Date type include time?
	start: {type: Date},
	end: {type: Date},
	calendar: {type: ObjectId, ref: 'Calendar'},
	alerts: {type: ObjectId, ref: 'Alert'},
	repeats: {type: ObjectId, ref: 'Repeat'},
	creator: {type: ObjectId, ref: 'User'}

});

mongoose.model('Event', EventSchema);

