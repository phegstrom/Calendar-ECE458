var passport = require('passport');
var User = require('../models/User');
var router = require('express').Router();

router.get('/', function(req, res, next) {

  // console.log("loginRoutes");
  // console.log(req.session.user);
  res.render('index', {user: req.user});
});

router.get('/register', function(req, res) {
  res.render('register', {});
});

router.post('/register', function(req, res, next) {
  console.log('registering user');
  User.register(new User({ name: req.body.name, email: req.body.email}), req.body.password, function(err, acc) {
    if (err) { console.log('error while user register!', err); return next(err); }
    console.log(req.body);
    console.log('user registered!');
    res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  res.render('login', { user: req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  console.log(req.user);
  req.session.user = req.user;
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.session.user = undefined;
  req.logout();
  res.redirect('/');
});

router.get('/query', function(req, res) {
  User.find(function(err, users) {
    res.send(users);
  });


  // User.findOne({ 'name': 'h' }, 'userGroups', function (err, user) {
  //   if (err) return handleError(err);
  //   res.send(user);
  // });

});

module.exports = router;


