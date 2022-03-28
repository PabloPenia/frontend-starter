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
//sass
import dartSass from 'sass'
import gulpSass from 'gulp-sass'
import { init, write } from 'gulp-sourcemaps'
//postcss
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcss from 'gulp-postcss'
import postcssNormalize from 'postcss-normalize'
import purgeCss from 'gulp-purgecss'
// PUG
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

const PRODUCTION = yargs.argv.prod
// TODO: add wordpress argv
// TODO: add copy vendor task
const CSS_PLUGINS = [postcssNormalize(), autoprefixer(), cssnano()]
const SASS = gulpSass(dartSass)
const PUBLIC_ROOT = PRODUCTION ? './dist' : './public'
const SERVER = browserSync.create()
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
    dest: '/assets/images',
  },
  scripts: {
    src: './src/scripts/**/_*.js',
    dest: '/assets',
  },
  svg: './src/svg/**/*.svg',
  theme: {
    src: './src/styles/**/*.{scss,sass}',
    dest: '/assets',
  },
  template: {
    src: './src/templates/pages/!(_)*.pug',
    watch: './src/templates/**/*.pug',
  },
}

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
//const existe = fs.existsSync('./src')
const clean = () => {
  const source = fs.existsSync('./src') ? del(['./public', './dist']) : generate()
  return source
}
export function generate() {
  // TODO: generate wp workflow
  del(['./public', './dist'])
  return src(paths.default + '/**/*', { base: paths.default }).pipe(dest('./src/'))
}
const copy = () => src(paths.assets).pipe(dest(PUBLIC_ROOT + paths.scripts.dest))
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
const compImg = () => {
  return src(paths.images.src)
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(dest(PUBLIC_ROOT + paths.images.dest))
}
function views() {
  return src(paths.template.src)
    .pipe(data(() => JSON.parse(fs.readFileSync(paths.data.dest + '/data.json'))))
    .pipe(plumber(e => console.log(e)))
    .pipe(gulpIf(PRODUCTION, pug(), pug({ pretty: true })))
    .pipe(gulpIf(!PRODUCTION, cacheBust({ type: 'timestamp' })))
    .pipe(dest(PUBLIC_ROOT))
}
function scripts() {
  return src(paths.scripts.src)
    .pipe(plumber())
    .pipe(concat('scripts.min.js'))
    .pipe(babel())
    .pipe(terser().on('error', error => console.log(error)))
    .pipe(dest(PUBLIC_ROOT + paths.scripts.dest))
}

const styles = () => {
  return src(paths.theme.src)
    .pipe(plumber())
    .pipe(init())
    .pipe(
      SASS({
        outputStyle: 'compressed',
      }).on('error', SASS.logError)
    )
    .pipe(postcss(CSS_PLUGINS))
    .pipe(rename({ suffix: '.min' }))
    .pipe(write('.'))
    .pipe(dest(PUBLIC_ROOT + paths.theme.dest))
    .pipe(browserSync.stream())
}
const cleanCss = () => {
  return src(PUBLIC_ROOT + paths.theme.dest + '/*.css')
    .pipe(purgeCss({ content: [PUBLIC_ROOT + '/*.html'] }))
    .pipe(dest(PUBLIC_ROOT + paths.theme.dest))
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
exports.process = series(clean, dataMerge, copy, parallel(compImg, scripts, styles, views))
exports.build = series(cleanCss, browser.serve)
exports.default = series(browser.serve, watcher)
