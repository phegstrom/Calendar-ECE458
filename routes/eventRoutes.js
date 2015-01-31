var express = require('express');
var mongoose = require('mongoose');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Calendar');
var Repeat		= require('../models/Calendar');
var router 		= express.Router();

router.post('/', function(req, res, next) {
	var newEvent = new Event();

	newEvent.name = req.body.name;
	newEvent.description = req.body.description;
	newEvent.location = req.body.location;
	newEvent.start = req.body.start;
	newEvent.end = req.body.end;
	newEvent.calendar = req.body.calendar;

	// add event to calendar
	Calendar.findOne({_id: req.body.calendar})
			.exec(function(err, cal) {
				cal.events.push(newEvent._id);
			});

	newEvent.alerts = req.body.alerts;
	newEvent.repeats = req.body.repeats;
	newEvent.creator = req.body.creator;

	newEvent.save(function(err) {
		if(err) {
			next(err);
		}

		res.redirect('/');
	});	
});

router.put('/:eventId', function(req, res, next) {
	//get event from req.body
	Event.findOne({_id: req.params.eventId})
		 .exec(function(err, ev) {
		 	ev.name = req.body.name;
		 	ev.description = req.body.description;
		 	ev.location = req.body.location;
		 	ev.start = req.body.start;
		 	ev.end = req.body.end;
		 	ev.calendar = req.body.calendar;
		 	ev.alerts = req.body.alerts;
		 	ev.repeats = req.body.repeats;
		 	ev.creator = req.body.creator;

		 	var delAlertArr = ev.alerts.filter(function(val) {
		 		return req.body.alerts.indexOf(val) == -1;
		 	});

		 	var delRepeatArr = ev.repeats.filter(function(val) {
		 		return req.body.repeats.indexOf(val) == -1;
		 	});

		 	for(var i = 0; i < delAlertArr.length; i++) {
		 		Alert.findByIdAndRemove(delAlertArr[i]);
		 	}

		 	for(var j = 0; j < delRepeatArr.length; j++) {
		 		Alert.findByIdAndRemove(delAlertArr[i]);
		 	}

		 	res.redirect('/');

		 });
});

router.delete('/:eventId', function(req, res, next) {
// delete the event, the event from the calendar, and the alerts and repeats
	Event.findOne({_id: req.params.eventId})
		 .exec(function (err, ev) {
		 	//remove event from calendar
		 	Calendar.findOne({_id: ev.calendar._id})
		 			.exec(function(err, cal) {
		 				if(err) {
		 					next(err);
		 				}

		 				var index = cal.events.indexOf(req.params.eventId);
		 				cal.events.splice(index, 1);

		 				cal.save(function(err) {
		 					if(err) {		 						
		 						next(err);
		 					}
		 				});
		 			});

		 	//delete alerts
		 	for(var i = 0; i < ev.alerts.length; i++) {
		 		Alert.findByIdAndRemove(ev.alerts[i]);
		 	}

		 	//delete repeats
		 	for(var j = 0; j < ev.repeats; j++) {
		 		Repeat.findByIdAndRemove(ev.repeats[i]);
		 	}
		 });

	// delete the event
	Event.findByIdAndRemove(req.params.eventId);

	res.redirect('/');
});

module.exports = router;