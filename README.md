# frontend-starter

This is a simple and automated starter package to work with pug and sass on static pages, can be extended for more complex workflows.

# How to Install

1. Install [NodeJs](https://nodejs.dev/learn/how-to-install-nodejs)
2. Clone this repo and open a cli in the root folder
3. Run:

   - `npm install`
   - `npm update`

4. First run:

- `npm start`

## Included scripts

1. `npm run generate` Generate the structure for source code, usefull to reset original source files.
2. `npm start` - Run all common tasks

- On first run or if 'src' folder has been deleted, generates the structure of source code.
- Clean old processed files
- Process all files (JSON data, pug, sass, scripts images, etc)
- Start local server with browser sync.
- Start to watch for changes on 'src' folder.

3. `npm run build` Create the final build, and serve its files
4. `npm run tasks` and `run tasks-prod` Process all files without serving or watching changes.
