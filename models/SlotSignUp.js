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
		slots: [{type: Schema.Types.ObjectId, ref: 'Slot'}]
	}]

}, {collection: collectionName});

SlotSignUpSchema.methods.takeFreeBlocks = function (startDate, endDate) {
	var start = new Date(startDate);
	var end = new Date(endDate);
	for (var i = 0; i < this.freeBlocks.length; i++) {
		var currBlock = this.freeBlocks[i];
		if(currBlock.start.getTime() <= start.getTime() && currBlock.end.getTime() >= end.getTime()) {
			this.freeBlocks.splice(i, 1);

			if(currBlock.end.getTime() != end.getTime()) {
				this.freeBlocks.splice(i, 0, {start: end, end: currBlock.end});
			}
			if(currBlock.start.getTime() != start.getTime()) {
				this.freeBlocks.splice(i, 0, {start: currBlock.start, end: start});
			}
		}
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
	var numBlocks = slot.basicBlocksNumber;
	var startDate = slot.start;
	var fBlocksToAdd = [];
	var counter = 0;
	for (var i = 0; i < numBlocks; i++) {
		counter++;
		var endDate = startDate;
		endDate.setMinutes(startDate.getMinutes() + this.minDuration);
		fBlocksToAdd.push({start: startDate, end: endDate});
		startDate.setMinutes(startDate.getMinutes() + this.minDuration);
	}
	console.log('freeblocks created: '+ counter);

	this.freeBlocks.push(fBLocksToAdd);
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