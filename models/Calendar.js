var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'calendarsC';

var CalendarSchema = new Schema({
	name: String,
	events: [{type: Schema.ObjectId, ref: 'Event'}],
	owner: {type: Schema.ObjectId, ref: 'User'},
	modList: [{type: Schema.ObjectId, ref: 'User'}],
	rules: [{type: Schema.ObjectId, ref: 'Rule'}]

}, {collection: collectionName});

module.exports = mongoose.model('Calendar', CalendarSchema);