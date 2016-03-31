var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
    collectionName = "usersC";
    PUD = require('./PUD');
   	_ = require('underscore');

var deepPopulate = require('mongoose-deep-populate');

// note other fields are created by the .plugin() method below
var UserSchema = new Schema({
	name: String,
	myCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	modCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	canView: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	canViewBusy: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	userGroups: [{type: Schema.Types.ObjectId, ref: 'UserGroup'}],
	eventRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}], // ev requests sent to me
	createdRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}], 
	PUDs: [{type: Schema.Types.ObjectId, ref: 'PUD'}], // PUDs[0] = highest priority		
	createdSSEvents: [{type: Schema.Types.ObjectId, ref: 'SlotSignUp'}],
	SSEvents: [{type: Schema.Types.ObjectId, ref: 'SlotSignUp'}], // ssu requests sent to me
	mySlots: [{type: Schema.Types.ObjectId, ref: 'Slot'}],
	dateCreated: {type: Date, default: Date.now}
}, {collection: collectionName});

var options = {usernameField: 'email'};
//console.log('Account schema created');
UserSchema.plugin(passportLocalMongoose, options);

UserSchema.plugin(deepPopulate);

UserSchema.methods.reorderPUDs = function () {
	// populate PUDs

	var toEscalate = [];
	var notToEscalate = [];
	var jsonPUDs = this.toJSON().PUDs;

	if(jsonPUDs == undefined) {
		return;
	}

	for(var i = 0; i < jsonPUDs.length; i++) {
		var jsonPUD = jsonPUDs[i];
		jsonPUD.index = i;
		if(jsonPUD.willEscalate)
			toEscalate.push(jsonPUD);
		else
			notToEscalate.push(jsonPUD);
	}

	// loop through toEscalate and decrement index
	// if one to the left is 1 away, don't decrement
	for(var j = 0; j < toEscalate.length; j++) {
		if((j > 0) && (toEscalate[j-1].index == toEscalate[j].index - 1))
			continue;
		else if(toEscalate[j].index > 0)
			toEscalate[j].index--;
	}

	// merge toEscalate and notToEscalate
	var e = 0; var n = 0;
	var toRet = [];
	while (1) {
		if(e == toEscalate.length && n != notToEscalate.length) {
			toRet.push(notToEscalate[n]);
			n++;
		} else if (e != toEscalate.length && n == notToEscalate.length) {
			toRet.push(toEscalate[e]);
			e++;
		} else if (e == toEscalate.length && n == notToEscalate.length) {
			break;
		} else {
			if(toEscalate[e].index <= notToEscalate[n].index) {
				toRet.push(toEscalate[e]);
				e++;
			}
			else {
				toRet.push(notToEscalate[n]);
				n++;
			}
		}
	}
	
	this.PUDs = toRet;
	this.save();
	return toRet;
}

// returns a promise that will give access to array of ids
UserSchema.statics.convertToIds = function (emails) {
	return this.find({email: {$in: emails}}, '_id').exec();
};

UserSchema.statics.toIds = function (emails, cb) {
	this.find({email: {$in: emails}}, '_id', function (err, ids) {
		console.log('FROM ID USER FUNCTION\n\n\n');
		console.log(ids);
		cb(err, ids);
	});
}

UserSchema.statics.toIdsUpdate = function (emails, cb) {
	this.find({email: {$in: emails}}, function (err, idsT) {
		console.log('\n\n\nFROM ID USER FUNCTION');
		// idsT = _.pluck(idsT, '_id');
		var toRet = [];
		idsT.forEach(function (singleUser) {
			toRet.push(singleUser.id);
		});
		console.log(toRet);
		cb(err, toRet);
	});
}

// returns array of emails
UserSchema.statics.toEmails = function (ids, cb) {
	var toRet = [];
	this.find({_id: {$in: ids}}, 'email', function (err, ret) {
		toRet = _.pluck(ret, 'email');
		cb(err, toRet);
	});
}

// called from Event Schema, returns in cb highest priority PUD
UserSchema.methods.getBestPUD = function (alottedTime, cb) {
	var pudArray = this.PUDs;

	this.model('User').findOne({_id: this._id}).populate('PUDs').exec(function (err, user) {
		// console.log(user);
		if (err) next(err);
		var didBreak = false;
		var pudArray = user.PUDs;
		for (var i = 0; i < pudArray.length; i++) {
			if (pudArray[i].time <= alottedTime) {
				cb(pudArray[i]);
				didBreak = true;
				break;
			}
		}

		if (!didBreak)
			cb(null);
		
	});
};


module.exports = mongoose.model('User', UserSchema);