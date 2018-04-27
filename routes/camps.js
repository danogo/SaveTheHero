const express = require('express'),
      Camp    = require('../models/camp'),
      router  = express.Router();

//=== Middlewares ===
//middleware checking if user is logged in, AUTHENTICATION
const isLoggedIn = (req, res, next) => {
  //check if request is authenticated using passport method
  if (req.isAuthenticated()) {
    return next();
  } else {
    //if not redirect to login
    res.redirect('/login');
  }
};
//middleware checking if user is logged in and owns particular campground, AUTHORIZATION
const checkCampOwnership = (req, res, next) => {
  //if user is logged in
  if (req.isAuthenticated()) {
    //find camp to compare author.id with logged user's _id
    Camp.findById(req.params.id, (err, foundCamp) => {
      if (err) {
        console.log(err);
        //redirect to where user came from
        res.redirect('back');
      } else {
        //check if logged in user owns showed campground
        //equality comparison(=== or ==) doesn't work because author.id is mongoose object and user._id is a string
        //therefore equals() method is used
        if (foundCamp.author.id.equals(req.user._id)) {
            //if ids are equal move on to next callback function
            next();
        } else {
          //redirect to where user came from
          res.redirect('back');
        }
      }
    });
  } else {
    //if user is not logged in redirect to where user came from
    res.redirect('back');
  }
};

// === Routes ===

//handling GET request for camps route, INDEX - displaying all the campgrounds
router.get('/', (req, res) => {
  Camp.find({}, (err, allCamps) => {
    if (err) {
      console.log(err);
    } else {
      let user = req.user;
      //render page displaying all the campgrounds
      res.render('campgrounds/index', {camps:allCamps, user: user});
    }
  })
});

//handling POST request for camps route, CREATE - adding new campground ot DB
router.post('/', isLoggedIn, (req, res) => {
  //grab data from form
  let name = req.body.name;
  let url = req.body.url;
  let desc = req.body.description;
  let author = {
    id: req.user._id,
    username: req.user.username
  }
  //create object with received data
  let newCamp = {name: name, imageURL: url, description: desc, author: author};
  //create new document(record) in model(table/collection) using newCamp object
  Camp.create(newCamp, (err, newCamp) => {
    if (err) {
      console.log(err);
    } else {
      console.log('New Camp created Sir!');
      //redirect to handler for get request to /camps
      res.redirect('/camps');
    }
  });
});

//handling GET request for camps/new route, NEW - show form to create new campground
router.get('/new', isLoggedIn, (req, res) => {
  res.render('campgrounds/new');
});

//handling GET request for /camps/:id, SHOW - display details about specific campground
router.get('/:id', (req, res) => {
  let campId = req.params.id;
  Camp.findById(campId).populate('comments').exec((err, foundCamp) => {
    if (err) {
      console.log(err);
    } else {
      //render show template and pass value of found camp to it
      res.render('campgrounds/show', {camp: foundCamp});
    }
  });
});

//handling GET request to /camps/:id/edit, EDIT - edit details about particular camp
router.get('/:id/edit', checkCampOwnership, (req, res) => {
  Camp.findById(req.params.id, (err, foundCamp) => {
      res.render('campgrounds/edit', {camp: foundCamp});
  });
});

//handling PUT request to /camps/:id, UPDATE - update details about selected camp
router.put('/:id', checkCampOwnership, (req, res) => {
  Camp.findByIdAndUpdate(req.params.id, req.body.camp, (err, updatedCamp) => {
    if (err) {
      console.log(err);
      res.redirect('/camps');
    } else {
      res.redirect(`/camps/${req.params.id}`);
    }
  });
});

//handling DELETE request to /camps/:id, DESTROY - remove particular campground from database
router.delete('/:id', checkCampOwnership, (req, res) => {
  Camp.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      console.log(err);
      res.redirect('/camps');
    } else {
      res.redirect('/camps');
    }
  });
});



module.exports = router;