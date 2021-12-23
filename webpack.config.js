const path = require('path')
const webpack = require('webpack');

module.exports = {
  entry:  './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'production',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    // https://medium.com/@michalozogan/how-to-split-moment-js-locales-to-chunks-with-webpack-de9e25caccea
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack#using-ignoreplugin
    // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack#using-contextreplacementplugin
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /\/fr$/) // need "fr$" instead of "fr" to avoid "fr-*"
  ]
};
