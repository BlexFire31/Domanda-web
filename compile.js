const path = require("path");
const webpack = require("webpack");
const gulp = require("gulp");
const gulpSass = require("gulp-sass")(require("sass"));
const gulpSourcemaps = require("gulp-sourcemaps");
const fileSystem = require("fs");
const { config } = require("dotenv");
config();

fileSystem.writeFile(
  "./typescript/config.ts",
  `export const webConfig=${process.env["WEB_CONFIG"]}`,
  (error) => {
    if (error) return console.error(error);
    console.info("Wrote api key");
  }
);

const compileTypescript = (gulpCallback) => {
  webpack(
    {
      entry: "./typescript/script.ts",
      module: {
        rules: [
          {
            test: /\.ts$/,
            include: [path.resolve(__dirname, "script")],
            use: "ts-loader",
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".js"],
      },
      //devtool: "eval-source-map",
      // devtool: "eval",
      output: {
        filename: "script.js",
        path: path.resolve(__dirname, "static", "out"),
      },
      mode: "production",
    },
    (error, success) => {
      if (error) {
        console.error(error);
        console.warn("Stopped watching typescript");
        return;
      }
      console.info("Compiled typescript");
      gulpCallback?.call();
    }
  );
};
const compileSass = (gulpCallback) => {
  try {
    gulp
      .src("./sass/style.scss")
      .pipe(gulpSourcemaps.init())
      .pipe(gulpSass())
      .pipe(gulpSourcemaps.write("."))
      .pipe(gulp.dest("./static/out/"));
  } catch (error) {
    console.error(error);
    console.warn("Stopped watching sass");
    return;
  }
  console.info("Compiled sass");
  gulpCallback?.call();
};

compileSass();
compileTypescript();
if (!("DYNO" in process.env)) {
  console.info("Watching files");
  gulp.watch("./sass/**/*.scss", (callback) => {
    console.info("Re-compiling sass!");
    compileSass(callback);
  });
  gulp.watch("./typescript/**/*.ts", (callback) => {
    console.info("Re-compiling typescript!");
    compileTypescript(callback);
  });
}
