var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
	name: {type: String},
	description: {type: String},
	location: {type: String},

	// does Date type include time?
	start: {type: Date},
	end: {type: Date},
	calendar: {type: Schema.ObjectId, ref: 'Calendar'},
	alerts: {type: Schema.ObjectId, ref: 'Alert'},
	repeats: {type: Schema.ObjectId, ref: 'Repeat'},
	creator: {type: Schema.ObjectId, ref: 'User'}

});

mongoose.model('Event', EventSchema);

