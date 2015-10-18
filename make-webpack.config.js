/**
 * sherlock221b
 * 参考文章
 * 1. http://www.ituring.com.cn/article/200534
 * 2. http://www.infoq.com/cn/articles/frontend-engineering-webpack
 */

'use strict';
var path = require('path');
var fs = require('fs');

var webpack = require('webpack');

//chunk打包插件
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
//压缩混淆插件
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
//资源路径切换
var HtmlWebpackPlugin = require('html-webpack-plugin');

//源码文件夹
var srcDir = path.resolve(process.cwd(), 'src');

//上线目录
var assets = 'assets/';

//别名
var alias = require("./src/alias.json");
console.log(alias);

//从src源码目录定位
for(var a in alias){
    alias[a] = path.resolve(srcDir,alias[a]);
    console.log(alias[a]);
}


var makeConf = function(options){

    options = options || {};
    //debug
    var debug = options.debug !== undefined ? options.debug : true;
    //获得入口文件
    var entries = genEntries();
    //所有的chunk
    var chunks = Object.keys(entries);

    //webpack配置
    var config = {

        entry : entries,

        output : {
            //打包文件存放的绝对路径
            path : assets,
            //打包后的文件名
            filename: '[name].js'
        },

        module : {
            //webpack 将不再扫描这个文件中的依赖。
            noParse: ['zepto'],

            //加载器配置
            loaders: [
                //.css 文件使用 style-loader 和 css-loader 来处理
                {test: /\.css$/, loader: 'style-loader!css-loader'},

                //.js 文件使用 jsx-loader 来编译处理
                //{ test: /\.js$/, loader: 'jsx-loader?harmony' },

                //图片文件使用 url-loader 来处理，小于8kb的直接转为base64
                {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'}
            ]
        },

        //开发模式
        devtool: 'source-map',

        plugins : [

            new CommonsChunkPlugin({
                name: 'vendors',
                chunks: chunks,
                // 提取所有chunks共同依赖的模块
                minChunks: chunks.length
            })

        ],

        resolve: {
            //自动扩展文件后缀名，意味着我们require模块可以省略不写后缀名
            extensions: ['', '.js', '.json', '.scss'],
            //模块别名定义，方便后续直接引用别名，无须多写长长的地址
            alias: alias
        }
    };



    // 自动生成入口文件，入口js名必须和入口文件名相同
    // 例如，a页的入口文件是a.html，那么在js目录下必须有一个a.js作为入口文件
    var pages = fs.readdirSync(srcDir);

    pages.forEach(function(filename) {
        var m = filename.match(/(.+)\.html$/);

        if(m) {
            var conf = {
                template: path.resolve(srcDir, filename),
                // @see https://github.com/kangax/html-minifier
                // minify: {
                //     collapseWhitespace: true,
                //     removeComments: true
                // },
                filename: filename
            };

            if(m[1] in config.entry) {
                conf.inject = 'body';
                conf.chunks = ['vendors', m[1]];
            }
            config.plugins.push(new HtmlWebpackPlugin(conf));
        }

    });

     //压缩混淆
     config.plugins.push(new UglifyJsPlugin());

    return config;
}


//获得入口文件
var genEntries = function() {

    var jsDir = path.resolve(srcDir, 'js');

    var names = fs.readdirSync(jsDir);
    var map = {};
    names.forEach(function(name) {
        var m = name.match(/(.+)\.js$/);
        var entry = m ? m[1] : '';
        var entryPath = entry ? path.resolve(jsDir, name) : '';
        if(entry) map[entry] = entryPath;
    });
    return map;
}

module.exports =  makeConf;



