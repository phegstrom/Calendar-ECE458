var express 	= require('express');
var mongoose 	= require('mongoose');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Alert');
var Repeat		= require('../models/Repeat');
var Request		= require('../models/Request');
var router 		= express.Router();

// post new Event
router.post('/', function(req, res, next) {
	var newEvent = new Event();

	console.log("TEST REQ BODY");
	console.log(req.body);

	newEvent.name = req.body.name;
	newEvent.description = req.body.description;
	newEvent.location = req.body.location;
	newEvent.start = req.body.start;
	newEvent.end = req.body.end;
	newEvent.calendar = req.body.calendar;

	if(req.body.alerts != undefined)
		newEvent.alerts = createAlertSchemas(req.body.alerts, newEvent, req);
	newEvent.repeats = req.body.repeats;

	console.log("EVENT CREATED");
	console.log(newEvent);

	newEvent.creator = req.session.user._id;
	//for use with POSTman
	//newEvent.creator = req.body.creator;

	var newRequest = new Request();
	// newRequest.info = newEvent.description;
	newRequest.usersStatus = {};
	newRequest.eventID = newEvent._id;
	newRequest.creator = req.session.user.email;
	newEvent.requestID = newRequest._id;

	newEvent.save(function(err, ev) {
		if(err) next(err);
		// add event to calendar
		Calendar.update({_id: req.body.calendar}, {$push: {events: newEvent._id}}, function(err, num, raw) {
			if(err) next(err);
		});

		newRequest.save();

		res.send(ev);
	});
});

// creates individual
function createAlertSchemas(objArray, ev, req) {
	var toRet = [];
	var userId = req.session.user._id;
	// for postman
	//var userId = "54d06afb55d013111eea5759";
	var count = objArray.length;
	console.log("CREATING ALERT ARRAY");
	console.log(objArray);

	if (objArray == null) return toRet;
	
	for (var i = 0; i < objArray.length; i++) {
		var alertObj = new Alert({time: objArray[0].time, 
							   method: objArray[0].method, 
							   owner: userId,
								myEvent: ev._id});

		toRet.push(alertObj._id);
		alertObj.save(function (err, obj) {
			if (err) next(err);
		});
	}

 	return toRet;
}

// edit Event
router.put('/:eventId', function(req, res, next) {
	//get event from req.body

	// check if there's a request assc with this event
	// check if the logged in user is the creator of the event
	// if both true, call request schema method

	console.log(req.body);
	Event.findOne({_id: req.params.eventId}, function(err, ev) {
	 	ev.name = req.body.name;
	 	ev.description = req.body.description;
	 	ev.location = req.body.location;
	 	ev.start = req.body.start;
	 	ev.end = req.body.end;
	 	ev.calendar = req.body.calendar;

 		if(req.body.alerts == undefined)
 			ev.alerts = new Alert();
 		else
		 	ev.alerts = createAlertSchemas(req.body.alerts, ev, req);
	 	ev.repeats = req.body.repeats;

	 	ev.creator = req.session.user._id;
	 	//ev.creator = req.body.creator;

	 	ev.save();

	 	res.send(ev);
	});
});

// delete the event, the event from the calendar, and the alerts and repeats
router.delete('/:eventId', function(req, res, next) {
	Event.findOne({_id: req.params.eventId}, function(err, ev) {
		Calendar.update({_id: ev.calendar}, {$pull: {events: ev._id}}, function(err, num, raw) {

		});

		for (var i = 0; i < ev.alerts.length; i++) {
			Alert.findByIdAndRemove({_id: ev.alerts[i]}, function(err) {
			});
		}

		Event.findByIdAndRemove({_id: mongoose.Types.ObjectId(req.params.eventId)}, function(err) {
			if(err)
				next(err);
		});

		Request.findByIdAndRemove({_id: mongoose.Types.ObjectId(ev.requestID)}, function (err) {
			if (err) next(err);
		});

	});

	// Event.findByIdAndRemove({_id: req.params.eventId});

	res.send("HELLO");
});

module.exports = router;