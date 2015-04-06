var express 	= require('express');
var User 		= require('../models/User');
var Calendar 	= require('../models/Calendar');
var _ 			= require('underscore');
var nodemailer 	= require('nodemailer');
var router 		= express.Router();


// email we created to use in sending alerts to users
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'soCal458@gmail.com',
        pass: 'soCal458password'
    }
});

// sends email with text version of calendar
router.post('/text', function (req, res, next) {
	console.log(req.body);
	var htmlString = createTextEmailHtml(req.body);
	var options = setOptions(htmlString, req.session.user.email, 'Text Version of Calendar');
	sendEmail(options, htmlString);
	res.send(req.body);
});

// sends link to a picture of the calendar
router.post('/image', function (req, res, next) {
	console.log(req.body);
	var htmlString = createImageEmailHtml(req.body.image);
	var options = setOptions(htmlString, req.session.user.email, 'Image Version of Calendar');
	sendEmail(options, htmlString);	
	res.send(req.body);
});


var sendEmail = function(mailOptions, htmlString) {

	// var mailOptions = setOptions(htmlString, mailOptions);
	console.log("sending email...");

	transporter.sendMail(mailOptions, function(error, info) {
	    if (error) {
	        console.log(error);
	    } else {
	        console.log('Message sent: ' + info.response);
	    }
	});

};


// function to create option json for nodemailer
function setOptions(htmlString, email, subject) {
    var mailOptions = {
        from: 'soCal Staff <soCalStaff@gamil.com>', // sender address', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: 'See below for your event information:', // plaintext body
        html: htmlString // html body
    }; 

    return mailOptions;
}

// takes in Alert populated with Event object
function createTextEmailHtml(eventArray) {
	var toRet = '';
	console.log('parsing...');
	console.log('type of:');
	console.log(typeof eventArray[0].start);

	eventArray.forEach(function (ev) {
		var myD = new Date(ev.start);
		var mOtherD = new Date(ev.end);
		console.log(myD);
	    toRet += '<b>Event Name: </b>';
	    toRet += ev.name + ' <br> ';
	    toRet += '<b>Calendar: </b>';
	    toRet += ev.calendarName + ' <br>';
	    toRet += '<b>Description: </b>';
	    toRet += ev.description + ' <br>';
	    toRet += '<b>Location: </b>';
	    toRet += ev.location + ' <br>';
		toRet += '<b>Start Time: </b>';
	    toRet += myD + ' <br>';		    
		toRet += '<b>End Time: </b>';
	    toRet += mOtherD + ' <br>';		    
	    toRet += '<br> <br> <br>'
	    console.log('finished parsing one event...');
	});

	var date = new Date();
    
            
    toRet += '<b>This email was sent at: </b>' + date.toTimeString();


    return toRet;
}

// takes in Alert populated with Event object
function createImageEmailHtml(url) {
	var toRet = '';
	toRet += 'Please follow the link below to view a PNG image of your calendar! <br>';
	toRet += url + '<br><br>'

	var date = new Date();
    
            
    toRet += '<b>This email was sent at: </b>' + date.toTimeString();


    return toRet;
}

module.exports = router;