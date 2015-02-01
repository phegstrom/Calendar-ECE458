var express 	= require('express');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();

router.post('/', function(req, res, next) {
	var newCal = new Calendar();
	newCal.name = req.body.name;
	newCal.owner = req.body.owner;

	newCal.save(function(err) {
		if(err) {
			next(err);
		}

		res.json({ message: 'Calendar created!'});
	});
});

router.put('/modList/:calId', function(req, res, next) {
	Calendar.findOne({_id: req.params.calId})
			.exec(function(err, cal) {
				cal.modList.push(req.body.modList);
			});
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

router.get('/:calType', function(req, res, next) {
	console.log('\n\n');

	User.findOne({_id: req.session.user._id})
		.populate(req.params.calType)
		.exec(function (err, user) {
			if (err) {
				next(err);
			}

			Calendar.find({_id: {$in: req.session.user[req.params.calType]}})
					.populate(req.params.calType)
					.exec(function(err, calendar) {
						if(err) {
							next(err);
						}

						console.log(calendar[0].events);

						Event.find({_id: {$in: calendar[0].events}})
							 .populate('name')
							 .exec(function(err, event) {
							 	if(err) {
							 		next(err);
							 	}

							 	// console.log(event);
							 	user[req.params.calType] = calendar;
							 	res.send(user);
							 })

						// user[req.params.calType] = calendar;
						// res.send(user);
					})

			Event.find({_id: "54c952344ef570adca9c28c8"})
				 .populate('name')
				 .exec(function(err, event) {
				 	console.log('yo');
				 	console.log(event);
				 })

			res.send(user);

		});
});

module.exports = router;