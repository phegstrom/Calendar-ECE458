var express 		= require('express');
var Rule 			= require('../models/Rule');
var Calendar	 	= require('../models/Calendar');
var router 			= express.Router();
var User 			= require('../models/User');
var UserGroup 	 	= require('../models/UserGroup');
var mongoose 		= require('mongoose');

var CANT_VIEW = 'canNotView';

// route that creates a RULE for a certain calendId
router.post('/:calendId', function (req, res, next) {

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
		var hasUserGroup = false;

		// add rule stuff for userGroups
		console.log("!! "+ req.body.userGroupIds);	
		for (var i = 0; i < userGroupIds.length; i++) {
			hasUserGroup = true;
			UserGroup.find({_id: userGroupIds[i]}, function (err, uGroup) {
				if (err) next(err);
					userIdArray = uGroup[0].users;

					usersAdded = propogateRuleForUsers(userIdArray,
										  usersAdded,
										  req.body.ruleType,
										  req.params.calendId);	

				// now add rule stuff for individual users
				propogateRuleForUsers(req.body.userIds,
									  usersAdded,
									  req.body.ruleType,
									  req.params.calendId);
								
			});

		}

		 if (!hasUserGroup) {
			propogateRuleForUsers(req.body.userIds,
								  usersAdded,
								  req.body.ruleType,
								  req.params.calendId);
		 }

		res.send("RULE CREATED");
	});

});

router.delete('/:ruleId/:calId', function (req, res, next) {
	console.log("!! "+req.params.calId);

	Calendar.findOne({_id: req.params.calId}, function (err, calendar) {
		var rules = calendar.rules;
		var delIndex = rules.indexOf(req.params.ruleId);
		calendar.rules.splice(delIndex, 1);

		//pull stuff 

		// remove effects of rule
		deleteRuleForUsers(req.params.ruleId, req.params.calId);

		for(var i = 0; i < rules.length; i++) {
			Rule.findOne({_id: rules[i]}, function(err, rule) {
				rule.getAllUsersInRule(function (users) {
					var usersAdded = [];

					// potential scope problem?
					propogateRuleForUsers(users, usersAdded, rule.ruleType, req.params.calId);
				});
			});
		}
	});
});

function deleteRuleForUsers(ruleId, calId) {
	Rule.find({_id: ruleId}, function (err, rule) {
		rule.getAllUsersInRule(function (users) {
			for(var i = 0; i < users.length; i++) {
				User.update({_id: users[i]}, {$pull: {modCalId: calId}}, function(err, num, raw) {
					if(err) next(err);
				});
				User.update({_id: users[i]}, {$pull: {canView: calId}}, function(err, num, raw) {
					if(err) next(err);
				});
				User.update({_id: users[i]}, {$pull: {canViewBusy: calId}}, function(err, num, raw) {
					if(err) next(err);
				});
			}			
		});
	});

	Rule.findByIdAndRemove({_id: mongoose.Types.ObjectId(ruleId)}, function(err) {

	});
}

// takes in userIDArray and addes the calenderID to them!
function propogateRuleForUsers(userIdArray, usersAdded, ruleType, calendId) {
	console.log("begin propogate");
	console.log(usersAdded);
	for (var i = 0; i < userIdArray.length; i++) {		
		var currId = userIdArray[i];
		console.log(usersAdded.indexOf(currId));
		if (usersAdded.indexOf(currId) != -1) continue;
		//usersAdded = cb(usersAdded, currId.toString());
		usersAdded.push(currId.toString());

		if (ruleType != CANT_VIEW) {

			User.findOne({_id: currId}, function (err, user) {
				if (err) next(err);
				user[ruleType].push(calendId);
				user.save(function (err) {
					if (err) next(err);
				});
			});

		} else {
			User.update({
					_id: currId
				}, {
					$pull: {
						modCalId: calendId,
						canView: calendId,
						canViewBusy: calendId
					}
				},
				function(err, num, raw) {
					if (err) next(err);
				});
		}

	}
	return usersAdded;
}

router.delete('/:ruleId', function (req, res, next) {
	Rule.findOne({_id: req.params.ruleId}, function (err, rule) {
		console.log(rule);
		var test = rule.getAllUsersInRule(function(users) {
			console.log(users);
			res.send(users);
		});
		console.log(test);
	});
})

module.exports = router;

module.exports.deleteRuleForUsers = deleteRuleForUsers;
