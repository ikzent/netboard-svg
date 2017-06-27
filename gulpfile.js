/*jslint node: true */
"use strict";

var DIST = './dist/',
    SRCNAME = 'netboard.js',
    FULLNAME = 'netboard-full.js',
    gulp = require('gulp'),
    rjs = require('gulp-requirejs'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('requirejsBuild', function () {
    return rjs({
        baseUrl: SRCNAME,
        out: FULLNAME,
        generateSourceMaps: true,
        shim: {
            // standard require.js shim options
        }
        // ... more require.js options
    })
        .pipe(sourcemaps.init({loadMaps: true})) // initialize gulp-sourcemaps with the existing map
        .pipe(sourcemaps.write()) // write the source maps
        .pipe(gulp.dest(DIST)); // pipe it to the output DIR
});


gulp.task('default', function () {
    console.log('gulp done');
});
