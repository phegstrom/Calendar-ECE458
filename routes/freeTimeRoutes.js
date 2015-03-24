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
				uids = _.pluck(uids, '_id');
				ids = _.union(ids, uids);

				next(err, ids);
			});			
		},
		function (allIds, next) {
			User.findOne({_id: req.session.user._id}, 'modCalId canView canViewBusy').exec(function (err, user) {
				userEventMap = initializeUserEventMap(allIds);

				next(err, allIds, user);
			});	
		},
		function (allIds, user, next) { // create eventmap
			var canViewCalIds = _.union(user.modCalId, user.canView);

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
				next(err, userEventMap);
			});
		},
		function (allEvents, next) {
			var conflictSummary = initializeConflictSummary(req.body.timeSlot, req.body.recurrence);

			var keys = _.allKeys(allEvents);
			var conflicts = [];

			keys.forEach(function (key) {
				var events = _.sortBy(allEvents[key], 'start');
				var bool = true, timeP = 0, evP = 0;				

				while(bool) {
					var evStart	= events[evP].start;
					var evEnd	= events[evP].end;
					var tiStart	= conflictSummary[timeP].timeSlot.start;
					var tiEnd	= conflictSummary[timeP].timeSlot.end;

					if(evStart < tiEnd) {
						if(evStart > tiStart || evEnd > tiStart) {
							conflictSummary[timeP].conflicts.push(events[evP]);
						}

						evP++;
					} else {
						timeP++;
					}

					if(timeP >= conflictSummary.length || evP >= events.length) {
						bool = false;
					}
				}
			});
		},
		function () {
			for(var i = 0; i < conflictSummary.length; i++) {
				conflictSummary[i].freeTimes = setFreeTimes(conflictSummary[i], req.body.slotSize);
			}
			res.send(conflictSummary);
		},
		]);

});

router.get('/blah/blah/test', function (req, res, next) {
	var conflictSummary = {timeSlot: {start: 1, end: 8}, conflicts: []};
	var con1 = {start: 0, end: 2};
	var con2 = {start: 3, end: 5};
	var con3 = {start: 7, end: 9};
	conflictSummary.conflicts.push(con1);
	conflictSummary.conflicts.push(con2);
	conflictSummary.conflicts.push(con3);

	var freeTimes = setFreeTimes(conflictSummary, 2);
	res.send(freeTimes);
});

var setFreeTimes = function (conflictSummary, slotSize) {
	var freeTimes = [];
	freeTimes.push({start: conflictSummary.timeSlot.start, end: conflictSummary.timeSlot.end});

	for(var i = 0; i < conflictSummary.conflicts.length; i++) {
		var start = conflictSummary.conflicts[i].start;
		var end = conflictSummary.conflicts[i].end;

		for (var j = 0; j < freeTimes.length; j++) {

			if(start <= freeTimes[j].start && end > freeTimes[j].start && end < freeTimes[j].end) {
				freeTimes[j].start = end;
			}
			else if(start > freeTimes[j].start && start < freeTimes[j].end && end >= freeTimes[j].end) {
				freeTimes[j].end = start;
			}
			else if(start >= freeTimes[j].start && end <= freeTimes[j].end) {
				var toAdd = {start: freeTimes[j].start, end: freeTimes[j].end};
				freeTimes[j].start = end;
				toAdd.end = start;
				freeTimes.splice(j, 0, toAdd);
				j++;
			}
		}
	}

	var freeTimesRet = [];

	for(var s = 0; s < freeTimes.length; s++) {
		var difference = freeTimes[s].end.getTime() - freeTimes[s].start.getTime();
		var minutes = Math.round(difference / 60000);

		if(minutes >= slotSize) {
			freeTimesRet.push(freeTimes[s]);
		}
	}

	return freeTimesRet;
}

// initializes the conflictSummary array
var initializeConflictSummary = function (times, recurrence) {
	var initialized = [];

	var timeSlots = [];

	for(var t = 0; t < times.length; t++) {
		timeSlots.push(times[t]);

		var tiStart = times[t].start;
		var tiEnd	= times[t].end;

		for(var r = 1; r < recurrence; r++) {
			tiStart.setDate(tiStart.getDate() + 7);
			tiEnd.setDate(tiEnd.getDate() + 7);

			// var obj = {timeSlot: {start: tiStart, end: tiEnd}, conflicts: [], endTemp: tiEnd};
			var obj = {toPluck: {timeSlot: {start: tiStart, end: tiEnd}, conflicts: [], freeTimes: []}, endTemp: tiEnd};
			timeSlots.push(obj);
		}
	}

	var sorted = _.sortBy(timeSlots, 'endTemp');
	var initialized = _.pluck(sorted, 'toPluck');

	return initialized;
}

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