export function parseArgs(argv, { flags = [], options = [], multi = [] } = {}) {
  const out = { _: [], flags: {}, options: {}, rest: [] };
  for (const m of multi) out.options[m] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      out.rest = argv.slice(i + 1);
      break;
    }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const key = eq === -1 ? a.slice(2) : a.slice(2, eq);
      const inline = eq === -1 ? undefined : a.slice(eq + 1);
      if (flags.includes(key)) out.flags[key] = true;
      else if (options.includes(key) || multi.includes(key)) {
        const value = inline ?? argv[++i];
        if (value === undefined) throw new Error(`--${key} needs a value`);
        if (multi.includes(key)) out.options[key].push(value);
        else out.options[key] = value;
      } else throw new Error(`unknown option --${key}`);
    } else out._.push(a);
  }
  return out;
}
