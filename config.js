var path = require('path')
  , baseDir = __dirname
  , config;

config = {
  viewsDir: path.join(baseDir, 'views'),
  staticDir: path.join(baseDir, 'static'),
  lessDir: path.join(baseDir, 'less'),
  lessPrefix: '/css',
  cssDir: path.join(baseDir, 'static', 'css')
};

config.baseDir = baseDir;

module.exports = config;