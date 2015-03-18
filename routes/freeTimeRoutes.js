var express = require('express');
var Event 		= require('../models/Event');
var _			= require('underscore');
var router 		= express.Router();

router.post('/findConflicts', function (req, res, next) {
	// timeSlots must be sorted on increasing end times
	// events from users sorted on increasing start times
	// compare timeSlots to users' events with merge compare algo
	var timeSlots = _.sortBy(req.body.timeSlots, 'endTime');

	

});

module.exports = router;