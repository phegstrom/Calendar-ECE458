var express 	= require('express');
var mongoose 	= require('mongoose');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Alert');
var Repeat		= require('../models/Repeat');
var Request		= require('../models/Request');
var PUD			= require('../models/PUD');
var RepeatChain = require('../models/RepeatChain');
var _			= require('underscore');
var router 		= express.Router();

router.post('/test/test/test/', function (req, res, next) {
	// original event
	var constructorObj = createConstructorObj(req);

	var newEvent = createEvent(constructorObj);

	var repeatEventArray = [];

	if(req.body.alerts != undefined)
		newEvent.alerts = createAlertSchemas(req.body.alerts, newEvent, req);
	
	if (req.body.repeats) {
		var repeatDateArray = RepeatChain.getRepeatDates(req.body.repeats[0]);
		var repeatedEventConstructors = RepeatChain.createEventConstructors(constructorObj, repeatDateArray);

		// create repeated events with constructors
		for (var i = 0; i < repeatedEventConstructors.length; i++) {
			var repeatEvent = createEvent(repeatedEventConstructors[i]);
			repeatEventArray.push(repeatEvent);
		}
		// create RepeatChain

		var repeatChain = new RepeatChain(repeatEventArray);
		// add RepeatChain to newEvent
		newEvent.repeatChain = repeatChain;
	}

	newEvent.save(function(err, ev) {
		if(err) next(err);
		// add event to calendar
		Calendar.update({_id: req.body.calendar}, {$push: {events: newEvent._id}}, function(err, num, raw) {
			if(err) next(err);
		});

		// save each event from RepeatChain
		for (var i = 0; i < repeatEventArray.length; i++) {
			repeatEventArray[i].save(function (err, repEv) {
				Calendar.update({_id: req.body.calendar}, {$push: {events: repEv._id}}, function (err, num, raw) {
					if(err) next(err);
				});
			});
		}

		res.send(ev);
	});
});

// post new Event
router.post('/', function(req, res, next) {
	var newEvent = new Event();

	newEvent.name = req.body.name;
	newEvent.description = req.body.description;
	newEvent.location = req.body.location;
	newEvent.start  = req.body.start;
	newEvent.end = req.body.end;
	newEvent.calendar = req.body.calendar;

	var constructorObj = createConstructorObj(req);

	if(req.body.alerts != undefined)
		newEvent.alerts = createAlertSchemas(req.body.alerts, newEvent, req);

	newEvent.repeats = req.body.repeats;

	if (req.body.evType) {
		newEvent.evType = req.body.evType;
		constructorObj.evType = req.body.evType;
	}
	else {
		newEvent.evType = 'regular';
		constructorObj.evType = 'regular';
	}

	if (req.body.repeats) {
		var repeatArray = RepeatChain.getRepeatDates(req.body.repeats[0]);
		var repeatedEventConstructors = RepeatChain.createEventConstructors(constructorObj, repeatArray);
		console.log('REPEAT ARRAY \n' + repeatArray);
	}

	console.log("event created!");

	newEvent.creator = req.session.user._id;

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

function createEvent(constructor) {
	var newEvent = new Event(constructor);

	var newRequest = new Request();
	newRequest.usersStatus = {};
	newRequest.eventID = newEvent._id;
	newRequest.creator = req.session.user.email;
	newEvent.requestID = newRequest._id;
	newEvent.save();
}

// creates json obj to pass into event constructor
function createConstructorObj(req) {
	var toRet = {
					name: req.body.name,
					description: req.body.description,
					location: req.body.location,
					start: req.body.start,
					end:req.body.end,
					calendar: req.body.calendar,
					repeats: req.body.repeats,	
					creator: req.session.user._id
				};
	
	if (req.body.evType) {
		toRet.evType = req.body.evType;
	}
	else {
		toRet.evType = 'regular';
	}

	return toRet;				
};

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

	res.send("Delete complete");
});

module.exports = router;