var express 		= require('express');
var Rule 			= require('../models/Rule');
var Calendar	 	= require('../models/Calendar');
var router 			= express.Router();
var User 			= require('../models/User');
var UserGroup 	 	= require('../models/UserGroup');

var CANT_VIEW = 'canNotView';

// route that creates a RULE for a certain calendId
router.post('/:calendId', function (req, res, next) {

	console.log("CREATING RULE");
	console.log("rule type: "+ req.body.ruleType);
	console.log("users: " + req.body.userIds);
	console.log("userGroups: " + req.body.userGroupIds);

	var rule  = new Rule({ruleType: req.body.ruleType,
						  assocUsers: req.body.userIds,
						  assocUserGroups: req.body.userGroupIds});

	rule.save(function (err) {
		if (err) next(err);

		var usersAdded = [];

		Calendar.update({_id: req.params.calendId}, {$push: {rules: rule._id}}, function (err, num, raw) {
			if (err) next(err);
		});

		var userGroupIds = req.body.userGroupIds;
		var uGroupArray = [];

		// add rule stuff for userGroups
		for (var i = 0; i < userGroupIds.length; i++) {
			UserGroup.find({_id: userGroupIds[i]}, function (err, uGroups) {
				if (err) next(err);
				uGroupArray = uGroups.users;
			})

			for (var j = 0; j < uGroupArray.length; j++) {

				var currId = uGroupArray[j]._id;

				if (req.body.ruleType != CANT_VIEW) {

					User.findOne({_id: currId}, function (err, user) {
						if (err) next(err);
						user[req.body.ruleType].push(req.params.calendId);
						user.save(function (err) {
							if (err) next(err);
							usersAdded.push(currId);
						});
					});

				} else {
					usersAdded.push(currId);
					User.update({
							_id: currId
						}, {
							$pull: {
								modCalId: req.params.calendId,
								canView: req.params.calendId,
								canViewBusy: req.params.calendId
							}
						},
						function(err, num, raw) {
							if (err) next(err);
					});
				}
			}
		}

		// now add rule stuff for individual users
		for (var i = 0; i < req.body.userIds.length; i++) {		
			var currId = req.body.userIds[i];

			if (usersAdded.indexOf(currId) != -1) continue;

			if (req.body.ruleType != CANT_VIEW) {

				User.findOne({_id: currId}, function (err, user) {
					if (err) next(err);
					user[req.body.ruleType].push(req.params.calendId);
					user.save(function (err) {
						if (err) next(err);
					});
				});

			} else {
				User.update({
						_id: currId
					}, {
						$pull: {
							modCalId: req.params.calendId,
							canView: req.params.calendId,
							canViewBusy: req.params.calendId
						}
					},
					function(err, num, raw) {
						if (err) next(err);
					});
			}

		}

		res.send("RULE CREATED");
	});

});

// delete rule from Calendar's rules and then loop through the Calendar's rules to reimplement
router.delete('/:ruleId&:calendId', function (req, res, next) {
	Calendar.findOne({_id: req.params.calendId}, function (err, cal) {
		// remove rule from Calendar's rules
		var index = cal.rules.indexOf(req.params.ruleId);
		if(index > -1) {
			cal.rules.splice(index, 1);
		}

		

	});

	Rule.findByIdAndDelete({_id: req.params.ruleId}, function (err, rule) {
		if(err) next(err);
	});
});

module.exports = router;