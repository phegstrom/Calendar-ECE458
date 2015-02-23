var express = require('express');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');
var Event 		= require('../models/Event');
var router 		= express.Router();


// creates a PUD associated with logged in user
router.post('/createPUD', function (req, res, next) {
	var newPUD = new PUD();

	newPUD.description = req.body.description;
	newPUD.time = req.body.time;

	// for POSTman
	var uid = req.session.user._id;
	 // var uid = '54d25e88f98e0e3cf81bc051';

	newPUD.save(function (err, saved) {
		if (err) next(err);
		User.findOneAndUpdate({_id: uid}, {$push: {PUDs: saved._id}}, 
				function(err, numAffected) {
					if (err) next(err);
					res.send(saved);
		});
	});
});

// Returns list of PUDS associated with user
router.get('/', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	User.findOne({_id: uid})
		.populate('PUDs')
		.exec(function (err, user) {
			if(err) next(err);

			res.send(user.PUDs);
		});
});

// returns specific PUD if given ID
router.get('/:pudId', function (req, res, next) {

	PUD.findOne({_id: req.params.pudId}).exec(function (err, pud) {
			if(err) next(err);
			var obj = pud.toJSON();
			obj.time = pud.time;
			res.send(200, obj);
	});

});

// for testing only
router.get('/test', function (req, res, next) {

	var pid = '54e9393ecdc439c671363aef';
	PUD.findById(pid).exec(function (err, pud) {

		res.send(200, pud.time);
	})

});

// for testing only
router.get('/evType', function (req, res, next) {

	var pid = '54e3da3d377962b61a3ff7d5';
	Event.findOne({_id: pid}, function (err, ev) {

		ev.getPUD(function (pud) {
			res.send(pud);
		});

	});

});


// edits a PUD given a pud ID
router.put('/:pudId', function (req, res, next) {
	PUD.findOne({_id: req.params.pudId}, function (err, pud) {
		pud.description = req.body.description;
		pud.time = req.body.time;
		pud.save(function (err, saved) {
			res.send(pud);
		});
	});
});


// handles reordering of priorities
router.put('/reorder', function (req, res, next) {
	User.findById(req.session.user._id, function (err, user) {
		user.PUDs = req.body.PUDs;
		user.save(function (err, saved) {
			res.send(saved);
		})
	});
});

// deletes a PUD
router.delete('/:pudId', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	User.findOneAndUpdate({_id: uid}, {$pull: {PUDs: req.params.pudId}}, function (err, num) {
		// do logic here to create new PUD if there is a repeat

		PUD.findOneAndRemove({_id: req.params.pudId}, function (errT, numT) {
			res.send("PUD removed");
		});
	});
});



module.exports = router;