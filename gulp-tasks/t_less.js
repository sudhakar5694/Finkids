// -------------------- LESS TO CSS --------------------
'use strict';

var gulp = require('gulp'),
    plugins = require("gulp-load-plugins")({
        pattern: ['gulp-*', 'gulp.*'],
        replaceString: /\bgulp[\-.]/
    }),
    // chalk error
    chalk = require('chalk'),
    chalk_error = chalk.bold.red,
    cleanCSS_options = {
        level: { 1: {specialComments: 0 } }
    };

// main styles
gulp.task('less_main', function() {
    return gulp.src('assets/less/main.less', { base: 'assets/less' })
	    .pipe(plugins.sourcemaps.init())
        .pipe(plugins.less())
        .on('error', function(err) {
            console.log(chalk_error(err.message));
            this.emit('end');
        })
        .pipe(plugins.autoprefixer())
        .pipe(plugins.sourcemaps.write('.', {
            sourceRoot: '../less/',
            includeContent: false
        }))
        .pipe(gulp.dest('assets/css'))
        .pipe(plugins.cleanCss(cleanCSS_options))
        .pipe(plugins.rename('main.min.css'))
        .pipe(gulp.dest('assets/css'));
});

// themes
gulp.task('less_themes', function() {
    return gulp.src('assets/less/themes/_theme_*.less')
        .pipe(plugins.less())
        .on('error', function(err) {
            console.log(chalk_error(err.message));
            this.emit('end');
        })
        .pipe(plugins.autoprefixer())
        .pipe(gulp.dest('assets/css/themes/'))
        .pipe(plugins.cleanCss(cleanCSS_options))
        .pipe(plugins.rename(function (path) {
            path.extname = ".min.css"
        }))
        .pipe(gulp.dest('assets/css/themes/'))
        .pipe(plugins.concat('themes_combined.min.css'))
        .pipe(gulp.dest('assets/css/themes/'));
});

// generate user theme
gulp.task('less_my_theme', function() {
    return gulp.src('assets/less/themes/my_theme.less')
        .pipe(plugins.less())
        .on('error', function(err) {
            console.log(chalk_error(err.message));
            this.emit('end');
        })
        .pipe(plugins.autoprefixer())
        .pipe(gulp.dest('assets/css/themes/'))
        .pipe(plugins.cleanCss(cleanCSS_options))
        .pipe(plugins.rename('my_theme.min.css'))
        .pipe(gulp.dest('assets/css/themes/'));
});

// style switcher
gulp.task('less_style_switcher', function() {
    return gulp.src('assets/less/partials/_style_switcher.less')
        .pipe(plugins.less())
        .on('error', function(err) {
            console.log(chalk_error(err.message));
            this.emit('end');
        })
        .pipe(plugins.autoprefixer())
        .pipe(plugins.rename('style_switcher.css'))
        .pipe(gulp.dest('assets/css/'))
        .pipe(plugins.cleanCss(cleanCSS_options))
        .pipe(plugins.rename('style_switcher.min.css'))
        .pipe(gulp.dest('assets/css/'));
});