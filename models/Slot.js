var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'slotC';
var deepPopulate = require('mongoose-deep-populate');

var SlotSchema = new Schema({
	useremail: String,
	SSU: {type: Schema.Types.ObjectId, ref: 'SlotSignUp'},
	start: Date,
	end: Date
}, {collection: collectionName});


SlotSchema.plugin(deepPopulate);

module.exports = mongoose.model('Slot', SlotSchema);