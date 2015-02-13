var express 	= require('express');
var mongoose 	= require('mongoose');
var User		= require('../models/User')l
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Alert');
var Repeat		= require('../models/Repeat');
var Request		= require('../models/Request');
var router 		= express.Router();

// route that adds users to Request object
router.put('/addUsers/:requestId', function (req, res, next) {
	Request.findOne({_id: req.params.requestId}, function (err, request) {
		if(req.body.info != undefined) {
			request.info = req.body.info;
		}

		// assuming users are given as userIDs
		// also assuming users haven't been added to request yet
		for each (var user in req.body.users) {
			request.userIDs.push(user);
			request.usersStatus.push({uid: user, status: 'pending'});
		}

		request.save();
	});
});

// route for when user accepts
router.put('/accept/:requestId', function (req, res, next) {
	var eventId = req.body.eventId;

	Request.findOne({_id: req.params.requestId}, function (err, request) {

		request.usersStatus[req.session.user._id]
		user.userGroups.splice(index, 1);

		// find user and create new copy of event
		for each (var userId in request.userIDs) {

		}
	});
});

// route for when user denies
router.put('/deny/:requestId', function (req, res, next) {

});

// route for when user removes

router.put('/', function (req, res, next) {

});

module.exports = router;