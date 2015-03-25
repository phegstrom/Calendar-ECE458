var express = require('express');
var User 		= require('../models/User');
var router 		= express.Router();
var async = require('async');
var _ = require('underscore');


router.get('/', function (req, res, next) {
	console.log("typeof");
	User.findOne({_id: req.session.user._id}, function (err, user) {
		console.log(typeof user._id);
		res.send(req.session.user._id);
	});
	
});

router.get('/test', function (req, res, next) {
	console.log("testing waterfall...");
	var a = [2,3,4];
	var b = [1,2,3];

	var d1 = new Date();
	var d2 = new Date();
	d2.setMinutes(d2.getMinutes() + 10);
	// d2 += 2;

	var arr = [{start: d2.toString()}, {start: d1.toString()}];
	console.log((d1 - d2));
	res.send(_.sortBy(arr, 'start'));

	console.log(_.union([],b));
	// User.find({_id: req.session.user._id}, 'email', function (err, email) {
	// 	res.send(email);
	// });
	// async.waterfall([
	// 	function (next) {
	// 		User.findOne({_id: req.session.user._id}, function (err, u) {
	// 			next(err, u);	
	// 		});
	// 	},
	// 	function (firstResult, next) {
	// 		PUD.findOne({_id: firstResult.PUDs[0]}, next);
	// 	},
	// 	function (result) {
	// 		res.send(result.myDate);
	// 	}]);

});

router.get('/:userId', function (req, res, next) {
	res.send(req.session.user._id);
});

router.get('/email/:userId', function (req, res, next) {
	User.findOne({_id: req.params.userId}, function (err, user) {
		res.send(user.email);
	})
});

router.get('/:email', function (req, res, next) {
	User.findOne({email: req.params.email}, function (err, user) {
		res.send(user._id);
	});
});



module.exports = router;