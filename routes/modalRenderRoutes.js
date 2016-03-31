var express = require('express');
var router = express.Router();

/* GET modals */
router.get('/:modalName', function(req, res) {
  res.render('modals/' + req.params.modalName, { title: 'Modal' });
});

module.exports = router;