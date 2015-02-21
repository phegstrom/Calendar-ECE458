var express 	= require('express');
var mongoose 	= require('mongoose');
var User		= require('../models/User');
var Event 		= require('../models/Event');
var Calendar	= require('../models/Calendar');
var Alert		= require('../models/Alert');
var Repeat		= require('../models/Repeat');
var Request		= require('../models/Request');
var router 		= express.Router();

// route that adds users to Request object
router.put('/addUsers/:eventId', function (req, res, next) {

	var evPromise = Event.findOne({_id: req.params.eventId}).exec();

	var count;
	evPromise.addBack(function (err, myEv) {
		console.log("!!!!!"+myEv);
		Request.findOne({_id: myEv.requestID}, function (err, request) {
			var tempStatus = request.usersStatus;
			request.info = req.body.info;
			if(request.usersStatus == undefined)
				tempStatus = {};

			request.usersStatus = null; // must do this 

			var p2 = User.find({email: {$in: req.body.users}}, '_id email').exec();

			p2.addBack(function (err, users) {
				users.forEach(function (user) {

					request.userIDs.push(user._id);
					tempStatus[user._id] = {status: 'pending', calId: null, email: user.email, copyEventId: null};

					User.update({_id: user._id}, {$push: {eventRequests: request._id}}, function (err, num, raw) {

					});
				});

				request.usersStatus = tempStatus;

				request.save(function (err, saved) {
					User.update({_id: req.session.user._id}, {$push: {createdRequests: request._id}}, function (err, num, raw) {});
					res.send(saved);
				});				
			});
		});
	});
});

// route for when user accepts
router.put('/accept/:requestId', function (req, res, next) {

	Request.findOne({_id: req.params.requestId}, function (err, request) {

		// find calendar and create new copy of event
		// need calendarId of where event should go in req.body
		Calendar.findOne({_id: req.body.calendarId}, function (err, cal) {
			var copyId = request.usersStatus[req.session.user._id].copyEventId;
			var evIdArray = [request.eventID];

			if (copyId != null) // user already has a copied event
				evIdArray.push(copyId);

			Event.find({_id: {$in: evIdArray}}, function (err, currEvent) {
				
				var copyEvent = new Event();

				if (currEvent.length == 2) 
					copyEvent = currEvent[1];			

				copyEvent.name = currEvent[0].name;
				copyEvent.evType = currEvent[0].evType;
				copyEvent.description = currEvent[0].description;
				copyEvent.location = currEvent[0].location;
				copyEvent.start = currEvent[0].start;
				copyEvent.end = currEvent[0].end;
				copyEvent.ownerID = currEvent[0].ownerID;
				copyEvent.parentID = currEvent[0]._id;

				// do we need to copy alerts?
				copyEvent.alerts = currEvent[0].alerts;
				copyEvent.repeats = currEvent[0].repeats;
				copyEvent.creator = currEvent[0].creator;

				console.log("copyEvent:    " + copyEvent);
				copyEvent.save(function (err) {
					// go into request object and edit usersStatus
					// usersStatus needs to hold 'accept' in status, copyeventID, calendar, and email

					var tempStatus = request.usersStatus;
					request.usersStatus = null;
					tempStatus[req.session.user._id] = {status: "accepted", calId: cal._id, copyEventId: copyEvent._id};
					// tempStatus["54e2de1d9e41c46cfe113125"] = {status: "accepted", calId: cal._id, copyEventId: copyEvent._id};

					request.usersStatus = tempStatus;
					request.save();

					res.send("SUCCESS");
				});
			});		
		});
	});
});

// route for when user denies event invite
router.put('/deny/:requestId', function (req, res, next) {
	// change usersStatus to 'deny'
	Request.findOne({_id: req.params.requestId}, function (err, request) {
		var tempStatus = request.usersStatus;
		request.usersStatus = null;
		tempStatus[req.session.user._id] = {status: "denied"};
		request.usersStatus = tempStatus;
		request.save();
	});
});

// route for when user removes
router.put('/remove/:requestId', function (req, res, next) {
	// change usersStatus to 'remove'
	Request.findOne({_id: req.params.requestId}, function (err, request) {
		var tempStatus = request.usersStatus;
		request.usersStatus = null;
		tempStatus[req.session.user._id] = {status: "removed"};
		request.usersStatus = tempStatus;
		request.save();
	});
});

// route for when a shared-to user submits an edit to be approved
router.put('/edit/:eventId', function (req, res, next) {
	var prom = Event.findOne({_id: req.params.eventId}).exec();
	// for POSTman
	req.body['editor'] = 'parker.hegstrom@gmail.com';
	//req.body['editor'] = req.session.user.email; // adds editor email to edit body
	prom.addBack(function (err, event) {
		Request.update({_id: event.requestID}, {$push: {edits: req.body}}, function (err, num, raw) {
			if (err) next(err);
			res.send('Edit sent');
		});
	});

});

// route for when user denies a suggested edit
router.put('/denyEdit/:requestId', function (req, res, next) {
	var index = req.body.editNum;
	Request.findOne({_id: req.params.requestId}, function (err, myReq) {
		myReq.edits.splice(index, 1);
		myReq.save(function (err, saved) {
			res.send('Edit denied');
		});
	});	
});


// route for when creator user approves an edit
router.put('/approveEdit/:requestId', function (req, res, next) {
	var index = req.body.editNum;
	// var index = 1;

	Request.findOne({_id: req.params.requestId}, function (err, myReq) {
		if (err) next(err);

		Event.findOne({_id: myReq.eventID}, function (err, ev) {
			if (err) next(err);
			console.log("EVENT IS NULL: "+(ev==undefined));
			//console.log(ev);
			console.log("EVENT CHANGED TO");
			ev.name = myReq.edits[index].name;
		 	ev.description = myReq.edits[index].description;
		 	ev.location = myReq.edits[index].location;
		 	//these freak out with POSTman
		 	ev.start = myReq.edits[index].start;
		 	ev.end = myReq.edits[index].end;
		 	ev.repeats = myReq.edits[index].repeats;

		 	ev.save(function (err, savedEv) {
		 		if (err) next(err);

		 		console.log("SAVED EVENT");
		 		console.log(savedEv);

		 		var obj = myReq.edits;

		 		myReq.edits.splice(index, 1);

		 		myReq.changeUsersStatus('pending', function (updatedReq) {
		 			console.log("UPDATED REQUEST");
		 			console.log(updatedReq);
		 			res.send("approved the edit!");
		 		});

		 	});

		});	
	});

});

router.get('/getCreated', function (req, res, next) {
	User.findOne({_id: req.session.user._id})
		.deepPopulate("createdRequests.eventID").exec(function (err, user) {
			res.send(user.createdRequests);
		});
});


router.get('/getIncoming', function (req, res, next) {
	User.findOne({_id: req.session.user._id})
	// User.findOne({_id: "54e2de1d9e41c46cfe113125"})
		.deepPopulate("eventRequests.eventID").exec(function (err, user) {
			res.send(user.eventRequests);
		});
});

router.get('/getAll', function (req, res, next) {
	Request.find().exec(function (err, reqs) {
		res.send(reqs);
	});
});

module.exports = router