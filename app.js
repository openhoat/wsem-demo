var path = require('path')
  , http = require('http')
  , express = require('express')
  , io = require('socket.io')
  , WsEventMgr = require('wsem')
  , util = require('./lib/util')
  , baseDir, httpServer, ioServer, app, intervalId;

baseDir = __dirname;

// Express app creation
app = express();

// Web Socket Event Manager creation
wsem = new WsEventMgr(/*{           // Default values
 registerEventName: 'register',     // event name to use to register a wsem event
 unregisterEventName: 'unregister', // event name to use to unregister a wsem event
 clientScriptUrl: '/wsem.js'        // wsem client side script location
 }*/);

// Express configuration

app.set('env', process.env.NODE_ENV || 'development');

app.configure('all', function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(baseDir, '/views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({
    once: true,
    src: path.join(baseDir, '/less'),
    dest: path.join(baseDir, 'public', 'css'),
    prefix: '/css',
    compress: true,
    debug: 'development' === app.get('env')
  }));
  app.use(wsem.expressMiddleware()); // Middleware to serve the client side wsem script
  app.use(express.static(path.join(baseDir, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.get('/', function (req, res) {
  res.render('index');
});

// Http server creation
httpServer = http.createServer(app);
// Http server start
httpServer.listen(app.get('port'), function () {
  console.log('Express server listening on port %s', app.get('port'));
});

// Web socket server start
ioServer = io.listen(httpServer, { log: 'development' === app.get('env') });

// We want to be warned when a client is registering the 'time' event
wsem.addListener('time', function () {
  if (wsem.hasClientRegistration('time')) {
    if (!intervalId) {
      console.log('starting time streaming');
      // Every second we send the time to registered clients
      intervalId = setInterval(function () {
        var currentTime = util.dateFormat(new Date(), '%H:%M:%S');
        console.log('sending current time');
        wsem.emit('time', currentTime);
      }, 1000);
    }
  } else {
    console.log('stopping time streaming');
    clearInterval(intervalId);
    intervalId = null;
  }
});

// Wsem start
wsem.start(ioServer, function (socket) {
  // When a 'todo' is received from a client, we send it to all clients registered for that wsem event
  socket.on('todo', function (todo) {
    console.log('new todo :', todo);
    wsem.emit('todo', todo);
  });
});