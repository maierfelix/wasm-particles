export function mergeObjects(a, b) {
  console.assert(a instanceof Object);
  console.assert(b instanceof Object);
  for (let key in b) {
    a[key] = b[key];
  };
};

export function roundTo(a, b) {
  let n = 1 / b;
  return (Math.round(a * n) / n);
};

export function load(buffer, options) {

  options || (options = {});

  var imports = options.imports || {};

  var memory = imports.memory;
  if (!memory) {
    var opts = { initial: options.initialMemory || 1 };
    if (options.maximumMemory)
        opts.maximum = options.maximumMemory;
    memory = new WebAssembly.Memory(opts);
    memory.initial = options.initialMemory || 1;
    memory.maximum = options.maximumMemory;
  }

  var table = imports.table;
  if (!table)
    table = new WebAssembly.Table({ initial: 0, element: "anyfunc" });

  function grow() {
    var buf = memory.buffer;
    memory.U8  = new Uint8Array  (buf);
    memory.S32 = new Int32Array  (buf);
    memory.U32 = new Uint32Array (buf);
    memory.F32 = new Float32Array(buf);
    memory.F64 = new Float64Array(buf);
    if (imports.ongrow) imports.ongrow();
  }

  grow();

  function getInt(ptr) {
    return memory.S32[ptr >> 2];
  }

  memory.getInt = getInt;

  function getUint(ptr) {
      return memory.U32[ptr >> 2];
  }

  memory.getUint = getUint;

  function getFloat(ptr) {
      return memory.F32[ptr >> 2];
  }

  memory.getFloat = getFloat;

  function getDouble(ptr) {
      return memory.F64[ptr >> 3];
  }

  memory.getDouble = getDouble;

  function getString(ptr) {
      var start = (ptr >>>= 0);
      while (memory.U8[ptr++]);
      getString.bytes = ptr - start;
      return String.fromCharCode.apply(null, memory.U8.subarray(start, ptr - 1));
  }

  memory.getString = getString;

  var env = {};

  env.memoryBase = imports.memoryBase || 0;
  env.memory = memory;
  env.tableBase = imports.tableBase || 0;
  env.table = table;

  function sprintf(ptr, base) {
      var s = getString(ptr);
      return base
          ? s.replace(/%([dfisu]|lf)/g, ($0, $1) => {
              var val;
              return base +=
                  $1 === "u"  ? (val = getUint(base), 4)
                : $1 === "f"  ? (val = getFloat(base), 4)
                : $1 === "s"  ? (val = getString(getUint(base)), 4)
                : $1 === "lf" ? (val = getDouble(base), 8)
                :               (val = getInt(base), 4)
                , val;
          })
          : s;
  }

  Object.getOwnPropertyNames(console).forEach(key => {
      if (typeof console[key] === "function")
          env["console_" + key] = (ptr, base) => {
              console[key](sprintf(ptr, base));
          };
  });

  Object.getOwnPropertyNames(Math).forEach(key => {
      if (typeof Math[key] === "function")
          env["Math_" + key] = Math[key];
  });

  Object.keys(imports).forEach(key => env[key] = imports[key]);

  if (!env._abort)
      env._abort = errno => { throw Error("abnormal abort in " + file + ": " + errno); };
  if (!env._exit)
      env._exit = code => { if (code) throw Error("abnormal exit in " + file + ": " + code); }

  env._grow = grow;

  return WebAssembly.instantiate(buffer, { env: env })
  .then(module => {
    var instance = module.instance;
    instance.imports = imports;
    instance.memory = memory;
    instance.env = env;
    return instance;
  });
};
