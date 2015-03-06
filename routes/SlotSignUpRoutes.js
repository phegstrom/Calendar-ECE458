var express = require('express');
var User = require('../models/User');
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
	// var uid = "54ecb2cfb2c037650e91f53b";

	var ssu = new SlotSignUp();

	ssu.creator = req.body.evCreator;
	ssu.name = req.body.evName;
	ssu.description = req.body.evDescription;
	ssu.minDuration = req.body.evMinDuration;
	ssu.maxDuration = req.body.evMaxDuration;

	// ssu.freeBlocks = req.body.evFreeBlocks;
	ssu.freeBlocks = [{start: new Date(), end: new Date()}];

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
	// var uid = "54ecb2cfb2c037650e91f53b";

	SlotSignUp.findOne({_id: req.params.ssuId}, function (err, ssu) {
		User.findOneAndUpdate({_id: uid}, {$pull: {createdSSEvents: ssu._id}}, function (err, numAffected) {
			ssu.remove();
			res.send('slot sign up event deleted!');
		})
	});

});




module.exports = router;