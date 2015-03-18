var express = require('express');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');
var Event 		= require('../models/Event');
var Alert		= require('../models/Alert');
var router 		= express.Router();

router.post('/findConflicts', function (req, res, next) {
	// timeSlots must be sorted on increasing end times
	// events from users sorted on increasing start times
	// compare timeSlots to users' events with merge compare algo
	
});

module.exports = router;