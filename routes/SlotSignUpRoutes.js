var express 	= require('express');
var User 		= require('../models/User');
var UserGroup 	= require('../models/UserGroup');
var SlotSignUp 	= require('../models/SlotSignUp');
var _ 			= require('underscore');
var async 		= require('async');
var router 		= express.Router();
var Slot 		= require('../models/Slot');

// return array of createdSSEvents for a logged in user
router.get('/', function (req, res, next) {

	User.findOne({_id: req.session.user._id})
		.deepPopulate('createdSSEvents.attendees.slots')
		.exec (function (err, user) {
			if (err) next(err);				
			res.send(user.createdSSEvents);
	});

});

// return array of SSU Events that were shared to current user
router.get('/getIncoming', function (req, res, next) {

	User.findOne({_id: req.session.user._id})
		.deepPopulate('SSEvents.attendees.slots').exec(function (err, user) {
			res.send(user.SSEvents);
	});

});

// create a SlotSignUp
router.post('/', function (req, res, next) {

	var uid = req.session.user._id;

	var ssu = new SlotSignUp();

	ssu.creator = req.session.user._id;
	ssu.name = req.body.evName;
	ssu.description = req.body.evDescription;
	ssu.minDuration = req.body.evMinDuration;
	ssu.maxDuration = req.body.evMaxDuration;

	// ssu.freeBlocks = req.body.evFreeBlocks;
	// var date1 = new Date();
	// var date2 = new Date();
	// date2.setMinutes(date2.getMinutes() + 45);

	// ssu.freeBlocks = [{start: date1, end: date2}];

	// for each attendee email received, add info
	ssu.maxPerUser = req.body.evMaxPerUser;
	ssu.freeBlocks = req.body.evFreeBlocks;
	// ssu.freeBlocks = [{start: new Date(), end: new Date()}];
	ssu.assocUserGroups = req.body.userGroupIds;
	
	var usergroupIds = [];
	// update invite lists SSEvents
	async.waterfall([
		function (next) {
			UserGroup.getUserIds(req.body.userGroupIds, function (err, ids) {
				usergroupIds = ids;
				next(err, ids);
			});
		},
		function (ids, next) {
			User.toIds(req.body.userEmails, function (err, uids) {
				uids = _.pluck(uids, '_id');
				ssu.assocUsers = uids;
				console.log('uids: ' + uids);
				console.log('ids: ' + ids);
				ids = _.union(ids, uids);
				next(err, ids);
			});			
		},
		function (ids, next) {
			User.toEmails(ids, function (err, emails) {
				emails.forEach(function (email) {
					ssu.attendees.push({userEmail: email, slots: []});
				});
				console.log('attendees: ' + ids);
				next(err, ids);
			});
		},
		function (result, next) {	
			console.log('Slot signup result for attendee population.');
			console.log(result);
			// update for all invitees	
			for (var i = 0; i < result.length; i++) {
				User.findOneAndUpdate({_id: result[i]}, {$push: {SSEvents: ssu._id}}, function (err, numAffected) {});
			}


			ssu.save(function (err, saved) {
				if (err) next(err);

				User.findOneAndUpdate({_id: uid}, {$push: {createdSSEvents: saved._id}}, function (err, numAffected) {
					res.send(saved);
				});

			});

		}
	]);


});

router.put('/cancelSlot/:slotId', function (req, res, next) {

	async.waterfall([
		function (next) {
			Slot.findOne({_id: req.params.slotId}, function (err, slot) {
				next(slot);
			});
		},
		function (slot, next) {
			SlotSignUp.findOne({_id: slot._id}, function (err, ssu) {
				ssu.createFreeBlocksAndUpdate(slot, function (err, saved) {					
					next();
				});
			});		
		},
		function (next) {	

		}
	]);

});

// delete a SlotSignUp
router.delete('/:ssuId', function (req, res, next) {

	var uid = req.session.user._id;

	SlotSignUp.findOne({_id: req.params.ssuId}, function (err, ssu) {

		ssu.getAllAssociatedUsers(function (err, uids) {
			console.log(uids);
			console.log("ssu id to delete: " + ssu._id);
			for (var i = 0; i < uids.length; i++) {
				User.findOneAndUpdate({_id: uids[i]}, {$pull: {SSEvents: ssu._id}}, function (err, numAffected) {});
			}

			User.findOneAndUpdate({_id: uid}, {$pull: {createdSSEvents: ssu._id}}, function (err, numAffected) {
				ssu.remove();
				res.send('slot sign up event deleted!');
			});

		});

	});

});

router.get('/test/:date', function (req, res, next) {
	var date1 = new Date(req.params.date);
	var date2 = new Date(req.params.date);
	date2.setMinutes(date2.getMinutes() + 15);
	console.log("date1: " + date1);
	console.log("date2: " + date2);



	res.send(req.params.date);
});

router.put('/signUp/:ssuId', function (req, res, next) {
	//ssuId from a User's SSEvents
	//will receive a start and end time
	//remove freeBlocks from SlotSignUp
	//do something...create a Slot object, add to User's Slot, etc

	//req.body.start, req.body.end
	var startDate = req.body.start;
	var endDate = req.body.end;

	SlotSignUp.findOne({_id: req.params.ssuId}, function (err, ssu) {
		ssu.takeFreeBlocks(startDate, endDate);

		User.findOne({_id: req.session.user._id}, function (err, user) {
			var newSlot = new Slot();
			newSlot.useremail = req.session.user.email;
			newSlot.SSU = ssu._id;
			newSlot.start = startDate;
			newSlot.end = endDate;
			newSlot.basicBlocks = ((startDate - endDate)/60000) / ssu.minDuration;
			user.mySlots.push(newSlot);

			ssu.attendees.forEach(function (attendee) {
				if(attendee.userEmail == req.session.user.email) {
					attendee.slots.push(newSlots._id);
				}
			});

			newSlot.save();
			user.save();
		});

		ssu.save();

		res.send(ssu);
	});

});

module.exports = router;