var express 		= require('express');
var Rule 			= require('../models/Rule');
var Calendar	 	= require('../models/Calendar');
var router 			= express.Router();


// route that creates a RULE for a certain calendId
router.post('/:calendId', function (req, res, next) {

	var rule  = new Rule({ruleType: req.body.ruleType,
						  assocUsers: req.body.userIds,
						  assocUserGroups: req.body.userGroupIds});

	rule.save(function(err) {
		Calender.update({_id: req.params.calendId}, {$push: {rules: rule._id}})
	});

});


module.exports = router;