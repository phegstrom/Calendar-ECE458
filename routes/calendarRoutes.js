var express 	= require('express');
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

	User.find({_id: {$in: req.body.modList}}, function(err, user) {
		user.modCalId.push(req.params.calId);
		user.save();
	})

	// User.update({_id: {$in: req.body.modList}}, {$push: {modCalId: req.params.calId}}, function(err, num, raw) {
	// 	if (err) next(err);
	// });

	res.send('HI');


	// Calendar.findOne({_id: req.params.calId}, function(err, cal) {
	// 	cal.modList.push(req.body.modList);

	// 	User.findOne({_id: req.session.user._id}, function(err, user) {
	// 		user.modCalId.push(req.params.calId);
	// 		user.save();
	// 		cal.save();
	// 	})
	// });
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

// router.get('/:calType', function(req, res, next) {
// 	User.findOne({_id: req.session.user._id})
// 		.populate(req.params.calType)
// 		.exec(function(err, user) {
// 			// Calendar.find({_id: {$in: req.session.user[req.params.calType]}})
// 			// 		.exec(function(err, calendar) {

// 			// 		});

// 			res.send(user);
// 		});
// });

router.get('/:calType', function (req, res, next) {
	console.log('\n\n');

	var uId = "54c9484365c89945c06054cd";

	User.findOne({_id: uId})
	// User.findOne({_id: req.session.user._id})
		.populate(req.params.calType)
		.exec(function (err, user) {
			if (err) {
				next(err);
			}

			var cType = req.params.calType;

			Calendar.find({_id: {$in: user.cType}})
			// Calendar.find({_id: {$in: user[req.params.calType]}})
					.populate (req.params.calType)
					.exec(function (err, calendar) {
						if(err) {
							next(err);
						}
						console.log("STUFF");
						console.log(req.params.calType);
						console.log(calendar);

						if(calendar.length > 0)
						{
							console.log(calendar[0].events);

							Event.find({_id: {$in: calendar[0].events}})
								 .populate('name')
								 .exec(function(err, event) {
								 	if(err) {
								 		next(err);
								 	}

								 	// console.log(event);
								 	user[req.params.calType] = calendar;
								 	res.send(user[req.params.calType]);
								 });
						}

						// user[req.params.calType] = calendar;
						// res.send(user);
					});

			// Event.find({_id: "54c952344ef570adca9c28c8"})
			// 	 .populate('name')
			// 	 .exec(function(err, event) {
			// 	 	console.log(event);
			// 	 })

			res.send(user);

		});
});

module.exports = router;