var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'repeatChainC';



// Date is a javascript Date object which you can query
// specific parts of it easily. just google javascript date object
var RepeatChainSchema = new Schema({
	myEvents: [{type: Schema.Types.ObjectId, ref: 'Event'}]
}, {
	collection: collectionName
});


// takes in repeat object, then returns [Date]
// input: 
	// {
	// 	frequency: {type: Number, default: null},
	// 	endDate: {type: Date, default: null},
	// 	days: [{type: Date}]
	// }
RepeatChainSchema.statics.getRepeatDates = function (repeatObj) {
	var toRet = [];
	var daysLength = repeatObj.days.length + 0;
	var delta = 0;

	if (repeatObj.frequency) {
		// frequency
		for (var i = 0; i < repeatObj.frequency; i++) {
			for (var j = 0; j < daysLength; j++) {
				var d = new Date(repeatObj.days[j]);
				d.setDate(d.getDate() + delta);
				toRet.push(d);
			}
			delta += 7;
		}
	} else {
		// endDate
		var endDate = new Date(repeatObj.endDate);
		var repeat = true;
		while (repeat) {
			for (var k = 0; k < daysLength; j++) {
				var d = new Date(repeatObj.days[k]);
				d.setDate(d.getDate() + delta);
				if(d.getDate() > endDate.getDate()) {
					repeat = false;
					break;
				}
				toRet.push(d);
			}
			delta += 7;
		}
	}

	return toRet;
};

// returns an array of constructors, so i can make that many events
// in back end
RepeatChainSchema.statics.createEventConstructors = function (constructorObj, repeatArray) {
	toRet = [];

	for (var i = 0; i < repeatArray.length; i++) {
		toRet[i] = constructorObjectModified
	}


	return toRet;
};


module.exports = mongoose.model('RepeatChain', RepeatChainSchema);