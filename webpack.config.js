const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.ts',
  devtool: 'eval-cheap-source-map',
  devServer: {
    static: './dist',
    watchFiles: ['src/**/*', 'public/**/*'],
    hot: true,
    client: {
        overlay: {
            warnings: false,
            errors: true,
            runtimeErrors: true
        }
    }
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
        patterns: [
            { from: "public", to: "" } //to the dist root directory
        ],
    }),
],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    libraryTarget: 'this',
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    mangleExports: false
  }

};