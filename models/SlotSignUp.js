var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'slotSignUpsC';
var deepPopulate = require('mongoose-deep-populate');

var SlotSignUpSchema = new Schema({
	creator: {type: Schema.ObjectId, ref: 'User'},
	name: String,
	description: String,
	minDuration: Number, // minutes
	maxDuration: Number, // minutes
	freeBlocks: [{
		start: Date,
		end: Date
	}],
	busyBlocks: [{ // note not in increments of minDuration
		start: Date,
		end: Date,
		userEmail: String 
	}],
	attendees: [{
		userEmail: String,
		numTaken: Number
	}]
}, {collection: collectionName});


SlotSignUpSchema.plugin(deepPopulate);

module.exports = mongoose.model('SlotSignUp', SlotSignUpSchema);