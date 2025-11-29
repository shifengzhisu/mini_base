const path = require('path');

module.exports = {
  entry: {
    app: './js/app.js',
    home: './js/home.js',
    game: './js/game.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: 'js/[name].js',
  },
};
