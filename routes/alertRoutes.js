var express     = require('express');
var nodemailer 	= require('nodemailer');
var router      = express.Router();
var Event       = require('../models/Event');
var Alert 		= require('../models/Alert');


var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'soCal458@gmail.com',
        pass: 'soCal458password'
    }
});

// var User = require('../models/User');

// function intervalFunction() {
//   User.findOne({email: 'aaa'})
//       .exec(function (err, user) {
//           console.log("Just pinged: " + user.name);
//       });
// } 
// setInterval(intervalFunction, 1000 * 5);

// send mail with defined transport object

 

router.get('/', function (req, res, next) {

  Event.findOne({_id: "54d1ca4f4e356fd2589bb1e1"})
        .exec(function (err, event_t) {
            var htmlString = createEventEmail(event_t);
            var mailOptions = setOptions(htmlString);

          console.log("sending email...");
          console.log(htmlString);
          console.log(mailOptions);
          console.log(event_t);

        if (event_t) {
          transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        }

            res.redirect('/');
       });


});

// takes in Event object
function createEventEmail(ev) {
    var toRet = '';
    toRet += '<b>Event Name: </b>';
    toRet += ev.name + ' <br> ';
    toRet += '<b>Description: </b>';
    toRet += ev.description + ' <br>';
    toRet += '<b>Start Time: </b>';
    toRet += ev.start.getMonth() + '/' + 
             ev.start.getDate() + '/' +  
             ev.start.getYear() + 
             ' at ' + ev.start.toTimeString() + ' <br>';

    return toRet;
}


function setOptions(htmlString) {

    var mailOptions = {
        from: 'soCal Staff <foo@blurdybloop.com>', // sender address', // sender address
        to: 'parker.hegstrom@gmail.com', // list of receivers
        subject: 'A friendly reminder!', // Subject line
        text: 'See below for your event information:', // plaintext body
        html: htmlString // html body
    }; 

    return mailOptions;
}

module.exports = router;