var express 	= require('express');
var mongoose 	= require('mongoose');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Alert');
var Repeat		= require('../models/Repeat');
var Request		= require('../models/Request');
var PUD			= require('../models/PUD');
var router 		= express.Router();

// post new Event
router.post('/', function(req, res, next) {
	var newEvent = new Event();

	newEvent.name = req.body.name;
	newEvent.description = req.body.description;
	newEvent.location = req.body.location;
	newEvent.start = req.body.start;
	newEvent.end = req.body.end;
	newEvent.calendar = req.body.calendar;
	console.log("repeat 1: \n" + req.body.repeats);

	if(req.body.alerts != undefined)
		newEvent.alerts = createAlertSchemas(req.body.alerts, newEvent, req);

	console.log("repeat: \n" + req.body.repeats);
	newEvent.repeats = req.body.repeats;
	console.log("repeat from event: \n" + newEvent.repeats);

	if (req.body.evType) 
		newEvent.evType = req.body.evType;
	else 
		newEvent.evType = 'regular';

	console.log(req.body);

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
	var uEmail = req.session.user.email;
	// for postman
	//var userId = "54d06afb55d013111eea5759";
	var count = objArray.length;
	console.log("CREATING ALERT ARRAY");
	console.log(objArray);

	if (objArray == null) return toRet;
	
	for (var i = 0; i < objArray.length; i++) {
		var alertObj = new Alert({time: objArray[0].time, 
							   method: objArray[0].method,
							   ownerEmail: uEmail, 
							   owner: userId,
								myEvent: ev._id});

		toRet.push(alertObj._id);
		alertObj.save(function (err, obj) {
			if (err) next(err);
		});
	}

 	return toRet;
}

router.get('/pud/:eventId', function (req, res, next) {

	var pid = req.params.eventId;
	console.log("BEFORE");

	console.log(req.count);

	Event.findOne({_id: pid}).exec(function (err, ev) {
		if (err) next(err);

		ev.getPUD(function (pud) {

			var nullString = "Not sufficient amount of time to complete any of your tasks";
			//console.log(pud.description);

			if (pud != null) {
				var toRet = {pudId: "", display: ""};
				var time = pud.time;
				// var pudString = 'PUD: ' + pud.description + ' ('+time+' hours)';
				toRet.display = pud.description + ' ('+time+' hours)';
				toRet.pudId = pud._id;
				res.send(toRet);
			}
			else {
				res.send({display: nullString});
			}

		});

	});

});

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

	 	if (req.body.evType == undefined) 
			ev.evType = 'regular';
		else 
			ev.evType = req.body.evType;

 		if(req.body.alerts == undefined)
 			ev.alerts = new Alert();
 		else
		 	ev.alerts = createAlertSchemas(req.body.alerts, ev, req);
	 	ev.repeats = req.body.repeats;

	 	if(ev.creator == req.session.user._id) {
	 		Request.findOne({_id: ev.requestID}, function (err, request) {
	 			request.changeUsersStatus('pending', function (updatedReq) {
	 				console.log(updatedReq);
	 			});
	 		});
	 	}

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

	res.send("HELLO");
});

module.exports = router;