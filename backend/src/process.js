import { spawn } from "node:child_process";
import { AppError, config } from "./config.js";
export function run(
  binary,
  args,
  { signal, maxOutput = 12 * 1024 * 1024 } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_PROXY: "", no_proxy: "" },
      signal,
    });
    let output = "",
      error = "",
      bytes = 0;
    const timer = setTimeout(() => child.kill("SIGKILL"), config.timeout);
    child.stdout.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxOutput) child.kill("SIGKILL");
      else output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      error = (error + chunk).slice(-4000);
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(
        new AppError(
          e.code === "ENOENT"
            ? `Required tool ${binary} is not installed. See setup instructions.`
            : "Media processing was interrupted.",
          503,
        ),
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else
        reject(
          new AppError(
            /login|sign in|cookie|private|age.restrict|bot/i.test(error)
              ? "This post requires platform access or is restricted. Try another public link."
              : "Unable to extract or process this media. The source may be unavailable or unsupported.",
            422,
          ),
        );
    });
  });
}
