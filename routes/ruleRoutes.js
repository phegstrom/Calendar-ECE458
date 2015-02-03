var express 		= require('express');
var Rule 			= require('../models/Rule');
var Calendar	 	= require('../models/Calendar');
var router 			= express.Router();

var CANT_VIEW = 'canNotView';

// route that creates a RULE for a certain calendId
router.post('/:calendId', function (req, res, next) {

	var rule  = new Rule({ruleType: req.body.ruleType,
						  assocUsers: req.body.userIds,
						  assocUserGroups: req.body.userGroupIds});

	rule.save(function (err) {

		Calendar.update({_id: req.params.calendId}, {$push: {rules: rule._id}}, function (err, num, raw) {
			if (err) next(err);
		});
		var rType = req.body.ruleType;
		for (var i = 0; i < req.body.userIds.length; i++) {

			var currId = req.body.usersIds[i];
			if (req.body.ruleType != CANT_VIEW) {
				User.update({_id: currId}, {$push: {rType: req.params.calendId}}, function (err, num, raw) {
					if (err) next(err);
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

		// implement later
		for (var i = 0; i < req.body.userGroupIds.length; i++) {

		}

	});

});


module.exports = router;