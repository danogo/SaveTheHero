// ================================================
// Loading modules (and models) and setting them up
// ================================================
const express       = require('express'),
      mtdOverride   = require('method-override'),
      app           = express(),
      session       = require('express-session'),
      flash         = require('connect-flash'),
      mongoose      = require('mongoose'),
      passport      = require('passport'),
      LocalStrategy = require('passport-local'),
      Hero          = require('./models/hero'),
      Comment       = require('./models/comment'),
      User          = require('./models/user');
      // seedDB        = require('./seedDB');

// === Importing routes ===
const heroesRoutes    = require('./routes/heroes'),
      commentsRoutes = require('./routes/comments'),
      indexRoutes    = require('./routes/index');

// === Setup ===
// seed database with fake data
// seedDB();
//set template engine to ejs
app.set('view engine', 'ejs');
//add middleware which parses x-ww-form-urlencoded
//request bodies so we can grab data posted through the form
// using req.body.somedata, true allows for complex data
app.use(express.urlencoded({extended: true}));
//add middleware which sets public folder for external static assets
app.use(express.static(__dirname + '/public'));
//add middleware which lets to use such HTTP verbs as PUT or DELETE
//override with POST having ?_method=DELETE or ?_method=PUT in query value
app.use(mtdOverride('_method'));
//connect mongoose to mongodb using environment variable or connect to default local mongodb (or create first and then connect if didn't find one)
const dbUrl = process.env.DATABASEURL || 'mongodb://localhost/savethehero';
mongoose.connect(dbUrl);

//=== Config for AUTH ===
//use express-session
app.use(session({
  secret: 'Black Mirror is better than Westworld',
  resave: false,
  saveUninitialized: false
}));
//use connect-flash package for flash messages
app.use(flash());
//set initialization and handling persistent login sessions using passport methods as middlewares
app.use(passport.initialize());
app.use(passport.session());
//set strategy for authentication using passport-local-mongoose method
passport.use(new LocalStrategy(User.authenticate()));
//coding and encoding sessions using passport-local-mongoose methods
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=== Middlewares ===
//using middleware which allows to access data about
//user in every template, so we don't need to pass req.user everywhere
//we can just use currentUser in template
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.errorMsg = req.flash('error');
  res.locals.successMsg = req.flash('success');
  next();
});

//==========
//  ROUTES
//==========
app.use('/heroes', heroesRoutes);
app.use('/', indexRoutes);
app.use('/heroes/:id/comments', commentsRoutes);

//=== Starting the server ===
app.listen(process.env.PORT || 3069, process.env.IP, () => console.log('The savethehero server has started...'));
