var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'slotSignUpsC';
var deepPopulate = require('mongoose-deep-populate');

var SlotSignUpSchema = new Schema({
	creator: {type: Schema.Types.ObjectId, ref: 'User'},
	name: String,
	description: String,
	minDuration: Number, // minutes
	maxDuration: Number, // minutes
	freeBlocks: [{
		start: Date,
		end: Date
	}],
	attendees: [{
		userEmail: String,
		slots: [{type: Schema.ObjectId, ref: 'Slot'}]
	}]

}, {collection: collectionName});


SlotSignUpSchema.plugin(deepPopulate);

module.exports = mongoose.model('SlotSignUp', SlotSignUpSchema);