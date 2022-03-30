//tools
import { src, dest, watch, series, parallel } from 'gulp'
import del from 'del'
import gulpIf from 'gulp-if'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import yargs from 'yargs'
// js
import babel from 'gulp-babel'
import terser from 'gulp-terser'
import concat from 'gulp-concat'
//styles
import dartSass from 'sass'
import gulpSass from 'gulp-sass'
import { init, write } from 'gulp-sourcemaps'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcss from 'gulp-postcss'
import postcssNormalize from 'postcss-normalize'
import purgeCss from 'gulp-purgecss'
// VIEWS
import pug from 'gulp-pug'
// images
import imagemin from 'gulp-imagemin'
// data
import data from 'gulp-data'
import fs from 'fs'
import path from 'path'
import merge from 'gulp-merge-json'
// browser / cache
import cacheBust from 'gulp-cache-bust'
import browserSync from 'browser-sync'
// CONFIG
const PRODUCTION = yargs.argv.prod
// TODO: add wordpress argv
const PUBLIC_ROOT = PRODUCTION ? './dist' : './public'
const paths = {
  assets: ['./src/vendor/**/*'],
  default: './workflows/default',
  wordpress: './workflows/wordpress',
  del: ['./dist', './public'],
  data: {
    src: './src/data/files/**/*.json',
    dest: './src/data',
  },
  images: {
    src: './src/images/**/*',
    dest: PUBLIC_ROOT + '/assets/images',
  },
  scripts: {
    src: './src/scripts/**/_*.js',
    dest: PUBLIC_ROOT + '/assets',
  },
  svg: './src/svg/**/*.svg',
  theme: {
    src: './src/styles/**/*.{scss,sass}',
    dest: PUBLIC_ROOT + '/assets',
  },
  template: {
    src: './src/templates/pages/!(_)*.pug',
    watch: './src/templates/**/*.pug',
  },
}
const CSS_PLUGINS = [postcssNormalize(), autoprefixer(), cssnano()]
const SASS = gulpSass(dartSass)
const SERVER = browserSync.create()
const browser = {
  reload: done => {
    SERVER.reload()
    done()
  },
  serve: done => {
    SERVER.init({
      server: {
        baseDir: PUBLIC_ROOT,
      },
    })
    done()
  },
}
export function generate() {
  // TODO: generate wp workflow
  del(['./public', './dist'])
  return src(paths.default + '/**/*', { base: paths.default }).pipe(dest('./src/'))
}
const clean = () => {
  const source = fs.existsSync('./src') ? del(['./public', './dist']) : generate()
  return source
}
const copy = () => src(paths.assets).pipe(dest(paths.scripts.dest))

// file processing tasks
const compImg = () => src(paths.images.src).pipe(plumber()).pipe(imagemin()).pipe(dest(paths.images.dest))
function dataMerge() {
  return src(paths.data.src)
    .pipe(
      merge({
        fileName: 'data.json',
        edit: (json, file) => {
          // Extract the filename and strip the extension
          let filename = path.basename(file.path),
            primaryKey = filename.replace(path.extname(filename), '')
          // Set the filename in CAPS as the primary key for our JSON data
          let data = {}
          data[primaryKey.toUpperCase()] = json
          return data
        },
      })
    )
    .pipe(dest(paths.data.dest))
}
function scripts() {
  return src(paths.scripts.src)
    .pipe(plumber())
    .pipe(concat('scripts.min.js'))
    .pipe(babel())
    .pipe(terser().on('error', error => console.log(error)))
    .pipe(dest(paths.scripts.dest))
}
function styles() {
  return src(paths.theme.src)
    .pipe(plumber())
    .pipe(gulpIf(!PRODUCTION, init()))
    .pipe(
      gulpIf(
        PRODUCTION,
        SASS({
          outputStyle: 'compressed',
        }).on('error', SASS.logError),
        SASS({
          outputStyle: 'expanded',
        }).on('error', SASS.logError)
      )
    )
    .pipe(postcss(CSS_PLUGINS))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(!PRODUCTION, write('.')))
    .pipe(dest(paths.theme.dest))
    .pipe(browserSync.stream())
}
function views() {
  return src(paths.template.src)
    .pipe(data(() => JSON.parse(fs.readFileSync(paths.data.dest + '/data.json'))))
    .pipe(plumber(e => console.log(e)))
    .pipe(gulpIf(PRODUCTION, pug(), pug({ pretty: true })))
    .pipe(gulpIf(!PRODUCTION, cacheBust({ type: 'timestamp' })))
    .pipe(dest(PUBLIC_ROOT))
}

const cleanCss = () => {
  return src(paths.theme.dest + '/*.css')
    .pipe(purgeCss({ content: [PUBLIC_ROOT + '/*.html'] }))
    .pipe(dest(paths.theme.dest))
}
function watcher() {
  watch(paths.svg, series(views, browser.reload))
  watch(paths.data.src, series(dataMerge, views, browser.reload))
  watch(paths.images.src, series(compImg, browser.reload))
  watch(paths.scripts.src, series(scripts, browser.reload))
  watch(paths.theme.src, series(styles, browser.reload))
  watch(paths.template.watch, series(views, browser.reload))
  watch(paths.assets, series(copy, browser.reload))
}

exports.build = series(clean, dataMerge, copy, parallel(compImg, scripts, styles, views), cleanCss, browser.serve)
exports.default = series(clean, dataMerge, copy, parallel(compImg, scripts, styles, views), browser.serve, watcher)
exports.tasks = series(clean, dataMerge, copy, parallel(compImg, scripts, styles, views))
