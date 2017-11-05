const pkg = require("../package.json");
import config from "./rollup.config";

config.format = "cjs";
config.dest = pkg.main;
config.paths = {};

export default config;
