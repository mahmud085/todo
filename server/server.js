var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();


var path=require('path');
var bodyParser=require('body-parser');


app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);


app.get('/',function(req,res,next){
  res.render('index.ejs');
});
app.get('/login',function(req,res,next){
  res.render('login.ejs');
});
app.get('/signup',function(req,res,next){
  res.render('signup.ejs');
});
app.get('/authenticate',function(req,res,next){
  res.render('todo.ejs');
});

// Enable http session
app.use(loopback.session({ secret: 'keyboard cat' }));

// Load the provider configurations
var config = {};
try {
 config = require('../providers.json');
} catch(err) {
 console.error('Please configure your passport strategy in `providers.json`.');
 console.error('Copy `providers.json.template` to `providers.json` and replace the clientID/clientSecret values with your own.');
 process.exit(1);
}



boot(app, __dirname);

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true
}));

// The access token is only available after boot
app.middleware('auth', loopback.token({
  model: app.models.accessToken
}))

//app.middleware('session:before', loopback.cookieParser(app.get('cookieSecret')));
app.middleware('session', loopback.session({
  secret: 'kitty',
  saveUninitialized: true,
  resave: true
}));

// Initialize passport
passportConfigurator.init();
 

// Set up related models
passportConfigurator.setupModels({
 userModel: app.models.user,
 userIdentityModel: app.models.userIdentity,
 userCredentialModel: app.models.userCredential
});
// Configure passport strategies for third party auth providers
for(var s in config) {
 var c = config[s];
 c.session = c.session !== false;
 passportConfigurator.configureProvider(s, c);
}

app.post('/signup', function (req, res, next) {

  var User = app.models.user;

  var newUser = {};
  newUser.email = req.body.email.toLowerCase();
  newUser.username = req.body.username.trim();
  newUser.password = req.body.password;

  User.create(newUser, function (err, user) {
    if(err) console.log(err);
    res.redirect('/login');
  });
});
app.get('/auth/logout', function (req, res, next) {
  req.logout();
  res.redirect('/');
});
app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
if (require.main === module) {
  app.start();
}

