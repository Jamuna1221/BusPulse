import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct CSV path
const CSV_PATH = path.join(__dirname, "../data/routes/SETC.csv");

let services = [];

/**
 * Load SETC CSV into memory
 * Each departure timing = one bus service
 */
export function loadCSV() {
  return new Promise((resolve, reject) => {
    const result = [];

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        const timingsRaw = row["Departure Timings"];

        if (!timingsRaw) return;

        const timings = timingsRaw
          .toString()
          .split(",")
          .map(t => t.trim());

        timings.forEach(time => {
          result.push({
            route: row["Route No."],
            from: row["From"],
            to: row["To"],
            depot: row["Depot"],
            routeLengthKm: Number(row["Route Length"]),
            departureTime: time
          });
        });
      })
      .on("end", () => {
        services = result;
        console.log(`✅ Loaded ${services.length} services from SETC CSV`);
        resolve();
      })
      .on("error", reject);
  });
}

export function getServices() {
  return services;
}
