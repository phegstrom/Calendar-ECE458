var express = require('express');
var UserGroup = require('../models/UserGroup');
var User = require('../models/User');
var router = express.Router();

router.get('/usergroup', function(req, res, next) {
	var myUser = null;
	var myUserGroups = [];

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

router.get('/calenders', function(req, res, next) {
	User.findOne({_id: req.session.user._id})
		.populate('myCalId modCalId assocCalId')
		.exec(function (err, user) {
			if (err) {
				// return handle error
			}

			// will want to return json object of calendars later
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
	peterCreateGroup();
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
			console.log("test");
			console.log(req.params.userId);
			console.log(uid);
			console.log(typeof uid);

			var toRet = user.userGroups;
			res.send(toRet);
		});
});	

//temp
router.get('/deltest/:groupId', function(req, res, next) {
	delTest(req.session.user._id, req.params.groupId);
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
	var ug = new UserGroup({ name: "g2", users: ["54c8853cebf964949f1f11d0"]});

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
	var ug = new UserGroup({ name: "g1", users: ["54c7c49839e07ab609106be9"]});

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

module.exports = router;