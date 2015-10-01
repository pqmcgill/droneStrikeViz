module.exports = {
  entry: './src/App.js',
  output: {
    fileName: 'bundle.js',
    path: './public'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel'}
    ]
  }
};
