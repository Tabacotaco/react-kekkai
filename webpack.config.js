const path = require('path');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    'index': './src/index.js'
  },
  externals: {
    'react': 'commonjs react',
    'moment': 'commonjs moment',
    'numeral': 'commonjs numeral'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: [
      '.jsx', '.js', '.scss', '.css', '.json'
    ],
    alias: {
      'fa': path.resolve(__dirname, 'src/font-awesome/scss/'),
      'scss': path.resolve(__dirname, 'src/components/scss/'),
      'components': path.resolve(__dirname, 'src/components/'),
      'panel': path.resolve(__dirname, 'src/components/panel/'),
      'tool': path.resolve(__dirname, 'src/components/tool/'),
      'types': path.resolve(__dirname, 'src/types/'),
    }
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true
    })
  ],
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /(node_modules)/,
      include: path.resolve('src'),
      use: 'babel-loader'
    }, {
      test: /\.(css|scss)$/,
      exclude: /(node_modules)/,
      use: ExtractTextPlugin.extract({
        use: ['css-loader', 'postcss-loader', 'sass-loader'],
        fallback: 'style-loader'
      })
    }, {
      test: /\.(eot|ttf|woff|woff2|svg|svgz|json|ico)(\?.+)?$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: 'font-awesome/fonts/[name].[hash:8].[ext]'
        }
      }]
    }]
  }
};