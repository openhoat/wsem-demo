var path = require('path')
  , baseDir = __dirname
  , config;

config = {
  listenPort: 3000,
  baseDir: baseDir,
  viewsDir: path.join(baseDir, 'views'),
  staticDir: path.join(baseDir, 'static'),
  lessDir: path.join(baseDir, 'less'),
  lessPrefix: '/css',
  cssDir: path.join(baseDir, 'static', 'css')
};

module.exports = config;