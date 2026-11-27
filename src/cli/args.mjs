export function parseArgs(argv, { flags = [], options = [] } = {}) {
  const out = { _: [], flags: {}, options: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split("=", 2);
      if (flags.includes(key)) out.flags[key] = true;
      else if (options.includes(key)) {
        const value = inline ?? argv[++i];
        if (value === undefined) throw new Error(`--${key} needs a value`);
        out.options[key] = value;
      } else throw new Error(`unknown option --${key}`);
    } else out._.push(a);
  }
  return out;
}
