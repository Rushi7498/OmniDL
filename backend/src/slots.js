import { AppError } from "./config.js";

// Preview requests wait their turn instead of competing with extraction jobs.
export function createSlots(limit, maxWaiting = 60) {
  let active = 0;
  const queue = [];
  function release() {
    active--;
    queue.shift()?.start();
  }
  return (signal) =>
    new Promise((resolve, reject) => {
      if (signal.aborted)
        return reject(new AppError("Request cancelled.", 408));
      const entry = {
        start() {
          signal.removeEventListener("abort", abort);
          active++;
          resolve(release);
        },
      };
      const abort = () => {
        const index = queue.indexOf(entry);
        if (index !== -1) queue.splice(index, 1);
        reject(new AppError("Request cancelled.", 408));
      };
      if (active < limit) entry.start();
      else if (queue.length >= maxWaiting)
        reject(new AppError("Previews are busy. Try again shortly.", 503));
      else {
        queue.push(entry);
        signal.addEventListener("abort", abort, { once: true });
      }
    });
}
