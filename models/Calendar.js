var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CalendarSchema = new Schema({
	name: {type: String},
	events: [{type: Schema.ObjectId, ref: 'Event'}],
	owner: {type: Schema.ObjectId, ref: 'User'},
	modList: [{type: Schema.ObjectId, ref: 'User'}],
	rules: [{type: Schema.ObjectId, ref: 'Rule'}]

});

mongoose.model('Calendar', CalendarSchema);

