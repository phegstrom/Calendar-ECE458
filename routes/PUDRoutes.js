var express = require('express');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');
var router 		= express.Router();

router.put('/createPUD', function (req, res, next) {
	var newPUD = new PUD();

	newPUD.description = req.body.description;
	newPUD.time = req.body.time;

	newPUD.save();
});

router.get('/', function (req, res, next) {
	User.findOne({_id: req.session.user._id})
		.populate('PUDs')
		.exec(function (err, user) {
			if(err) next(err);

			res.send(user.PUDs);
		});
});



module.exports = router;