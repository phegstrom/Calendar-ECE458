var express = require('express');
var User = require('../models/User');
var UserGroup = require('../models/UserGroup');
var router = express.Router();

router.get('/usergroup', function(req, res, next) {
	User.findOne({email: "aaa"})
		.populate('userGroups')
		.exec(function (err, user) {
			if (err) {
				// return handle error
			}
			var toRet = user.userGroups;
			res.send(toRet);
		})
	// res.send(req.body);
	// return user groups
});

router.get('/createGroup', function(req, res, next) {

	var ug = new UserGroup({ name: "g1", users: ["54c72c4dc75f9f6046c3fd34"]});

	ug.save(function(err) {
		//handle error
	});

	res.redirect('/');
	// User.findOne({email: "aaa"}).userGroups.push(new UserGroup())
})

router.get('/usergroup/:userId', function(req, res, next) {
	var uid = req.params.userId.toString();
	// User.findOne({_id: "54c72c4dc75f9f6046c3fd34"})
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
		})
});

router.get('/usergroup/:GroupId', function(req, res, next) {
	User.findOne({_id: req.params.GroupId})
		.populate('userGroups')
		.exec(function (err, user) {
			if (err) {
				// return handle error
			}
			console.log(req.params.userId);

			var toRet = user.userGroups;
			res.send(toRet);
		})
});

// router.get('/usergroup', function(req, res) {
//   User.find(function(err, users) {
//     res.send(users);
//   });

router.get('/usergroup/:GroupId', function(req, res) {

})

module.exports = router;