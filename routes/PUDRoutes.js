var express = require('express');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');
var Event 		= require('../models/Event');
var Alert		= require('../models/Alert');
var router 		= express.Router();

// repeats PUDremove
setInterval(PUDremove, 1000 * 30);
setInterval(PUDreorder, 1000 * 60 * 60 * 24);

function PUDreorder() {
	User.find()
		.populate('PUDs')
		.exec(function (err, userArr) {
			userArr.forEach(function (user) {
				user.reorderPUDs();
			});
		});
}

function PUDremove() {
	var currDate = new Date();
	PUD.find(function (err, pudArr) {
		pudArr.forEach(function (pud) {
			if(pud.expDate != null &&pud.expDate < currDate) {
				console.log(pud.expDate + " is before " + currDate);
				console.log("deleting");
				PUD.findByIdAndRemove({_id: pud._id}, function (err) {
				});
			}
		});
	});
}

router.get('/pudReorder/test', function (req, res, next) {
	var ret = PUDreorder();

	res.send("PUDs reordered");
});

// creates a PUD associated with logged in user
router.post('/createPUD', function (req, res, next) {
	var newPUD = new PUD();

	newPUD.description = req.body.description;
	newPUD.time = req.body.time;
	myD = new Date();
	newPUD.myDate = myD;
	newPUD.repeatInterval = req.body.interval;
	console.log("alert interval: " + req.body.alertInterv);

	newPUD.alertInterval = req.body.alertInterv;

	console.log("New alert interval: " + newPUD.alertInterval);
	// create Alert objects

	if (req.body.alert != undefined) {
		var aId = createAlert(req.body.alert, newPUD, req);
		newPUD.alert = aId;
	}

	newPUD.expDate = req.body.expirationDate;
	newPUD.willEscalate = req.body.willEscalate;

	// for POSTman
	var uid = req.session.user._id;
	 // var uid = '54d25e88f98e0e3cf81bc051';

	newPUD.save(function (err, saved) {
		if (err) next(err);
		User.findOneAndUpdate({_id: uid}, {$push: {PUDs: saved._id}}, 
				function(err, numAffected) {
					if (err) next(err);
					var toRet = saved.toJSON();
					toRet.time = saved.time;
					// console.log(toRet);
					res.send(toRet);
		});
	});
});

function createAlert(alertObj, pud, req) {
	var uid = req.session.user._id;
	var uEmail = req.session.user.email;
	console.log(alertObj);
	console.log("HERE");
	console.log(pud);
	var myAlert = new Alert({time: alertObj.time, 
							   method: alertObj.method, 
							   owner: uid,
							   ownerEmail: uEmail,
								// myEvent: null,
								myPUD: pud._id});

	console.log("created alert for PUD:");
	myAlert.save(function (err, saved) {
		if (err) next(err);
		console.log(myAlert);	
	});

	return myAlert._id;

}



// Returns list of PUDS associated with user that aren't in future
router.get('/', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	User.findOne({_id: uid}, 'PUDs')
		.populate('PUDs')
		.exec(function (err, user) {
			if(err) next(err);
			var pudArr = [];
			var currDate = Date.now();
			user.PUDs.forEach(function (pud) {
				if(pud.myDate <= currDate)
					pudArr.push(pud);
			});

			var toRet = convertToHours(pudArr);
			res.send(toRet);

		});
});

// returns an array of pud objects, but with time property converted
function convertToHours(puds) {
	var toRet = [];

	for (var i = 0; i < puds.length; i++) {
		var obj = puds[i].toJSON();
		obj.time = puds[i].time;
		toRet.push(obj);
	}
	return toRet;
}

// Returns list of PUDS associated with user that aren't in future
router.get('/getAll', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	User.findOne({_id: uid}).exec(function (err, user) {
			if(err) next(err);

			PUD.find({_id: {$in: user.PUDs}}).exec(function (err, puds){
				if (err) next(err);
				var toRet = convertToHours(puds);
				res.send(toRet);
			});
			
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
router.put('/user/reorder', function (req, res, next) {
	var uid = req.session.user._id;

	User.findOne({_id: uid}, function (err, user) {
		if (err) next(err);
		user.PUDs = req.body.PUDs;
		user.save(function (err, saved) {
			res.send(saved.PUDs);
		});
	});
});

// completes a PUD , might remove depending if there is repeat set
router.post('/:pudId', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	PUD.findOne({_id: req.params.pudId}, function (err, pud) {
		// console.log("interval: " + pud.repeatInterval);
		if (pud.repeatInterval != 0) {
			var tempDate = pud.myDate;
			pud.myDate = null;
			// tempDate.setDate(tempDate.getDate() + pud.repeatInterval);
			tempDate.setMinutes(tempDate.getMinutes() + pud.repeatInterval);
			pud.myDate = tempDate;

			if(pud.alert != undefined) {
				Alert.findOne({_id: pud.alert}, function (err, pudAlert) {
					var tempTime = pudAlert.time;
					pud.time = null;
					// tempTime.setDate(tempTiime.getDate() + pud.repeatInterval);
					tempTime.setMinutes(tempTiime.getMinutes() + pud.repeatInterval);
					pudAlert.time = tempTime;
					pudAlert.save();
				});
			}

			pud.save(function (err, saved) {
				if (err) next(err);
				res.send(saved);
			});
		} else {
			//remove
			User.findOneAndUpdate({_id: uid}, {$pull: {PUDs: req.params.pudId}}, function (err, num) {
				if(pud.alert != undefined) {
					Alert.findOneAndRemove({_id: pud.alert}, function (err) {
						
					});
				}

				pud.remove();
				res.send('PUD Removed');
			});
		}
	});
});


// deletes a PUD from a users list
router.delete('/:pudId', function (req, res, next) {

	var uid = req.session.user._id;
	// var uid = '54d25e88f98e0e3cf81bc051';

	User.findOneAndUpdate({_id: uid}, {$pull: {PUDs: req.params.pudId}}, function (err, num) {
		// do logic here to create new PUD if there is a repeat

		PUD.findOneAndRemove({_id: req.params.pudId}, function (err, pud) {
			if(pud.alert != undefined) {
				Alert.findOneAndRemove({_id: pud.alert}, function (err) {

				});
			}
			if (err) next(err);
			res.send('PUD Destroyed');
		});

	});
});



module.exports = router;