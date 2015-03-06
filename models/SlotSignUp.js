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
	maxBlocksPerUser: Number,
	freeBlocks: [{
		start: Date,
		end: Date
	}],
	attendees: [{
		userEmail: String,
		slots: [{type: Schema.Types.ObjectId, ref: 'Slot'}]
	}]

}, {collection: collectionName});

SlotSignUpSchema.methods.takeFreeBlocks = function (startDate, endDate) {
	var start = new Date(startDate);
	var end = new Date(endDate);
	for (var i = 0; i < this.freeBlocks.length; i++) {
		var currBlock = this.freeBlocks[i];
		if(currBlock.start <= start && currBlock.end >= end) {
			this.freeBlocks.splice(i, 1);

			if(currBlock.end != end) {
				this.freeBlocks.splice(i, 0, {start: end, end: currBlock.end});
			}
			if(currBlock.start != start) {
				this.freeBlocks.splice(i, 0, {start: currBlock.start, end: start});
			}
		}
	}

	this.save();
};

SlotSignUpSchema.methods.addFreeBlocks = function () {

};

// UserSchema.methods.getBestPUD = function (alottedTime, cb) {
// 	var pudArray = this.PUDs;

// 	this.model('User').findOne({_id: this._id}).populate('PUDs').exec(function (err, user) {
// 		// console.log(user);
// 		if (err) next(err);
// 		var didBreak = false;
// 		var pudArray = user.PUDs;
// 		for (var i = 0; i < pudArray.length; i++) {
// 			if (pudArray[i].time <= alottedTime) {
// 				cb(pudArray[i]);
// 				didBreak = true;
// 				break;
// 			}
// 		}

// 		if (!didBreak)
// 			cb(null);
		
// 	});
// };

SlotSignUpSchema.plugin(deepPopulate);

module.exports = mongoose.model('SlotSignUp', SlotSignUpSchema);