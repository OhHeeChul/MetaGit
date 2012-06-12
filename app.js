
/**
 * Module dependencies.
 */

var express = require('express')
  , uuid   = require('node-uuid')
  , sys    = require('util')
  , fs     = require('fs')
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

app.get('/portfolio', function(req,res) {
    fs.readFile('portfolio.html' , function (error , data) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

app.get('/join/:id',function(req,res) {
 res.render('room', {
        isSuccess : true
        , title: 'Chat Room'
        , roomName : 'babo'
        , nickName : uuid.v4()
 });
});
//11342
app.listen(11342, function(){
     sys.debug('Init Listen !!!');
  require('./routes/rooms.js')(app);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
