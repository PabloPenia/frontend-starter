const { src, dest, watch, series, parallel } = require("gulp")
const autoprefixer = require("autoprefixer")
const sass = require("gulp-sass")(require("sass"))
sass.compiler = require("sass") // fix for dart-sass
const concat = require("gulp-concat")
// const cssnano = require("cssnano")
const data = require("gulp-data")
const fs = require("fs")
const path = require('path')
const merge = require('gulp-merge-json')
const plumber = require("gulp-plumber")
const postcss = require("gulp-postcss")
const postcssNormalize = require("postcss-normalize")
const pug = require("gulp-pug")
const rename = require("gulp-rename")
const replace = require("gulp-replace")
const sourcemaps = require("gulp-sourcemaps")
const terser = require("gulp-terser")

const paths = {
  cache: {
    src: "./dist/**/*.html",
    dest: "./dist/"
  },
  data: {
    src: "./src/data/files/**/*.json",
    dest: "./src/data",
    merged: "./src/data/data.json"
  },
  scripts: {
    src: "./src/scripts/**/_*.js",
    dest: "./dist/assets/",
    srcVendor: "./src/scripts/**/!(_)*.js",
    destVendor: "./dist/assets/"
  },
  svg: "./src/svg/**/*.svg",
  theme: {
    src: "./src/theme/**/*.{scss,sass}",
    dest: "./dist/assets/"
  },
  template: {
    src: "./src/templates/pages/!(_)*.pug",
    dest: "./dist/",
    watch: "./src/templates/**/*.pug"
  }
}

function cacheCleaner() {
  return src(paths.cache.src)
    .pipe(replace(/cache=\d+/g, "cache=" + new Date().getTime()))
    .pipe(dest(paths.cache.dest))
}

function dataMerge () {
  return src(paths.data.src)
      .pipe(merge({
          fileName: 'data.json',
          edit: (json, file) => {
              // Extract the filename and strip the extension
              let filename = path.basename(file.path),
                  primaryKey = filename.replace(path.extname(filename), '');

              // Set the filename in CAPS as the primary key for our JSON data
              let data = {};
              data[primaryKey.toUpperCase()] = json;

              return data;
          }
      }))
      .pipe(dest(paths.data.dest));
}

function pageBuilder() {
  return src(paths.template.src)
    .pipe(data(function() {
      return JSON.parse(fs.readFileSync(paths.data.merged))
    }))
    .pipe(plumber())
    .pipe(pug({ pretty: true }))
    .pipe(dest(paths.template.dest))
}

function scriptsBuilder() {
  return src(paths.scripts.src)
    .pipe(concat("app.js"))
    .pipe(sourcemaps.init())
    .pipe(terser().on("error", (error) => console.log(error)))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.scripts.dest))
}

function copyLib() {
  return src(paths.scripts.srcVendor)
    .pipe(dest(paths.scripts.destVendor))
}

function themeBuilder() {
  const plugins = [postcssNormalize(), autoprefixer()]
  /* const plugins = [postcssNormalize(), autoprefixer(), cssnano()] */
  return src(paths.theme.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(plugins))
    /* .pipe(rename({ suffix: ".min" })) */
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.theme.dest))
}

function watcher() {
  watch(paths.data.src, series(dataMerge, pageBuilder, cacheCleaner))
  watch(paths.scripts.src, series(parallel(scriptsBuilder, copyLib), cacheCleaner))
  watch(paths.svg, series(pageBuilder, cacheCleaner))
  watch(paths.theme.src, series(themeBuilder, cacheCleaner))
  watch(paths.template.watch, series(pageBuilder, cacheCleaner))
}

exports.dataMerge = dataMerge
exports.pageBuilder = pageBuilder
exports.cacheCleaner = cacheCleaner
exports.scriptsBuilder = scriptsBuilder
exports.copyLib = copyLib
exports.themeBuilder = themeBuilder
exports.watcher = watcher
exports.default = series(
  dataMerge,
  parallel(scriptsBuilder, copyLib, pageBuilder, themeBuilder),
  cacheCleaner,
  watcher
)