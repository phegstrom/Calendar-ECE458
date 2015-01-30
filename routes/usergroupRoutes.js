var express 	= require('express');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();


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
	var ug = new UserGroup({ name: "g1", users: ["54c7c49839e07ab609106be9"]});

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
			user.save(function(err){
				if (err) {
					next(err);
				}
			});
		});

	});
}

module.exports = router;