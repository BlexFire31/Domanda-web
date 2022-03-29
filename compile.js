const path = require('path')
const webpack = require('webpack')
const gulp = require('gulp')
const gulpSass = require('gulp-sass')(require('sass'))
const gulpSourcemaps = require('gulp-sourcemaps')
const gulpRename = require('gulp-rename')
const fileSystem = require('fs')
const { config } = require('dotenv')
const { dir } = require('console')
config()

fileSystem.writeFile(
  path.resolve(__dirname, 'frontend', 'script', 'config.ts'),
  `export default ${process.env['WEB_CONFIG']}`,
  (error) => {
    if (error) return console.error(error)
    console.info('Wrote api key')
  }
)

const compileTypescript = (gulpCallback) => {
  webpack(
    {
      entry: path.resolve(__dirname, 'frontend', 'script', 'index.ts'),
      module: {
        rules: [
          {
            test: /\.ts$/,
            include: [path.resolve(__dirname, 'frontend', 'script')],
            use: 'ts-loader',
          },
        ],
      },
      resolve: {
        extensions: ['.ts', '.js'],
      },
      // devtool: "eval-source-map",
      // devtool: "eval",
      output: {
        filename: 'script.js',
        path: path.resolve(__dirname, 'frontend', 'public'),
      },
      mode: 'production',
    },
    (error, success) => {
      if (error) {
        console.error(error)
        console.warn('Stopped watching typescript')
        return
      }
      console.info('Compiled typescript')
      gulpCallback?.()
    }
  )
}

const compileSass = (gulpCallback) => {
  try {
    gulp
      .src(path.resolve(__dirname, 'frontend', 'styles', 'index.scss'))
      .pipe(gulpSourcemaps.init())
      .pipe(gulpSass())
      .pipe(gulpRename('style.css'))
      .pipe(gulpSourcemaps.write('.'))
      .pipe(gulp.dest(path.resolve(__dirname, 'frontend', 'public')))
    console.info('Compiled sass')
    gulpCallback?.()
  } catch (error) {
    console.error(error)
    console.warn('Stopped watching sass')
  }
}

function moveAssets(gulpCallback, assetFolder) {
  const baseDir = path.resolve(__dirname, 'frontend')
  try {
    gulp
      .src(`${baseDir}/${assetFolder}/**/*.*`, { base: baseDir })
      .pipe(gulp.dest(`${baseDir}/public/`))
    console.info(`Moved ${assetFolder}`)
  } catch (err) {
    console.error(err)
    console.warn(`Moving ${assetFolder} failed`)
  }
  gulpCallback?.()
}

compileSass()
compileTypescript()
moveAssets(null, 'fonts')
moveAssets(null, 'images')

if (!('DYNO' in process.env)) {
  console.info('Watching files')
  gulp.watch('./script/**/*.scss', (callback) => {
    console.info('Re-compiling sass!')
    compileSass(callback)
  })
  gulp.watch('./script/**/*.ts', (callback) => {
    console.info('Re-compiling typescript!')
    compileTypescript(callback)
  })

  gulp.watch('./frontend/fonts/**/*.*', (callback) => {
    moveAssets(callback, 'fonts')
  })
  gulp.watch('./frontend/images/**/*.*', (callback) => {
    moveAssets(callback, 'images')
  })
}
