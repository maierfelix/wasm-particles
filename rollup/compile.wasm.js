const fs = require("fs");
const compiler = require("webassembly/cli/compiler");

let args = [
  "-q",
  "-o", "./wasm_tmp.wasm",
  "src/main.c"
];

module.exports = function() {
  return new Promise((resolve) => {
    compiler.main(args, (e, path) => {
      if (e) throw e;
      let data = fs.readFileSync(path);
      let code = `
        let binary = new Uint8Array([${new Uint8Array(data).toString()}]);
        export default binary;
      `;
      fs.unlinkSync(path);
      fs.writeFileSync("src/main.wasm", data);
      fs.writeFileSync("src/main.js", code, "utf-8");
      resolve();
    });
  });
};
