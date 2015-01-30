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
	calendar: {type: Schema.Types.ObjectId, ref: 'Calendar'},
	alerts: [{type: Schema.Types.ObjectId, ref: 'Alert'}],
	repeats: [{type: Schema.Types.ObjectId, ref: 'Repeat'}],
	creator: {type: Schema.Types.ObjectId, ref: 'User'}
}, {collection: collectionName});

module.exports = mongoose.model('Event', EventSchema);

