var express = require('express');
var Event 		= require('../models/Event');
var _			= require('underscore');
var router 		= express.Router();
var async		= require('async');
var UserGroup 	= require('../models/UserGroup');
var User 		= require('../models/User')
var Calendar 		= require('../models/Calendar')

var CAN_VIEW_STRING = 'canView';
var CANNOT_VIEW_STRING = 'cannotView'

router.put('/findConflicts', function (req, res, next) {
	// timeSlots must be sorted on increasing end times
	// events from users sorted on increasing start times
	// compare timeSlots to users' events with merge compare algo
	// var timeSlots = _.sortBy(req.body.timeSlots, 'endTime');
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
			console.log('heresss');
			User.findOne({_id: req.session.user._id}, 'modCalId canView canViewBusy').exec(function (err, user) {
				userEventMap = initializeUserEventMap(allIds);
				console.log('ALL IDS OBTAINED');
				console.log(allIds);
				next(err, allIds, user);
			});	
		}, // THIS IS WEHRE IT BREAKS
		function (allIds, user, next) { // create eventmap
			console.log("mod: " + user.modCalId);
			console.log("canview: " + user.canView);
			var canViewCalIds = _.union(user.modCalId, user.canView);
			console.log('merged: ' + canViewCalIds);
			Calendar.find({_id: {$in: canViewCalIds}}).populate('events').exec(function (err, cals) {
				cals.forEach(function (cal) {
					var eventArray = getEventArrayObject(cal, CAN_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner] = _.union(userEventMap[cal.owner], eventArray);				
				});
				next(err, allIds, user)
			});
		},
		function (allIds, user, next) { // now get busy view events
			var calIds = user.canViewBusy;
			Calendar.find({_id: {$in: calIds}}).populate('events').exec(function (err, cals) {
				cals.forEach(function (cal) {
					var eventArray = getEventArrayObject(cal, CANNOT_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner] = _.union(userEventMap[cal.owner], eventArray);
					
				});
				next();
			});
		},
		function () {
			res.send(userEventMap);
		}
		]);

});

// initialializes the map: {userd1: [evObjects], userId2: [], etc};
var initializeUserEventMap = function (Ids) {
	var toRet = {};
	for (var i = 0; i < Ids.length; i++) {
		toRet[Ids[i]] = [];
	}
	return toRet;
}

//TODO, write  below method, write next function

var getEventArrayObject = function (cal, typeString) {
	var toRet = [];
	cal.events.forEach(function (ev) {
		var evWithRepeats = expandEvent(ev, typeString); // returns an array
		console.log('with repeat: + ' + evWithRepeats);
		toRet = _.union(toRet, evWithRepeats);		
	});
	return toRet;
};

var expandEvent = function (ev, typeString) {
	var toRet = [];
	if (ev.repeats[0] == null) {
		ev.type = typeString; // adds property
		if (typeString == CANNOT_VIEW_STRING) { // hides info if can't view
			ev.name = 'busy';
			ev.description = 'busy';
			ev.location = 'busy';
		}
		toRet.push(ev);
		return toRet;
	} else {
		if (ev.repeats[0].frequency == null) { // go till the end date

		} else {

		}
	}
};


module.exports = router;