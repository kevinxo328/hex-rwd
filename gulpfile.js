var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');


var envOptions = {
  string: 'env',
  default: { env: 'develop'}
}

var options = minimist(process.argv.slice(2), envOptions)
console.log(options)
 
gulp.task('clean', function () {
    return gulp.src(['./.tmp','./public'], {read: false, allowEmpty: true})
        .pipe($.clean());
});

gulp.task('html', function(){
  return gulp.src('./source/*.html')
  .pipe(gulp.dest('./public/'))
  .pipe(browserSync.stream());
});

gulp.task('img', function(){
  return gulp.src('./source/img/*')
  .pipe(gulp.dest('./public/img/'))
});

gulp.task('sass', function () {

  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 編譯完成
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(options.env === 'production', $.minifyCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['@babel/preset-env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles({
  }))
      .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task(`vendorJs`,function(){
  return gulp.src('./.tmp/vendors/**/*.js')
  .pipe($.concat('vendors.js'))
  .pipe($.if(options.env === 'production', $.uglify()))
  .pipe(gulp.dest('./public/js'))
  .pipe(browserSync.stream());
});

gulp.task('image-min',function(){
    return gulp.src('source/images/*')
      .pipe($.if(options.env === 'production', $.imagemin()))
      .pipe(gulp.dest('public/images'))
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('build',
  gulp.series(
    'clean',
    'bower',
    'vendorJs',
    gulp.parallel('html','img','sass','babel','image-min')
  )
);

gulp.task('default',
  gulp.series(
    'bower',
    'vendorJs',
    'img',
    gulp.parallel('html','sass','babel'),
    function(done) {
      browserSync.init({
        server: {
            baseDir: "./public"
        }
      });

      gulp.watch('./source/*.html', gulp.series('html'));
      gulp.watch('./source/scss/**/*.scss', gulp.series('sass'));
      gulp.watch('./source/js/**/*.js', gulp.series('babel'));
      done();
    }
  )
);