export function filesOf(tool) {
  if (Array.isArray(tool.files) && tool.files.length) return tool.files;
  if (!tool.filePath) return [];
  return [{ path: tool.filePath, op: tool.kind === "write" ? "write" : "update" }];
}

export const CREATES = new Set(["add", "write"]);
