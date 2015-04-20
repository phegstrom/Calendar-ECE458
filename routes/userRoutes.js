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