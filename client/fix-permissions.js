// This ONLY runs the chmod command on Linux (Render).
// It does nothing on Windows (local dev).

const { execSync } = require("child_process");
const os = require("os");

if (os.platform() !== "win32") {
  try {
    execSync("chmod +x node_modules/.bin/react-scripts");
    console.log("Permissions fixed for react-scripts");
  } catch (err) {
    console.log("Could not fix react-scripts permissions, but continuing...");
  }
} else {
  console.log("Windows detected — skipping chmod.");
}
