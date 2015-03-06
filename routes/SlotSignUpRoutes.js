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

	User.findOne({_id: req.session.user._id}, 'createdSSEvents')
		.populate('createdSSEvents')
		.exec (function (err, user) {
			if (err) next(err);				
			res.send(user.createdSSEvents);
	});

});

// return array of SSU Events that were shared to current user
router.get('/getIncoming', function (req, res, next) {

	User.findOne({_id: req.session.user._id})
		.populate('SSEvents').exec(function (err, user) {
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
	ssu.maxPerUser = req.body.evMaxPerUser;
	// ssu.freeBlocks = req.body.evFreeBlocks;
	ssu.freeBlocks = [{start: new Date(), end: new Date()}];
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
				ssu.assocUsers = uids;
				ids = _.union(ids, uids);
				next(err, ids);
			});			
		},
		function (ids, next) {
			User.toEmails(ids, function (err, emails) {
				emails.forEach(function (email) {
					ssu.attendees.push({userEmail: email, slots: []});
				});
				next();
			});
		},
		function (result) {	
			// update for all invitees	
			for (var i = 0; i < result.length; i++) {
				User.findOneAndUpdate({_id: result[i]}, {$push: {SSEvents: ssu._id}}, function (err, numAffected) {});
			}
		}
	]);

	ssu.save(function (err, saved) {
		if (err) next(err);

		User.findOneAndUpdate({_id: uid}, {$push: {createdSSEvents: saved._id}}, function (err, numAffected) {
			res.send(saved);
		});

	});

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




module.exports = router;