var express 	= require('express');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();

// creates a usergroup with a group of emails
router.post('/', function (req, res, next) {
	var userIds = [];
	console.log(req.body.userEmails);
	console.log(req.session.user);
	User.find({email: {$in: req.body.userEmails}})
	//User.find({email: 'aaa'})
		.exec(function (err, users) {
			for (var i = 0; i < users.length; i++) {
				userIds.push(users[0]._id);
			}
			console.log(userIds);
			console.log(req.body.groupName);
			var uGroup = new UserGroup({name: req.body.groupName,
								users: userIds});
			uGroup.save(function (err) {
				if (err) {
					// handle error
				}

				//req.session.user.userGroups.push(uGroup);
				// req.session.user.save(function (err) {

				// });	
			res.redirect('/');
			});
		});
	});

router.get('/test', function(req, res, next) {

	var promise = User.find({_id: 'aaa'}).exec(function (err, user) {
		console.log("FOUND USER");
	});

	promise.addBack(function(err, user) {
		console.log("DISPLAYING INFO");
		console.log(val);
		console.log(promise);
	});

	res.redirect('/');
});

router.get('/', function(req, res, next) {
		var myUser = null;

		User.findOne({_id: req.session.user._id})
			.populate('userGroups')
			.exec(function (err, user) {
				if (err) {
					next(err);
				}

				myUser = user;

				UserGroup.find({_id: {$in: req.session.user.userGroups }})
						 .populate('users', 'name')
						 .exec(function(err, userGroup) {
						 	if(err) {
						 		next(err);
						 	}

						 	myUser.userGroups = userGroup;
						 	res.send(myUser);
						 });
			});
	});

router.get('/createGroup', function(req, res, next) {
	// hardcoded user added to group by id
	parkerCreateGroup();
	User.findOne({_id: req.session.user._id})
		User.findOne({_id: req.session.user._id})
		.exec(function(err, user) {
			if (err) next(err);
			req.session.user = user;
		});
	//peterCreateCal(next);
	// peterCreateGroup();
	res.redirect('/');
});

router.get('/:groupId', function(req, res, next) {
		UserGroup.findOne({_id: req.params.groupId})
				.populate('users')
				.exec(function (err, userGroup) {
					if (err) {
						next(err);
					}

					var toRet = userGroup;
					res.send(toRet);
				});
	});

router.get('/:userId', function(req, res, next) {
		var uid = req.query.usergroup.userId;

		User.findOne({_id: req.params.userId})
			.populate('userGroups')
			.exec(function (err, user) {
				if (err) {
					next(err);
				}
				console.log("test");
				console.log(req.params.userId);
				console.log(uid);
				console.log(typeof uid);

				var toRet = user.userGroups;
				res.send(toRet);
			});
	});

router.delete('/:groupId', function(req, res, next) {
		User.findOne({_id: req.session.user})
			.exec(function (err, user) {
				var index = user.userGroups.indexOf(req.params.groupId);
				user.userGroups.splice(index, 1);

				user.save(function(err) {
					if (err) {
						next(err);
					}
				});
			});

		UserGroup.findByIdAndRemove(req.params.groupId, function(err, usergroup) {

		});		
	});

router.get('/deltest/:id', function(req, res, next) {
	delTest(req.session.user._id, req.params.id);
	res.redirect('/');
});

//temp
function delTest(id, groupId) {
	User.findOne({_id: id})
		.exec(function (err, user) {
			var index = user.userGroups.indexOf(groupId);
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

function peterCreateGroup() {
	var ug = new UserGroup({ name: "g1", users: ["54c9484c65c89945c06054ce"]});

	ug.save(function(err) {
		//handle error
		User.findOne({email: 'aaa'})
		.exec(function (err, user) {
			if (err) {
				next(err);
			}
			user.userGroups.push(ug._id);
			user.save(function(err){
				if (err) {
					next(err);
				}
			});
		});

	});
}

function parkerCreateGroup() {
	var ug = new UserGroup({ name: "g1", users: ["54cc0daaada915af1993872f"]});
	ug.save(function(err) {
		if(err){
			next(err);
		}
		User.findOne({email: 'aaa'})
		.exec(function (err, user) {
			if (err) {
				next(err);
			}
			user.userGroups.push(ug._id);
			user.save(function(err, usert){
				if (err) {
					next(err);
				}		
			});
		});

	});

}




module.exports = router;