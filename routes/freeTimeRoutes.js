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
	console.log(JSON.stringify(req.body));
	var userEventMap = {};

	async.waterfall([

		function (next) {
			UserGroup.getUserIds(req.body.userGroupIds, function (err, ids) {
				next(err, ids);
			});
		},
		function (ids, next) {
			console.log(JSON.stringify(req.body.userEmails));
			User.toIds(req.body.userEmails, function (err, uids) {
				uids = _.pluck(uids, '_id');
				ids = _.union(ids, uids);

				next(err, ids);
			});			
		},
		function (allIds, next) {
			console.log("allIds 0: "+allIds);			
			User.findOne({_id: req.session.user._id}, 'modCalId canView canViewBusy').exec(function (err, user) {
				userEventMap = initializeUserEventMap(allIds);

				next(err, allIds, user);
			});	
		},
		function (allIds, user, next) { // create eventmap
			console.log("allIds 1: "+allIds);
			var canViewCalIds = _.union(user.modCalId, user.canView);

			Calendar.find({_id: {$in: canViewCalIds}}).populate('events')
			.populate('owner')
			.exec(function (err, cals) {
				cals.forEach(function (cal) {
					var eventArray = getEventArrayObject(cal, CAN_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner.email] = _.union(userEventMap[cal.owner], eventArray);
				});
				next(err, allIds, user);
			});
		},
		function (allIds, user, next) { // now get busy view events
			console.log("allIds 2: "+allIds);
			var calIds = user.canViewBusy;
			Calendar.find({_id: {$in: calIds}}).populate('events')
			.populate('owner')
			.exec(function (err, cals) {
				var eventArray = [];
				cals.forEach(function (cal) {
					eventArray = getEventArrayObject(cal, CANNOT_VIEW_STRING);

					// merge new array with old one
					userEventMap[cal.owner.email] = _.union(userEventMap[cal.owner], eventArray);
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
					var evStart	= new Date(events[evP].start);
					var evEnd	= new Date(events[evP].end);
					var tiStart	= new Date(conflictSummary[timeP].timeSlot.start);
					var tiEnd	= new Date(conflictSummary[timeP].timeSlot.end);

					if(evStart < tiEnd) {
						if(evStart > tiStart || evEnd > tiStart) {
							events[evP].emailKey = key;
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

			for(var i = 0; i < conflictSummary.length; i++) {
				conflictSummary[i].freeTimes = setFreeTimes(conflictSummary[i], req.body.slotSize);
			}

			res.send(conflictSummary);
		}
		]);

});

// filters out the calendar ids of the people who aren't associated
// with this free time call
var filterCalIds = function (calendar, idArray) {
	var toRet = [];
	for (var i = 0; i < calendar.length; i++) {
		if (idArray.indexOf(calendar[i].owner) != -1) {
			toRet.push(calendar[i]._id);
		}
	}

	return toRet;
}


var setFreeTimes = function (conflictSummary, slotSize) {
	var freeTimes = [];
	freeTimes.push({start: conflictSummary.timeSlot.start, end: conflictSummary.timeSlot.end});

	for(var i = 0; i < conflictSummary.conflicts.length; i++) {
		var start = new Date(conflictSummary.conflicts[i].start);
		var end = new Date(conflictSummary.conflicts[i].end);

		for (var j = 0; j < freeTimes.length; j++) {
			var ftStart = new Date(freeTimes[j].start);
			var ftEnd = new Date(freeTimes[j].end);

			if(start <= ftStart && end > ftStart && end < ftEnd) {
				freeTimes[j].start = end;
			}
			else if(start > ftStart && start < ftEnd && end >= ftEnd) {
				freeTimes[j].end = start;
			}
			else if(start >= ftStart && end <= ftEnd) {
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
		var endDate = new Date(freeTimes[s].end);
		var startDate = new Date(freeTimes[s].start);

		var difference = endDate.getTime() - startDate.getTime();
		var minutes = Math.round(difference / 60000);

		if(minutes >= slotSize) {
			freeTimesRet.push(freeTimes[s]);
		}
	}

	return freeTimesRet;
}

// initializes the conflictSummary array
var initializeConflictSummary = function (times, recurrence) {
	var timeSlots = [];

	for(var t = 0; t < times.length; t++) {
		var tiStart = times[t].startTime;
		var tiEnd	= times[t].endTime;

		var obj = {toPluck: {timeSlot: {start: tiStart, end: tiEnd}, conflicts: [], freeTimes: []}, endTemp: tiEnd};
		timeSlots.push(obj);

		for(var r = 1; r < recurrence; r++) {
			tiStart.setDate(tiStart.getDate() + 7);
			tiEnd.setDate(tiEnd.getDate() + 7);

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
		var modifiedEv = expandEvent(ev, typeString); // returns an array
		toRet = _.union(toRet, modifiedEv);		
	});
	return toRet;
};

var expandEvent = function (ev, typeString) {
	var toRet = [];
	ev.type = typeString; // adds property
	if (typeString == CANNOT_VIEW_STRING) { // hides info if can't view
		ev.name = 'busy';
		ev.description = 'busy';
		ev.location = 'busy';
	}
	toRet.push(ev);
	return toRet;
};

module.exports = router;