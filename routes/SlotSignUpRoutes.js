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
	console.log("post");

	var uid = req.session.user._id;

	var ssu = new SlotSignUp();

	ssu.creator = req.session.user._id;
	ssu.name = req.body.evName;
	ssu.description = req.body.evDescription;
	ssu.minDuration = req.body.evMinDuration;
	ssu.maxDuration = req.body.evMaxDuration;

	// for each attendee email received, add info
	ssu.maxPerUser = req.body.evMaxPerUser;
	ssu.freeBlocks = req.body.evFreeBlocks;
	// ssu.freeBlocks = [{start: new Date(), end: new Date()}];
	ssu.assocUserGroups = req.body.userGroupIds;

	// preference based signups
	ssu.preferenceBased = req.body.preferenceBased;
	ssu.createPud = req.body.createPud;
	ssu.signupDate = req.body.signupDate;
	
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
				ids = _.union(ids, uids);
				next(err, ids);
			});			
		},
		function (ids, next) {
			User.toEmails(ids, function (err, emails) {
				emails.forEach(function (email) {
					ssu.attendees.push({userEmail: email, pudId: null, slots: []});
				});
				next(err, ids);
			});
		},
		// result is all recipient ids
		function (result, next) {	
			// update for all invitees
			// add newly created ssu to recipients
			for (var i = 0; i < result.length; i++) {
				User.findOneAndUpdate({_id: result[i]}, {$push: {SSEvents: ssu._id}}, function (err, numAffected) {});
			}

			// create PUDs for all invited users
			if (ssu.createPud) {
				var descString = 'SSU Reminder!'; 
				var pudObject = {
									description: descString,
									time: 0,
									myDate: Date.now(),
									expDate: ssu.signupDate,
									willEscalate: false,
								};

				createPUDsForAllUsers(result, pudObject, ssu, function (ssuRet) {
						next(null, ssuRet);
				});							
			} else {
				next(null, ssu);
			}

		},

		function (ssu) {
			
			ssu.save(function (err, saved) {
				if (err) next(err);

				User.findOneAndUpdate({_id: uid}, {$push: {createdSSEvents: saved._id}}, function (err, numAffected) {
					console.log('about to send response');
					res.send(saved);
				});
			});

		}
	]);
});


// will loop through all users and create a PUD for the recipients
function createPUDsForAllUsers(allIds, pudObj, ssu, cb) {

	var fnArray = createWaterfallArray(ssu, allIds, pudObj);

	// final function in waterfall
	var lastFunction = function (ssu) {
		cb(ssu);
	};

	fnArray.push(lastFunction);

	// now execute all functions, will return ssu updated in cb
	async.waterfall(fnArray);

};

function createWaterfallArray(ssu, allIds, pudObj) {

	// first function in waterfall function array
	var f = function (next) {
		next(null, ssu);
	};

	var funcArray = [];

	funcArray.push(f);

	// create individual functions for each request to venmo server
	for (var i = 0; i < allIds.length; i++) {
		
		var f = createFunctionInArray(allIds[i], pudObj, ssu);
		
		funcArray.push(f);

	}

	return funcArray;

};

// creates venmo_charge function to send in waterfall
function createFunctionInArray(userId, pudObj, ssu) {

	// one of the functions in array
	var f = function(ssu, next) {
		var pud = new PUD(pudObj);
		pud.save(function (err, saved) {
			if (err) console.log(err);
			console.log('create function');
			User.findOne({_id: userId}, function (err, user) {
				user.PUDs.push(pud._id);

				var jSSU = ssu.toJSON();

				var attendeesTemp = jSSU.attendees;
				ssu.attendees = null;

				// add pud id to 
				for(var i = 0; i < attendeesTemp.length; i++) {
					if(attendeesTemp[i].userEmail == user.email) {
						attendeesTemp[i].pudId = saved._id;
					}
				}

				ssu.attendees = attendeesTemp;

				user.save(function (err, saved) {
					if (err) console.log(err);
					next(err, ssu);
				})				
			});
		});
	};

	return f;
}

router.put('/cancelSlot/:slotId', function (req, res, next) {

	async.waterfall([
		function (next) {
			Slot.findOne({_id: req.params.slotId}, function (err, slot) {
				SlotSignUp.findOne({_id: slot.SSU}, function (err, ssu) {
					ssu.createFreeBlocksAndUpdate(slot, function (err, saved) {
						next(err, saved);
					});
				});	
			});
		},
		function (saved, next) {
			Slot.findOneAndRemove({_id: req.params.slotId}, function (err) {
				res.send(saved);
			});
		}
	]);
});

// delete a SlotSignUp
router.delete('/:ssuId', function (req, res, next) {
	// do we need to find and remove Slots from attendees?

	var uid = req.session.user._id;

	SlotSignUp.findOne({_id: req.params.ssuId}, function (err, ssu) {

		ssu.getAllAssociatedUsers(function (err, uids) {
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
			var startTemp = new Date(req.body.start);
			var endTemp = new Date(req.body.end);
			var block = (((endTemp.getTime() - startTemp.getTime())/60000) / ssu.minDuration);
			newSlot.basicBlocksNumber = block;
			
			user.mySlots.push(newSlot);

			var jSSU = ssu.toJSON();

			var attendeesTemp = jSSU.attendees;
			var pudId;
			ssu.attendees = null;

			for(var i = 0; i < attendeesTemp.length; i++) {
				if(attendeesTemp[i].userEmail == req.session.user.email) {
					attendeesTemp[i].slots.push(newSlot._id);
					pudId = attendeesTemp[i].pudId;
					attendeesTemp[i].pudId = null;
				}
			}

			PUD.findOneAndRemove({_id: pudId}, function (err, pud) {

			});

			ssu.attendees = attendeesTemp;

			newSlot.save(function (err, nsSaved) {
				user.save(function (err, uSaved) {
					ssu.save(function (err, ssuSaved) {
						res.send(ssuSaved);
					});
				});
			});

		});
	});
});

// handles reordering of priorities
router.put('/reorder', function (req, res, next) {
	var ssuId = req.body.ssuId;

	SlotSignUp.findOne({_id: ssuId}, function (err, ssu) {
		var jSSU = ssu.toJSON();
		var attendeesTemp = jSSU.attendees;
		ssu.attendees = null;

		for(var i = 0; i < attendeesTemp.length; i++) {
			if(attendeesTemp[i].userEmail == req.session.user.email) {
				attendeesTemp[i].slots = req.body.slots;
			}
		}
		ssu.attendees = attendeesTemp;

		ssu.save(function (err, ssuSaved) {
			res.send(ssuSaved);
		});
	});
});

module.exports = router;