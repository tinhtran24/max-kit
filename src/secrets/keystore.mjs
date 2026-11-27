import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SERVICE = "max-kit-vault";

export const vaultDir = () => process.env.MK_VAULT_DIR || path.join(os.homedir(), ".max-kit", "vault");

function run(cmd, args, input) {
  return execFileSync(cmd, args, { input, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
}

function has(cmd) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const BACKENDS = {
  keychain: {
    available: () => process.platform === "darwin" && has("security"),
    read: (account) => {
      try {
        return run("security", ["find-generic-password", "-s", SERVICE, "-a", account, "-w"]);
      } catch {
        return null;
      }
    },
    write: (account, key) => run("security", ["add-generic-password", "-U", "-s", SERVICE, "-a", account, "-w", key])
  },
  "secret-tool": {
    available: () => process.platform === "linux" && has("secret-tool") && Boolean(process.env.DBUS_SESSION_BUS_ADDRESS),
    read: (account) => {
      try {
        return run("secret-tool", ["lookup", "service", SERVICE, "account", account]) || null;
      } catch {
        return null;
      }
    },
    write: (account, key) => run("secret-tool", ["store", "--label", "max-kit vault key", "service", SERVICE, "account", account], key)
  },
  dpapi: {
    available: () => process.platform === "win32",
    read: (account) => {
      const file = path.join(vaultDir(), `${account}.dpapi`);
      if (!fs.existsSync(file)) return null;
      const ps = `$s = Get-Content -Raw '${file}' | ConvertTo-SecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))`;
      return run("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
    },
    write: (account, key) => {
      const file = path.join(vaultDir(), `${account}.dpapi`);
      const ps = `$k = [Console]::In.ReadToEnd().Trim(); ConvertTo-SecureString $k -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -NoNewline '${file}'`;
      run("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], key);
    }
  },
  file: {
    available: () => true,
    read: (account) => {
      const file = path.join(vaultDir(), `${account}.key`);
      return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
    },
    write: (account, key) => {
      const file = path.join(vaultDir(), `${account}.key`);
      fs.writeFileSync(file, key, { mode: 0o600 });
      fs.chmodSync(file, 0o600);
    }
  }
};

export function backendName() {
  const forced = process.env.MK_VAULT_BACKEND;
  if (forced) {
    if (!BACKENDS[forced]) throw new Error(`unknown MK_VAULT_BACKEND "${forced}"; use ${Object.keys(BACKENDS).join(", ")}`);
    return forced;
  }
  return Object.keys(BACKENDS).find((b) => BACKENDS[b].available());
}

export function masterKey({ create = true } = {}) {
  fs.mkdirSync(vaultDir(), { recursive: true, mode: 0o700 });
  const name = backendName();
  const backend = BACKENDS[name];
  let encoded = backend.read("master");
  if (!encoded) {
    if (!create) return { key: null, backend: name };
    encoded = crypto.randomBytes(32).toString("base64");
    backend.write("master", encoded);
    if (backend.read("master") !== encoded) throw new Error(`could not store the vault key with backend ${name}`);
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error(`vault key from backend ${name} is malformed`);
  return { key, backend: name };
}

export function seal(key, plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

export function open(key, box) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(box.iv, "base64"));
  decipher.setAuthTag(Buffer.from(box.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(box.data, "base64")), decipher.final()]).toString("utf8");
}
