var path = require('path')
  , http = require('http')
  , express = require('express')
  , ejs = require('ejs')
  , io = require('socket.io')
  , WsEventMgr = require('wsem')
  , util = require('./lib/util')
  , config = require('./config')
  , httpServer, ioServer, app, wsem, intervalId, verbose;

config.listenAddress = process.env.OPENSHIFT_NODEJS_IP || config.listenAddress || '127.0.0.1';
config.listenPort = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || config.listenPort || 3000;
config.viewsDir = config.viewsDir || path.join(config.baseDir, '/views');
config.lessDir = config.lessDir || path.join(config.baseDir, 'styles');
config.staticDir = config.staticDir || path.join(config.baseDir, 'static');
config.cssDir = config.cssDir || path.join(config.staticDir, 'styles');

// Express app creation
app = express();

// Web Socket Event Manager creation
wsem = new WsEventMgr(/*{           // Default values
 registerEventName: 'register',     // event name to use to register a wsem event
 unregisterEventName: 'unregister', // event name to use to unregister a wsem event
 clientScriptUrl: '/wsem.js'        // wsem client side script location
 }*/);

// Express configuration

app.set('env', process.env.NODE_ENV || 'production');

verbose = app.get('env') === 'development';

app.configure('all', function () {
  app.set('port', config.listenPort);
  app.set('views', config.viewsDir);
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');
  app.use(express.favicon());
});

app.configure('development', function () {
  app.use(express.logger('dev'));
});

app.configure('all', function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({
    src: config.lessDir,
    dest: config.cssDir,
    prefix: config.lessPrefix,
    once: true,
    compress: true,
    optimization: 2,
    debug: verbose
  }));
  app.use(wsem.expressMiddleware()); // Middleware to serve the client side wsem script
  app.use(express.static(config.staticDir));
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
httpServer.listen(config.listenPort, config.listenAddress, function () {
  verbose && console.log('http server listening on %s:%s', config.listenAddress, config.listenPort);

  // Web socket server start
  ioServer = io.listen(httpServer, { log: verbose });

  setInterval(function(){
    wsem.emit('hello', 'world!');
  }, 3000);

  // We want to be warned when a client is registering the 'time' event
  wsem.addListener('time', function () {
    if (wsem.hasClientRegistration('time')) {
      if (!intervalId) {
        verbose && console.log('starting time streaming');
        // Every second we send the time to registered clients
        intervalId = setInterval(function () {
          var currentTime = util.dateFormat(new Date(), '%H:%M:%S');
          verbose && console.log('sending current time');
          wsem.emit('time', currentTime);
        }, 1000);
      }
    } else {
      verbose && console.log('stopping time streaming');
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  // Wsem start
  wsem.start(ioServer, function (socket) {
    // When a 'todo' is received from a client, we send it to all clients registered for that wsem event
    socket.on('todo', function (todo) {
      verbose && console.log('new todo :', todo);
      wsem.emit('todo', todo);
    });
  });
});