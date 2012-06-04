
/**
 * Module dependencies.
 */

var express = require('express')
  , uuid   = require('node-uuid')
  , sys    = require('sys')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.get('/join/:id',function(req,res) {
 res.render('chat', {
        isSuccess : true
        , title: 'Chat Room'
        , roomName : 'babo'
        , nickName : uuid.v4()
 });
});

app.listen(process.env.PORT, function(){
     sys.debug('Init Listen !!!');
  require('./routes/rooms.js')(app);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
