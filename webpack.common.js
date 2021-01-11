const path = require('path');
const webpack = require('webpack');




/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled MiniCssExtractPlugin for you. This allows your app to
 * use css modules that will be moved into a separate CSS file instead of inside
 * one of your module entries!
 *
 * https://github.com/webpack-contrib/mini-css-extract-plugin
 *
 */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');




/*
 * We've enabled TerserPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/terser-webpack-plugin
 *
 */

const TerserPlugin = require('terser-webpack-plugin');

const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',


  entry: {
    main:path.resolve('./src/testApp.ts')
  },

  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({ 
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new CopyPlugin({
      patterns: [{
        context: path.resolve(__dirname, './src/html'),
        // from: '*.html'
        from: '**'
      }]
    })
  ],

  module: {

    rules: [{
      test: /\.(ts|tsx)$/,
      loader: 'ts-loader',
      include: [path.resolve(__dirname, 'src')],
      exclude: [/node_modules/, /lib/]
    }, {
      test: /\.html$/i,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      }]
    }, {
      test: /.(scss|css)$/,
      use: [{
        loader: MiniCssExtractPlugin.loader,
        options: {
          publicPath: './'
        }
      }, {
        loader: "css-loader",
        options: {
          sourceMap: true
        }
      }, {
        loader: "sass-loader",

        options: {
          sourceMap: true
        }
      }]
    }, {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        // loader: 'url-loader',
        loader: 'file-loader',
        options: {
            name: 'images/[name].[ext]'
        }
    }]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  // optimization: {
  //   minimizer: [
  //     new TerserPlugin(), 
  //     new OptimizeCSSAssetsPlugin({}),
  //     new HtmlMinimizerPlugin({minimizerOptions: {
  //       collapseWhitespace: false,
  //     }})
  //   ],

  //   // splitChunks: {     
  //   //   chunks: 'all'
  //     // cacheGroups: {
  //     //   vendors: {
  //     //     priority: -10,
  //     //     test: /[\\/]node_modules[\\/]/
  //     //   }
  //     // },
  //     // chunks: 'async',
  //     // minChunks: 1,
  //     // minSize: 30000,
  //     // name: false
  //   // }
  // }
}