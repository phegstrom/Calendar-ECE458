var express 	= require('express');
var UserGroup 	= require('../models/UserGroup');
var Calendar 	= require('../models/Calendar');
var User 		= require('../models/User');
var Event		= require('../models/Event');
var router 		= express.Router();

// creates a usergroup with a group of emails
router.post('/', function (req, res, next) {
	var userIds = [];

	User.find({email: {$in: req.body.userEmails}}, function(err, users) {
			console.log(users);
			for (var i = 0; i < users.length; i++) {
				userIds.push(users[i]._id);
			}
			// console.log(Object.prototype.toString.call(userIds));
			var uGroup = new UserGroup({name: req.body.groupName, users: userIds});
			uGroup.save(function (err) {
				if (err) {
					next(err);
				}

				var id_t = req.session.user._id;
				//var id_t = '54d06afb55d013111eea5759'; // for use with POSTman
				User.update({ _id: id_t }, 
						{$push: {userGroups: uGroup._id}}, 
						function(err, numAffected) {
							if (err) next(err);
						});

				res.status(200);
				res.send();
			});
	});
});

// returns the user with the user groups populated
router.get('/', function(req, res, next) {
		var myUser = null;

		if (req.session.user) {
		User.findOne({_id: req.session.user._id})
			.populate('userGroups')
			.exec(function (err, user) {
				if (err) {
					next(err);
				}
				myUser = user;
				UserGroup.find({_id: {$in: req.session.user.userGroups }})
						 .populate('users', 'name email')
						 .exec(function(err, userGroup) {
						 	if(err) {
						 		next(err);
						 	}

						 	myUser.userGroups = userGroup;
						 	res.send(myUser);
						 });
			});
		} else {
			res.send('No user information');
		}
	});

// a route to test group creation, will not need later on
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

// returns a list of users associated with a group id
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

// deletes a userGroup based on the groupID passed in
router.delete('/:groupId', function(req, res, next) {

	User.findOne({
			_id: req.session.user
		})
		.exec(function(err, user) {
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

	res.status(200);
    res.send();
});

// adds a list of users to a UserGroup
router.put('/:groupId', function(req, res, next) {
	var userIds = [];

	User.find({email: {$in: req.body.userEmails}}, function(err, usersT) {

			for (var i = 0; i < usersT.length; i++) {
				userIds.push(usersT[i]._id);
			}

				UserGroup.update({_id: req.params.groupId}, {$pushAll: {users: userIds}}, function (err, numAffected, raw) {
			    	if (err) next(err);
			    	console.log("NAMES ADDED: " + numAffected);	
			    	console.log(raw);
	    		});

			// console.log(userIds);
			// console.log(req.params.groupId);
			res.send('USERS ADDED');
	});	
});

// deletes a list of users from a UserGroup
router.post('/delete/user/:groupId', function(req, res, next) {
	var userIds = [];

	User.find({email: {$in: req.body.userEmails}}, function(err, usersT) {
			if(!usersT) next(new Error('Failed to find any Users'));
			
			for (var i = 0; i < usersT.length; i++) {

				userIds.push(usersT[i]._id);
				UserGroup.update({_id: req.params.groupId}, {$pull: {users: usersT[i]._id}}, function (err, numAffected, raw) {
			    	if (err) next(err);
			    	console.log("NAMES REMOVED: " + numAffected);	
			    	console.log(raw);
	    		});

			}
			// console.log(userIds);
			// console.log(req.params.groupId);
			res.send('USER DELETED');
	});	
});



// a delete test, so I could delete from URL only
router.get('/deltest/:id', function(req, res, next) {
	delTest(req.session.user._id, req.params.id);
	res.redirect('/query');
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
	var ug = new UserGroup({ name: "g1", users: ["54ceb38e276326989dc6a9f8"]});

	ug.save(function(err) {
		//handle error
		User.findOne({email: 'waynexyou+ECE458@gmail.com'})
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
	var ug = new UserGroup({ name: "g1", users: ["54ceb38e276326989dc6a9f8"]});
	ug.save(function(err) {
		if(err){
			next(err);
		}
		User.findOne({email: 'waynexyou+ECE458@gmail.com'})
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



// requires a logged in user, if not logged in then redirect
// function requireLogin (req, res, next) {
// 	if (!req.user) {
// 		res.redirect('/login');
// 	} else {
// 		next();
// 	}
// };





module.exports = router;