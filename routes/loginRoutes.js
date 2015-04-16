var passport  = require('passport');
var User      = require('../models/User');
var Calendar  = require('../models/Calendar');
var router    = require('express').Router();

router.get('/', requireLogin, function(req, res, next) {
  res.render('dashboard', {user: req.user});
});


router.get('/register', function(req, res) {
  res.render('register', {});
});

router.post('/register', function(req, res, next) {
  console.log('registering user');
  User.register(new User({ name: req.body.name, email: req.body.email}), req.body.password, function(err, acc) {
    if (err) { console.log('error while user register!', err); return next(err); }

    // create default calendar for new registered user
    var defCal = new Calendar({name: "My Calendar", owner: acc._id});
    defCal.save(function (err) {
      if(err) next (err);

      User.update({_id: acc._id}, {$push:{myCalId: defCal._id}}, function (err, num, raw) {
        if (err) next(err);
      });
    })

    res.redirect('/login');
  });
});

router.get('/login', function(req, res) {
  res.render('login', { user: req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  req.session.user = req.user;
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.session.reset();
  req.logout();
  res.redirect('/login');
});

router.get('/query', function(req, res) {
  User.find()
      .populate('PUDs')
      .exec(function (err, users) {
          res.send(users)
      })
});

router.get('/users', function (req, res, next) {
  User.find({}, '_id email', function (err, users) {
    res.send(users);
  })
});


function requireLogin (req, res, next) {
  if (!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

module.exports = router;