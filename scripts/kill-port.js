import { exec } from 'child_process';
import { platform } from 'os';

const PORT = 1420;

function killPort() {
  return new Promise((resolve) => {
    if (platform() === 'win32') {
      // Windows: find and kill process using the port
      exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve(); // Port not in use
          return;
        }

        // Extract PIDs from netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            pids.add(pid);
          }
        }

        if (pids.size === 0) {
          resolve();
          return;
        }

        // Kill each PID
        let killed = 0;
        for (const pid of pids) {
          exec(`taskkill /F /PID ${pid}`, () => {
            killed++;
            if (killed === pids.size) {
              setTimeout(resolve, 500); // Wait a bit for port to be released
            }
          });
        }
      });
    } else {
      // Unix-like systems
      exec(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, () => {
        resolve();
      });
    }
  });
}

killPort().then(() => {
  console.log(`Port ${PORT} is ready`);
});
