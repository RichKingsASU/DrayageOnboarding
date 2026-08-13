const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  resolve: { extensions: ['.tsx', '.ts', '.js', '.jsx'] },
  module: {
    rules: [
      { test: /\.[jt]sx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] } } },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ],
  devServer: { proxy: { '/api': 'http://127.0.0.1:8000' }, port: 3000 }
};