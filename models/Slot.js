var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Event = require('./Event');
var User = require('./User');
var Calendar = require('./Calendar');
var collectionName = 'slotC';
var deepPopulate = require('mongoose-deep-populate');

var SlotSchema = new Schema({
	useremail: String,
	SSU: {type: Schema.Types.ObjectId, ref: 'SlotSignUp'},
	basicBlocksNumber: Number,
	start: Date,
	end: Date
}, {collection: collectionName});

SlotSchema.methods.createEvent = function (ssu) {
	console.log("createEvent started");
	var startDate = this.start;
	var endDate = this.end;
	User.findOne({email: this.useremail}, function (err, user){
		if(user.myCalId.length > 0) {
			Calendar.findOne({_id: user.myCalId[0]}, function (err, cal) {
				var newEvent = new Event();
				newEvent.name = "Slot: "+ssu.name;
				newEvent.description = ssu.description;
				newEvent.start = new Date(startDate);
				newEvent.end = new Date(endDate);
				newEvent.ownerID = user._id;
				newEvent.creator = user._id;
				cal.events.push(newEvent);
				cal.save();
				newEvent.save(function (err, evSave) {
					console.log("new event saved");
				});
			});
		}
	});
};


SlotSchema.plugin(deepPopulate);

module.exports = mongoose.model('Slot', SlotSchema);