var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'slotSignUpsC';
var deepPopulate = require('mongoose-deep-populate');
var async = require('async');
var UserGroup = require('./UserGroup');
var _ = require('underscore');

var SlotSignUpSchema = new Schema({
	creator: {type: Schema.Types.ObjectId, ref: 'User'},
	name: String,
	description: String,
	minDuration: Number, // minutes
	maxDuration: Number, // minutes
	maxPerUser: Number,
	assocUsers: [{type: Schema.Types.ObjectId, ref: 'User'}], // users invited to
	assocUserGroups: [{type: Schema.Types.ObjectId, ref: 'UserGroup'}], // usergroups invited to
	freeBlocks: [{
		start: Date,
		end: Date
	}],
	attendees: [{
		userEmail: String,
		pudId: {type: Schema.Types.ObjectId, ref: 'PUD'}, // so we know what PUD to mark completed when they sign up
		slots: [{type: Schema.Types.ObjectId, ref: 'Slot'}]
	}],
	preferenceBased: Boolean,
	createPud: Boolean,
	signupDate: Date
}, {collection: collectionName});

SlotSignUpSchema.methods.takeFreeBlocks = function (startDate, endDate) {
	var newStart = new Date(startDate);
	var newEnd = new Date(startDate);
	newEnd.setMinutes(newEnd.getMinutes() + this.minDuration);
	var finalEnd = new Date(endDate);

	var bool = true;

	while(bool) {
		if(newEnd.getTime() > finalEnd.getTime()) {
			newEnd = finalEnd;
			bool = false;
		}

		for (var i = 0; i < this.freeBlocks.length; i++) {
			var currBlock = this.freeBlocks[i];

			if(currBlock.start.getTime() <= newStart.getTime() && currBlock.end.getTime() >= newEnd.getTime()) {
				console.log("removed: "+this.freeBlocks[i].start);
				this.freeBlocks.splice(i, 1);

				if(currBlock.end.getTime() != newEnd.getTime()) {
					this.freeBlocks.splice(i, 0, {start: newEnd, end: currBlock.end});
				}
				if(currBlock.start.getTime() != newStart.getTime()) {
					this.freeBlocks.splice(i, 0, {start: currBlock.start, end: newStart});
				}
				break;
			}
		}
		newStart.setMinutes(newStart.getMinutes() + this.minDuration);
		newEnd.setMinutes(newEnd.getMinutes() + this.minDuration);		
	}

	this.save();
};

SlotSignUpSchema.methods.addFreeBlocks = function () {

};

SlotSignUpSchema.plugin(deepPopulate);

// returns cb(array) that holds array of all
// the slot sign up
SlotSignUpSchema.methods.getAllAssociatedUsers = function (cb) {
	var toRet = [];

	for (var i = 0; i < this.assocUsers.length; i++) {
		toRet.push(this.assocUsers[i]);
	}

	var promise = UserGroup.find({_id: {$in: this.assocUserGroups}})
		.exec(function (err, ugroups) {});

	promise.addBack(function(err, args) {		
		for(var i = 0; i < args.length; i++) {
			for(var j = 0; j < args[i].users.length; j++) {
				if(toRet.indexOf(args[i].users[j]) == -1)
					toRet.push(args[i].users[j]);
			}
		}

		cb(err, toRet);
	});
}

SlotSignUpSchema.methods.createFreeBlocksAndUpdate = function (slot, cb) {
	console.log("slot: "+JSON.stringify(slot));
	var numBlocks = slot.basicBlocksNumber;
	var startDate = slot.start;
	var fBlocksToAdd = [];
	var counter = 0;

	for (var i = 0; i < numBlocks; i++) {
		counter++;
		startDate = new Date(startDate);
		var endDate = new Date(startDate);
		endDate.setMinutes(startDate.getMinutes() + this.minDuration);

		fBlocksToAdd.push({start: startDate, end: endDate});

		startDate = new Date(startDate);
		startDate.setMinutes(startDate.getMinutes() + this.minDuration);
	}

	this.freeBlocks = _.union(this.freeBlocks, fBlocksToAdd);
	this.freeBlocks = _.sortBy(this.freeBlocks, 'start');

	this.attendees.forEach(function (attendee) {
		if (attendee.userEmail == slot.useremail) {
			attendee.slots = _.without(attendee.slots, slot._id);
		}
	});

	this.save(function (err, saved) {
		cb(err, saved);
	});

};

module.exports = mongoose.model('SlotSignUp', SlotSignUpSchema);