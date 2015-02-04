var express 	= require('express');
var mongoose	= require('mongoose');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();

// post new calendar
router.post('/', function(req, res, next) {
	var newCal = new Calendar();
	newCal.name = req.body.name;

	newCal.owner = req.session.user._id;
	// for PostMan
	//newCal.owner = req.body.owner;
//
	newCal.save(function(err) {
		if(err) {
			next(err);
		}

		User.update({_id: req.session.user._id}, {$push: {myCalId: newCal._id}}, function(err, num, raw) {
		// for PostMan
		//User.update({_id: req.body.owner}, {$push: {myCalId: newCal._id}}, function(err, num, raw) {
			if (err) next(err);
		});

		res.json({ message: 'Calendar created!'});
	});
});

// adding user to modList and calender to user's modList
router.put('/modList/:calId', function(req, res, next) {
	Calendar.update({_id: req.params.calId}, {$push: {modList: req.body.modList}}, function(err, num, raw) {
		if (err) next(err);
	});

	console.log(req.body.modList);
	res.send('HI');
});

router.delete('/modList/:calId', function(req, res, next) {
	Calendar.findOne({_id: req.params.calId})
			.exec(function(err, cal) {
				for(var i = 0; i < req.body.modList; i++) {
					var index = cal.modList.index(req.body.modList[i]);
					if(index != -1) {
						index.splice(index, 1);
					}
				}
			});
});

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
					.populate(req.params.calType + ' owner modList')
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

module.exports = router;