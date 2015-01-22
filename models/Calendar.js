var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CalendarSchema = new Schema({
	name: {type: String},
	events: [type: ObjectId, ref: 'Event'],
	owner: {type: ObjectId, ref: 'User'},
	modList: [{type: ObjectId, ref: 'User'}],
	rules: [{type: ObjectId, ref: 'Rule'}]

});

mongoose.model('Calendar', CalendarSchema);

