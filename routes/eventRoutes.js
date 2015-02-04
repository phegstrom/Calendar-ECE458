var express 	= require('express');
var mongoose 	= require('mongoose');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Calendar');
var Repeat		= require('../models/Calendar');
var router 		= express.Router();

// post new Event
router.post('/', function(req, res, next) {
	var newEvent = new Event();

	//console.log(req.body);

	newEvent.name = req.body.name;
	newEvent.description = req.body.description;
	newEvent.location = req.body.location;
	newEvent.start = req.body.start;
	newEvent.end = req.body.end;
	newEvent.calendar = req.body.calendar;
	newEvent.alerts = createAlertSchemas(req.body.alerts);
	newEvent.repeats = req.body.repeats;


	console.log(newEvent);

	newEvent.creator = req.session.user._id;
	//for use with POSTman
	//newEvent.creator = req.body.creator;

	newEvent.save(function(err) {
		if(err) next(err);
		// add event to calendar
		Calendar.update({_id: req.body.calendar}, {$push: {events: newEvent._id}}, function(err, num, raw) {
			if(err) next(err);
		});

		res.send("Event Created");
	});
});

// creates individual
function createAlertSchemas(objArray) {
	var toRet = [];
	if (objArray == null) return toRet;
	
	for (var i = 0; i < objArray.length; i++) {
		var alertObj = new Event({time: objArray[i].time, 
							   method: objArray[i].method, 
							   users: req.session.user._id});
		toRet.push(obj._id);
		alertObj.save(function (err, obj) {	

		});
	}
	console.log(toRet);
	return toRet;
}

// edit Event
router.put('/:eventId', function(req, res, next) {
	//get event from req.body
	Event.findOne({_id: req.params.eventId}, function(err, ev) {
	 	ev.name = req.body.name;
	 	ev.description = req.body.description;
	 	ev.location = req.body.location;
	 	ev.start = req.body.start;
	 	ev.end = req.body.end;
	 	ev.calendar = req.body.calendar;
	 	ev.creator = req.body.creator;

	 	ev.alerts = req.body.alerts;
	 	ev.repeats = req.body.repeats;

	 	ev.save();

	 	res.send("Event Updated");
	});
});

// delete the event, the event from the calendar, and the alerts and repeats
router.delete('/:eventId', function(req, res, next) {
	console.log("DELETE TIME");
	Event.findOne({_id: req.params.eventId}, function(err, ev) {
		Calendar.findOne({_id: ev.calendar}, function(err, cal) {
			console.log(cal);

			var index = cal.events.indexOf(req.params.eventId);
			cal.events.splice(index, 1);

			cal.save();
		});

		Event.findByIdAndRemove({_id: mongoose.Types.ObjectId(req.params.eventId)}, function(err) {
			if(err)
				next(err);
		});

	});

	// Event.findByIdAndRemove({_id: req.params.eventId});

	res.send("HELLO");
});

module.exports = router;