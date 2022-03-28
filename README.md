Actually this package is in development, some info can be outdated.

# frontend-starter

This is a simple and automated starter package to work with pug and sass on static pages, can be extended for more complex workflows.

### What’s in here?

- Contains the folder structure for styles, scripts, templates and data to use as a starter point on any work. Styles structure is based on SMACSS and the 7-1 pattern with some personal modifications. Templates and the other folders are meant to follow a similar pattern.
- Some 3rd party libraries like modernizr
- Contains prebuilt common tasks using gulp.
- I've included a few snippets and mixins, that I use often.
- A very basic starter template
- Some svg icons.

Extended info about what is inside at the end of this readme.

# How to Install

1. Install [NodeJs](https://nodejs.dev/learn/how-to-install-nodejs)
2. Clone this repo and open a cli in the root folder
3. Run:

   - `npm install`
   - `npm update`

4. First run:

- `npm start`

## Included scripts

1. `npm run generate` Generate the structure for source code. Actually there's no need to run this command manually, but will be handly in next updates. Usefull to reset original source files.
2. `npm start` - Run all common tasks

- On first run or if 'src' folder has been deleted, generates the structure of source code.
- Clean old processed files
- Process all files (JSON data, pug, sass, scripts images, etc)
- Start local server with browser sync.
- Start to watch for changes on 'src' folder.

3. `npm run process` Process all source files (data, styles, scripts, etc)
4. `npm run build` Create the final build, and serve its files

# Following Info is deprecated, please wait until next update

## Dependencies

soon

### Theming

All files are written in dart-sass using sass syntax, maps in scss syntax (for better readability). You can find these files in src/theme.

Normalize.css is included by default, if you don't want to use normalize delete this line in src/theme/base/\_reset.sass:
`@import-normalize`

**Default content**

- Color pallete, functions and sass variables: src/theme/abstracts
- Resets and some tools src/theme/base/\_reset.sass
- Mixins, extends, and more base styles src/theme/base
- Basic layout for starter theme: src/theme/layout

All sass files are compiled to dist/assets/theme.css, if you want to use a minified version uncomment the two lines in themeBuilder function (gulpfile.js)

### Templating

Html files are compiled from PUG, you can find the files in src/templates. Starter template uses src/templates/template.pug. All files in this folder are watched for compilation but only files in src/templates/pages will be compiled.

For example:

- src/templates/pages/index.pug will be compiled to dist/index.html
- src/templates/pages/contact.pug will be compiled to dist/contact.html

### JSON data

Templates use JSON data instead of hardcoded texts, this data is stored in src/data/files folder, and merged to src/data/files/data.json file during compilation using the name of the file in data/files folder as key of each object in caps.

**For example:** Categories are stored in the file "data/files/config.json" in the object "cat", you can access to categories with this name: CONFIG.cat (in data/data.json file).

If you add a new file data/files/fooBar.json with this content:

`{`
`"bar": "bar",`
`"foo": "foo"`
`}`

will be merged to data/data.json file as:

`{`
`"FOOBAR":`
`{`
`"bar": "bar",`
`"foo": "foo"`
`}`
`}`

## Scripting

Javascript files are stored in src/scripts folder, all files starting with underscore (\_) will be merged to dist/assets/app.min.js. Files in src/scripts/vendor folder will be **copied** to dist/assets/vendor folder. Use vendor folder to add any javascript librarie you want to use, by default I added font-awesome, modernizr and jquery, on it's default versions, probably you want to change modernizr for a custom version.

## Svg Files

in src/svg you will find an empty folder "filters" and sprite.svg, the sprite is already included in pug tamplate at the start of the markdown, and set to `display: none` in theme/base/\_reset.sass.

- sprite.svg contains some icons as default free icons from [The Noun Project](https://thenounproject.com) , add your own svgs following the defs/symbol pattern in the sprite. If you use "name-icon" as id of these symbols you can easily add icons to your template using a mixin that is already included in templates/abstracts/\_common.pug.

**For example:** if your svg symbol id is "#fooBar-icon", you can add it to your template as:

`+svg('fooBar')`

That's all! There are more mixins and tools already written for svg icons, check in templates/abstracts/common.pug and theme/base/icons.sass

I use the "filters" folder to add svg filters independant of the sprite. In template pug add `include ../../svg/filters/foo.svg` before the element which need this filter and then setup the filter in sass: `filter: url('#id-from-the-filter')`.

## Watch tasks

**Template compilation happens when**: you change any pug, svg or json file. After this, a cache cleaner will be triggered (but there's some issues with cache cleaning, probably you need to refresh browser one time for pug files)
**JSON merge happens when**: You change a json file.
**Theme compilation happens when**: You change a sass file. After this a cache cleaning is triggered. To make work the cleaning on theme files add "?cache=12672" (any number) to the end of your stylesheet url in index.pug, is already setted this, but if you add new stylesheet take care of this, otherwise cache cleaning won't work.
**Scripts merge happens when**: You change a js file which name starts in underscore "\_example.js".

You can run all these tasks as once by "gulp" command
`gulp`

Check gulpfile.js for more information.
