var express 	= require('express');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();

router.get('/usergroup', function(req, res, next) {
	var myUser = null;

	User.findOne({_id: req.session.user._id})
		.populate('userGroups')
		.exec(function (err, user) {
			if (err) {
				// return handle error
				console.log('ERROR');
			}

			myUser = user;

			UserGroup.find({_id: {$in: req.session.user.userGroups }})
					 .populate('users', 'name')
					 .exec(function(err, userGroup) {
					 	if(err) {
					 		// return handle error
					 	}

					 	myUser.userGroups = userGroup;
					 	res.send(myUser);
					 });
		});
});

router.get('/usergroup/:GroupId', function(req, res, next) {
	UserGroup.findOne({_id: req.params.GroupId})
		.populate('users')
		.exec(function (err, userGroup) {
			if (err) {
				// return handle error
			}

			var toRet = userGroup;
			res.send(toRet);
		}); 
});

// create a usergroup for a user
router.post('/usergroup', function (req, res, next) {
	var userIds = [];
	User.find({email: {$in: req.body.userEmails}})
		.exec(function (err, users) {
			for (var i = 0; i < users.length; i++) {
				userIds.push(users[0]._id);
			}

			var uGroup = new UserGroup({name: req.body.groupName,
								users: userIds});
			uGroup.save(function (err) {
				if (err) {
					// handle error
				}

				req.session.user.userGroups.push(uGroup);
				req.session.user.save(function (err) {

				});	
			});
		});
});

router.get('/calendars/:calType', function(req, res, next) {
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

router.delete('/usergroup/:groupId', function(req, res, next) {
	User.findOne({_id: req.session.user})
		.exec(function (err, user) {
			var index = user.userGroups.indexOf(req.params.groupId);
			user.userGroups.splice(index, 1);

			user.save(function(err) {
				if (err) {
					// return handle error
				}
			});
		});

	UserGroup.findByIdAndRemove(req.params.groupId, function(err, usergroup) {

	});

});

router.get('/createGroup', function(req, res, next) {
	// hardcoded user added to group by id
	// parkerCreateGroup();
	peterCreateCal(next);
	// peterCreateGroup();
	res.redirect('/');
})

router.get('/usergroup/:userId', function(req, res, next) {
	var uid = req.query.usergroup.userId;

	User.findOne({_id: req.params.userId})
		.populate('userGroups')
		.exec(function (err, user) {
			if (err) {
				// return handle error
			}

			var toRet = user.userGroups;
			res.send(toRet);
		});
});	

//temp
router.get('/deltest/:id', function(req, res, next) {
	delTest(req.session.user._id, req.params.id);
	res.redirect('/');
});

router.get('/error/', function(req, res, next) {
	var user = errorTest();
	res.send(user);
	//res.redirect('/');
});

//temp
function delTest(uid, id) {
	User.findOne({_id: uid})
		.exec(function (err, user) {
			var index = user.userGroups.indexOf(id);
			user.userGroups.splice(index, 1);

			user.save(function(err) {
				if (err) {
					// return handle error
				}
			});
		});


	UserGroup.findByIdAndRemove(groupId, function(err, usergroup) {

	});
}

function peterCreateCal(next) {
	var ev = new Event({name: "ev1", description: "first event", location: "Duke", start: Date.now(), end: Date.now(), creator: "54c9484365c89945c06054cd"});
	var cal = new Calendar({name: "cal1", owner: "54c9484365c89945c06054cd"});

	console.log('\n\n');
	console.log(ev);

	ev.save(function(err) {
		if(err) {
			console.log('ERROR');
			console.log(err);
			next(err);
		}

		// Calendar.findOne({name: 'cal1'})
		//    .exec(function(err, calendar) {
		//    	calendar.events.push(ev._id);
		//    	calendar.save(function(err) {

		//    	});
		//    });
	});

	// cal.save(function(err) {
		// User.findOne({email: 'aaa'})
		// 	.exec(function(err, user) {
		// 		user.myCalId.push(cal._id);
		// 		user.save(function(err) {

		// 		});
		// 	});

	// });
}

function peterCreateGroup() {
	var ug = new UserGroup({ name: "g1", users: ["54c9484c65c89945c06054ce"]});

	ug.save(function(err) {
		//handle error
		User.findOne({email: 'aaa'})
		.exec(function (err, user) {
			if (err) {
				// handle error	
			}
			user.userGroups.push(ug._id);
			user.save(function(err){
				if (err) {
					// handle error	
				}
			});
		});

	});
}

	

function parkerCreateGroup() {
	var ug = new UserGroup({ name: "g1", users: ["54c94b9f8c84f42537442af3"]});

	ug.save(function(err) {
		//handle error
		User.findOne({email: 'aaa'})
		.exec(function (err, user) {
			if (err) {
				// handle error	
			}
			user.userGroups.push(ug._id);
			user.save(function(err){
				if (err) {
					// handle error	
				}
			});
		});

	});
}

function errorTest() {
	User.find({email: {$in: ['aaa', 'a'] }}).exec(function (err, user) {
		if (err) {
			console.log(err);
		}
		console.log(user.length);
		return user;
	});
}

module.exports = router;