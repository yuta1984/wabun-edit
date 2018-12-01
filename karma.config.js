const webpackConfig = require('./webpack.config.js');
webpackConfig.mode = 'production';

module.exports = function (config) {
    config.set({
        browsers: [
            'PhantomJS'
        ],

        frameworks: [
            'jasmine'
        ],

        files: [
            'spec.bundle.js'
        ],

        preprocessors: {
            'spec.bundle.js': ['webpack', 'sourcemap']
        },
        autoWatch: true,
        webpack: webpackConfig,

        webpackMiddleware: {
            stats: 'errors-only'
        },

        plugins: [
            require('karma-jasmine'),
            require('karma-phantomjs-launcher'),
            require('karma-webpack'),
            require('karma-sourcemap-loader')
        ]
    });
};