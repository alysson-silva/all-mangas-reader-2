const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const normalize = function(path) {
  return path.replace(/\\/g, "/");
}
const config = {
  context: __dirname + '/src',
  entry: {
    'background/background': './background/background.js',
    'content/testcontent': './content/testcontent.js',
    'content/back': './content/back.js',
    'pages/popup/popup': './pages/popup/popup.js', 
    'pages/lab/lab': './pages/lab/lab.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loaders: 'vue-loader',
        options: {
          loaders: {
            scss: ExtractTextPlugin.extract({
              use: 'css-loader!sass-loader',
              fallback: 'vue-style-loader'
            }),
            sass: ExtractTextPlugin.extract({
              use: 'css-loader!sass-loader?indentedSyntax',
              fallback: 'vue-style-loader'
            }),
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        /** Excludes node_modules except webextension-polyfill which is written in es6 and not transcompiled */
        exclude(file) {
          const funi = normalize(file);
          if (funi.startsWith(normalize(__dirname + '/node_modules/webextension-polyfill'))) {
            return false;
          }
          return funi.startsWith(normalize(__dirname + '/node_modules'));
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: 'css-loader',
          fallback: 'vue-loader',
        })
      },
      {
        test: /\.(png|jpg|gif|svg|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?emitFile=false'
        }
      }
    ],
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new CopyWebpackPlugin([
      {from: 'icons', to: 'icons', ignore: ['icon.xcf']},
      {from: 'pages/popup/popup.html', to: 'pages/popup/popup.html'},
      {from: 'pages/lab/lab.html', to: 'pages/lab/lab.html'},
      {from: 'manifest.json', to: 'manifest.json'},
      {from: 'content/*.css', to: '.'},
      {from: '_locales/**/*', to: '.'},
      {from: '../node_modules/jquery/dist/jquery.min.js', to: 'lib/jquery.min.js'},
      {from: '../node_modules/jquery-modal/jquery.modal.min.js', to: 'lib/jquery.modal.min.js'}
    ]),
    new WebpackShellPlugin({
      onBuildEnd: ['node scripts/remove-evals.js']
    }),
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.devtool = '#cheap-module-source-map';

  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]);
}

module.exports = config;
