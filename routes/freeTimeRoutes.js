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
	var conflicts = [];
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
			// console.log('heresss');
			User.findOne({_id: req.session.user._id}, 'modCalId canView canViewBusy').exec(function (err, user) {
				userEventMap = initializeUserEventMap(allIds);
				console.log('ALL IDS OBTAINED');
				console.log(allIds);
				next(err, allIds, user);
			});	
		}, // THIS IS WEHRE IT BREAKS
		function (allIds, user, next) { // create eventmap
			// console.log("mod: " + user.modCalId);
			// console.log("canview: " + user.canView);
			var canViewCalIds = _.union(user.modCalId, user.canView);
			// console.log('merged: ' + canViewCalIds);
			Calendar.find({_id: {$in: canViewCalIds}}).populate('events').exec(function (err, cals) {
				cals.forEach(function (cal) {
					var eventArray = getEventArrayObject(cal, CAN_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner] = _.union(userEventMap[cal.owner], eventArray);
				});
				next(err, allIds, user);
			});
		},
		function (allIds, user, next) { // now get busy view events
			var calIds = user.canViewBusy;
			Calendar.find({_id: {$in: calIds}}).populate('events').exec(function (err, cals) {
				var eventArray = [];
				cals.forEach(function (cal) {
					eventArray = getEventArrayObject(cal, CANNOT_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner] = _.union(userEventMap[cal.owner], eventArray);
				});
				next(err, eventArray);
			});
		},
		function (allEvents) {
			var keys = _.allKeys(allEvents);
			console.log("allEvents: " + allEvents);

			keys.forEach(function (key) {
				var events = allEvents[key];
				var bool = true, timeP = 0, evP = 0;
				while(bool) {
					if(events[evP].start < timeSlots[timeP].end) {
						if(events[evP].start > timeSlots[timeP].start || events[evP].end > timeSlots[timeP].start) {
							conflicts.push(events[evP]);
						}

						evP++;
					} else {
						timeP++;
					}

					if(timeP >= timeSlots.length || evP >= events.length) {
						bool = false;
					}
				}
			});
			next();
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
		// console.log('with repeat: + ' + evWithRepeats);
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

router.post('/test/test', function (req, res, next) {
	var allEvents = req.body.allEvents;
	var conflicts = [];

	var test = "2015-03-23T06:04:16-04:00";
	var dateTest = new Date(test);
	console.log("dateTest: " + dateTest);

	var timeSlots = [{start: "1", end: "3"}, {start: "5", end: "6"}, {start: "8", end: "10"}];

	var keys = _.allKeys(allEvents);

	keys.forEach(function (key) {
		var events = allEvents[key];
		var bool = 1, timeP = 0, evP = 0;
		while(bool) {
			if(events[evP].start < timeSlots[timeP].end) {
				if(events[evP].start > timeSlots[timeP].start || events[evP].end > timeSlots[timeP].start) {
					conflicts.push(events[evP]);
				}

				evP++;
			} else {
				timeP++;
			}

			if(timeP >= timeSlots.length || evP >= events.length) {
				bool = 0;
			}
		}
	});

	// res.send(req.body.allEvents[keys[0]]);
	res.send(conflicts);
});

module.exports = router;