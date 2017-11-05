import json from "rollup-plugin-json";

export default {
  entry: "src/index.js",
  moduleName: "iroh",
  external: [],
  plugins: [
    json()
  ]
};
