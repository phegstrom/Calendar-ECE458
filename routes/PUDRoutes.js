var express = require('express');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');
var router 		= express.Router();

router.get('/', function (req, res, next) {
	User.findOne({_id: req.session.user._id})
		.populate('PUDs')
		.exec(function (err, user) {
			if(err) next(err);

			res.send(user.PUDs);
		});
});



module.exports = router;