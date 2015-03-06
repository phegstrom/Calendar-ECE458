var express = require('express');
var User = require('../models/User');
var Slot = require('../models/Slot');
var SlotSignUp = require('../models/SlotSignUp');

var router 		= express.Router();

// return array of createdSSEvents for a logged in user
router.get('/', function (req, res, next) {

	var uid = req.session.user._id;

	User.findOne({_id: uid}, 'createdSSEvents')
		.populate('createdSSEvents')
		.exec (function (err, user) {
			if (err) next(err);				
			res.send(user.createdSSEvents);
	});
});

// create a SlotSignUp
router.post('/', function (req, res, next) {

	var uid = req.session.user._id;

	var ssu = new SlotSignUp();

	ssu.creator = req.body.evCreator;
	ssu.name = req.body.evName;
	ssu.description = req.body.evDescription;
	ssu.minDuration = req.body.evMinDuration;
	ssu.maxDuration = req.body.evMaxDuration;

	// ssu.freeBlocks = req.body.evFreeBlocks;
	var date1 = new Date();
	var date2 = new Date();
	date2.setMinutes(date2.getMinutes() + 45);

	ssu.freeBlocks = [{start: date1, end: date2}];

	// for each attendee email received, add info

	ssu.save(function (err, saved) {
		if (err) next(err);

		User.findOneAndUpdate({_id: uid}, {$push: {createdSSEvents: saved._id}}, function (err, numAffected) {
			res.send(saved);
		});

	});

});

// delete a SlotSignUp
router.delete('/:ssuId', function (req, res, next) {

	var uid = req.session.user._id;

	SlotSignUp.findOne({_id: req.params.ssuId}, function (err, ssu) {
		User.findOneAndUpdate({_id: uid}, {$pull: {createdSSEvents: ssu._id}}, function (err, numAffected) {
			ssu.remove();
			res.send('slot sign up event deleted!');
		})
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
	var startDate = new Date(req.body.start);
	var endDate = new Date(req.body.end);

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