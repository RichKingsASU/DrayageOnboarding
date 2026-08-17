const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  resolve: { extensions: ['.tsx', '.ts', '.js', '.jsx'] },
  module: {
    rules: [
      { test: /\.[jt]sx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'] } } },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  watchOptions: { ignored: /node_modules/ }, devServer: { host: '127.0.0.1', proxy: [{ context: ['/api'], target: 'http://127.0.0.1:8000' }], port: 3000, static: { directory: './', watch: false } }
};