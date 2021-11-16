const { src, dest, watch, series, parallel } = require("gulp")
const concat = require("gulp-concat")
// const cheerio = require("gulp-cheerio") // Jquery syntax
// const imagemin = require("gulp-imagemin")
const pug = require("gulp-pug") //temlating
const plumber = require("gulp-plumber")
const rename = require("gulp-rename")
const replace = require("gulp-replace")
const sass = require("gulp-sass")(require("sass"))
sass.compiler = require("sass") // fix for dart-sass
const sourcemaps = require("gulp-sourcemaps")
// const svgmin = require("gulp-svgmin") // svg minification
// const svgstore = require("gulp-svgstore") // svg combine
const terser = require("gulp-terser")
//postCSS stuff
const postcss = require("gulp-postcss")
const autoprefixer = require("autoprefixer")
// const cssnano = require("cssnano")
const postcssNormalize = require("postcss-normalize")
// Files Paths
const paths = {
  cache: {
    src: ["./dist/**/*.html"],
    dest: "./dist/",
  },
  images: {
    src: ["./src/images/**/*"],
    svg: ["./src/svg/**/*"],
    dest: "./dist/assets/images/",
  },

  scripts: {
    src: ["./src/scripts/**/_*.js"],
    dest: "./dist/assets/",
    srcVendor: ["./src/scripts/**/!(_)*.js"],
    destVendor: "./dist/assets/",
  },
  theme: {
    /* +(scss|sass) */
    src: ["./src/theme/**/*.{scss,sass}"],
    dest: "./dist/assets/",
  },
  template: {
    src: ["./src/templates/pages/!(_)*.pug"],
    dest: "./dist/",
    watch: ["./src/templates/**/*.pug"],
  },
}

function cacheCleaner() {
  return src(paths.cache.src)
    .pipe(replace(/cache=\d+/g, "cache=" + new Date().getTime()))
    .pipe(dest(paths.cache.dest))
}

// function imgOptimizer() {
//   return src(paths.images.src)
//     .pipe(imagemin().on("error", (error) => console.log(error)))
//     .pipe(dest(paths.images.dest))
// }

function pageBuilder() {
  return src(paths.template.src)
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
  var plugins = [postcssNormalize(), autoprefixer()] /* , cssnano() */
  return src(paths.theme.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(plugins))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.theme.dest))
}

// function svgSpriter() {
//   return src(paths.images.svg)
//     .pipe(svgmin())
//     .pipe(
//       svgstore({
//         fileName: "sprite.svg",
//       })
//     )
//     .pipe(
//       cheerio({
//         run: function ($) {
//           $("[fill]").removeAttr("fill")
//         },
//         parserOptions: {
//           xmlMode: true,
//         },
//       })
//     )
//     .pipe(dest(paths.images.dest))
// }

function watcher() {
  // watch(paths.images.src, imgOptimizer);
  // watch(paths.images.svg, svgSpriter);
  watch(paths.scripts.src, parallel(scriptsBuilder, copyLib, cacheCleaner))
  watch(paths.template.watch, series(pageBuilder, cacheCleaner))
  watch(paths.theme.src, parallel(themeBuilder, cacheCleaner))
}

// exports.imgOptimizer = imgOptimizer
exports.pageBuilder = pageBuilder
exports.cacheCleaner = cacheCleaner
exports.scriptsBuilder = scriptsBuilder
exports.copyLib = copyLib
// exports.svgSpriter = svgSpriter
exports.themeBuilder = themeBuilder
exports.watcher = watcher
exports.default = series(
  parallel(scriptsBuilder, copyLib, pageBuilder, themeBuilder),
  cacheCleaner,
  watcher
)
// exports.default = series(
//   parallel(imgOptimizer, svgSpriter, pageBuilder, scriptsBuilder, themeBuilder),
//   cacheCleaner, watcher);
