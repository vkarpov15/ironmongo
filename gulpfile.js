'use strict';

const gulp = require('gulp');
const stylus = require('gulp-stylus');

gulp.task('css', () => gulp.src('./index.styl').
  pipe(stylus()).pipe(gulp.dest('./bin/css')));

gulp.task('watch', ['css'], () => gulp.watch(['./*.styl'], ['css']));
