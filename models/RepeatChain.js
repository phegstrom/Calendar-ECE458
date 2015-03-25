var mongoose = require('mongoose');
var _		= require('underscore');
var Schema = mongoose.Schema;
var collectionName = 'repeatChainC';



// Date is a javascript Date object which you can query
// specific parts of it easily. just google javascript date object
var RepeatChainSchema = new Schema({
	myEvents: [{type: Schema.Types.ObjectId, ref: 'Event'}]
}, {
	collection: collectionName
});


// takes in repeat object, then returns array of Dates, [Date]
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
RepeatChainSchema.statics.createEventConstructors = function (constructorObj, repeatDateArray, rChainId) {
	toRet = [];
	console.log('hererreerer');
	for (var i = 0; i < repeatDateArray.length; i++) {

		var constructorTemp = _.clone(constructorObj);
		console.log(constructorObj.start + " type of " + typeof constructorObj.start);

		// copy dates to avoid copy by reference
		var dStart = new Date(constructorObj.start);
		constructorTemp.start = dStart;
		var dEnd = new Date(constructorObj.end);
		constructorTemp.end = dEnd;
		constructorTemp.repeatChain = rChainId;
		// change value of month and day for start and end
		constructorTemp.start.setDate(repeatDateArray[i].getDate());
		constructorTemp.start.setMonth(repeatDateArray[i].getMonth());
		constructorTemp.end.setDate(repeatDateArray[i].getDate());
		constructorTemp.end.setMonth(repeatDateArray[i].getMonth());
		

		toRet.push(constructorTemp);
	}

	console.log(toRet);

	return toRet;
};


module.exports = mongoose.model('RepeatChain', RepeatChainSchema);