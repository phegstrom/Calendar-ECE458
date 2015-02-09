var express = require('express');
var User 		= require('../models/User');
var router 		= express.Router();

router.get('/:email', function (req, res, next) {
	User.findOne({email: req.params.email}, function (err, user) {
		res.send(user._id);
	});
});

router.get('/populate/cal', function (req, res, next) {

	// User.deepPopulate(posts, 'myCalId.events', function(err) {
	// 	posts.forEach(function(post) {
	// 		console.log(post);
	// 	});
	// 	res.send("hello");
	// });

	User.find({}).deepPopulate('myCalId.events').exec(function (err, users) {
		users.forEach(function(user) {
			console.log(user);
		});
		res.send(users);
	});
});

module.exports = router;