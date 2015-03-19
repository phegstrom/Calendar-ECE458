var express = require('express');
var Event 		= require('../models/Event');
var _			= require('underscore');
var router 		= express.Router();
var async		= require('async');
var UserGroup 	= require('../models/UserGroup');
var User 		= require('../models/User')

router.post('/findConflicts', function (req, res, next) {
	// timeSlots must be sorted on increasing end times
	// events from users sorted on increasing start times
	// compare timeSlots to users' events with merge compare algo
	var timeSlots = _.sortBy(req.body.timeSlots, 'endTime');
	var userEventMap = {};

	async.waterfall([

		function (next) {
			UserGroup.getUserIds(req.body.userGroupIds, function (err, ids) {
				next(err, ids);
			});
		},
		function (ids, next) {
			User.toIds(req.body.userEmails, function (err, uids) {
				ids = _.union(ids, uids);
				next(err, ids);
			});			
		},
		function (allIds, next) {
			User.findOne({_id: req.session.user._id}, 'modCalId canView canViewBusy').exec(function (err, user) {
				next(err, allIds, user);
			});	
		},
		function (allIds, user, next) {
			var canViews = _.union(user.modCalId, user.canView);
			Calendar.find({_id: {$in: canViews}}).populate('events').exec(function (err, cals) {
				cals.forEach(function (cal) {
					var ev = getEventArrayObject('canView');

					if (_.indexOf(allIds, cal.owner) != -1) {
						if (!userEventMap[cal.owner]) {					
							userEventMap[cal.owner] = [ev];
						} else {
							userEventMap[cal.owner].push(ev);
						}
					}

				});
			});
		}

		]);

});

//TODO, write  below method, write next function

var getEventArrayObject = function (type) {

};



module.exports = router;