var express 	= require('express');
var mongoose	= require('mongoose');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var Rule 		= require('../models/Rule');
var RuleRoutes	= require('../routes/ruleRoutes');
var router 		= express.Router();

// post new calendar
router.post('/', function(req, res, next) {
	var newCal = new Calendar();
	newCal.name = req.body.name;

	// newCal.owner = req.session.user._id;
	// for PostMan
	newCal.owner = req.body.owner;

	newCal.save(function(err) {
		if(err) {
			next(err);
		}

		// User.update({_id: req.session.user._id}, {$push: {myCalId: newCal._id}}, function(err, num, raw) {
		// for PostMan
		User.update({_id: req.body.owner}, {$push: {myCalId: newCal._id}}, function(err, num, raw) {
			if (err) next(err);
		});

		res.json({ message: 'Calendar created!'});
	});
});

// adding user to calendar modList and calendar to users' modLists
router.put('/modList/add/:calId', function (req, res, next) {
	for(var i = 0; i < req.body.modList.length; i++) {
		Calendar.update({_id: req.params.calId}, {$push: {modList: req.body.modList[i]}}, function(err, num, raw) {
			if (err) next(err);
		});


		User.update({_id: req.body.modList[i]}, {$push: {modCalId: req.params.calId}}, function (err, num, raw) {
			if(err) next(err);
		});
	}

	res.send("Users added to modList");
});

// removes users from calendar modList and calendar from users' modLists
router.put('/modList/remove/:calId', function (req, res, next) {
	Calendar.update({_id: req.params.calId}, {$pull: {modList: req.body.modList}}, function(err, num, raw) {
		if (err) next(err);
	});

	for(var i = 0; i < req.body.modList.length; i++) {
		User.update({_id: req.body.modList[i]}, {$pull: {modCalId: req.params.calId}}, function (err, num, raw) {
			if(err) next(err);
		});
	}

	res.send("Users removed from modList");
});

// get one Calendar based on its calId
router.get('/id/:calendarId', function (req, res, next) {
	// right now, it is returning whatever calendar is requested
	// it is not taking into account which user is trying to access it
	Calendar.findOne({_id: req.params.calendarId})
			.populate('events owner modList')
			.exec(function (err, calendar) {
				if(err) next(err);

				res.send(calendar);
			});

});

// get Calendars based on user's calType
router.get('/:calType', function (req, res, next) {
	console.log('\n\n');

	var uId = req.session.user._id;
	// var uId = "54d071f70226f73624abff24";

	User.findOne({_id: uId})
		.populate(req.params.calType)
		.exec(function (err, user) {
			if (err) {
				next(err);
			}

			var cType = req.params.calType;

			Calendar.find({_id: {$in: user[cType]}})
					.exec(function (err, calendar) {
						if(err) next(err);

						for(var i = 0; i < calendar.length; i++) {
							Event.find({_id: {$in: calendar[i].events}})
								 .populate('name')
								 .exec(function(err, event) {
								 	if(err) next(err);

								 	user[cType].push(calendar);
								 	// res.send(user[cType]);
								 });
						}

						res.send(user[cType]);
					});
		});
});

router.get('/rules/:ruleId', function (req, res, next) {
	var r = Rule.findOne({_id: req.params.ruleId})
		.exec(function (err, rule) {
			// res.send(rule);
			var users = rule.getAllUsersInRule(function(users) {
				console.log("CALENDAR"+users);
				res.send(users);
			});

		});
});

// deletes entire Calendar, its events, its rules, and ref to them in users
router.delete('/:calId', function (req, res, next) {
	Calendar.findOne({_id: req.params.calId}, function (err, calendar) {

		// check if this works later
		// delete events
		for(var i = 0; i < calendar.events.length; i++) {
			Event.findByIdAndRemove(calendar.events[i], {}, function (err, obj) {
				if(err) next(err);
			});
		}

		// rules
		for(var r = 0; r < rules.length; r++) {
			// deleteRuleForUsers(ruleId, calId)
			RuleRoutes.deleteRuleForUsers(rules[r], req.params.calId);
		}

		// Rule.find({_id: {$in: calendar.rules}}, function(err, rules) {
		// 	for(var r = 0; r < rules.length; r++) {
		// 		rules[r].getAllUsersInRule(function(users) {
		// 			for(var i = 0; i < users.length; i++) {

		// 				User.update({_id: users[i]}, {$pull: {modCalId: req.params.calId}}, function(err, num, raw) {
		// 					if(err) next(err);
		// 				});
		// 				User.update({_id: users[i]}, {$pull: {canView: req.params.calId}}, function(err, num, raw) {
		// 					if(err) next(err);
		// 				});
		// 				User.update({_id: users[i]}, {$pull: {canViewBusy: req.params.calId}}, function(err, num, raw) {
		// 					if(err) next(err);
		// 				});
		// 			}
		// 		});


		// 	}
		// });

		// remove calId from users
		User.update({_id: calendar.owner}, {$pull: {myCalId: calendar._id}}, function(err, num, raw) {
			if(err) next(err);
		});

		for(var k = 0; k < calendar.modList.length; k++) {
			User.update({_id: calendar.modList[k]}, {$pull: {modCalId: calendar._id}}, function (err, num, raw) {
				if(err) next(err);
			});
		}

		Calendar.findByIdAndRemove(req.params.calId, function(err, cal) {

		});
	});

	res.send("I hope a calendar just deleted");
});

router.get('/ruleRoutesTest/:str', function (req, res, next) {
	RuleRoutes.testFunction(req.params.str);
	res.send("HELLO WORLD");
});

module.exports = router;