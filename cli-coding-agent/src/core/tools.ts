import * as fs from "fs";
import * as path from "path";
import { spawn, type ChildProcess } from "child_process";

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export function ensureWorkspace(workspaceDir: string): void {
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
}

export function saveFile(
  workspaceDir: string,
  filename: string,
  content: string
): ToolResult {
  try {
    ensureWorkspace(workspaceDir);
    const filepath = path.join(workspaceDir, filename);
    const dir = path.dirname(filepath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, content, "utf-8");
    return {
      success: true,
      output: `File saved: ${filepath}`,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: `Failed to save file: ${err instanceof Error ? err.message : err}`,
    };
  }
}

export function readFile(workspaceDir: string, filename: string): ToolResult {
  try {
    const filepath = path.join(workspaceDir, filename);
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        output: "",
        error: `File not found: ${filename}`,
      };
    }
    const content = fs.readFileSync(filepath, "utf-8");
    return {
      success: true,
      output: content,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: `Failed to read file: ${err instanceof Error ? err.message : err}`,
    };
  }
}

export function listFiles(workspaceDir: string): ToolResult {
  try {
    ensureWorkspace(workspaceDir);
    const files = fs.readdirSync(workspaceDir);
    return {
      success: true,
      output: files.length > 0 ? files.join("\n") : "(empty)",
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: `Failed to list files: ${err instanceof Error ? err.message : err}`,
    };
  }
}

export function deleteFile(workspaceDir: string, filename: string): ToolResult {
  try {
    const filepath = path.join(workspaceDir, filename);
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        output: "",
        error: `File not found: ${filename}`,
      };
    }
    fs.unlinkSync(filepath);
    return {
      success: true,
      output: `Deleted: ${filename}`,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: `Failed to delete file: ${err instanceof Error ? err.message : err}`,
    };
  }
}

export async function runCommand(
  command: string,
  args: string[] = [],
  workspaceDir: string,
  timeoutMs: number = 30000
): Promise<ToolResult> {
  return new Promise((resolve) => {
    let resolved = false;
    let proc: ChildProcess | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeResolve = (result: ToolResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    try {
      proc = spawn(command, args, {
        cwd: workspaceDir,
        shell: true,
        stdio: ["inherit", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        safeResolve({
          success: code === 0,
          output: stdout || "(no output)",
          error: stderr || undefined,
        });
      });

      proc.on("error", (err) => {
        safeResolve({
          success: false,
          output: "",
          error: `Failed to run command: ${err.message}`,
        });
      });

      timeoutId = setTimeout(() => {
        if (!resolved && proc) {
          proc.kill("SIGTERM");
          setTimeout(() => {
            if (!resolved && proc && !proc.killed) {
              proc.kill("SIGKILL");
            }
            safeResolve({
              success: false,
              output: stdout,
              error: `Command timed out (${timeoutMs / 1000}s)`,
            });
          }, 1000);
        }
      }, timeoutMs);
    } catch (err) {
      safeResolve({
        success: false,
        output: "",
        error: `Failed to run command: ${err instanceof Error ? err.message : err}`,
      });
    }
  });
}

export function getRunner(filename: string): { cmd: string; args: string[] } | null {
  const ext = path.extname(filename).toLowerCase();

  const runners: Record<string, { cmd: string; args: string[] }> = {
    ".js": { cmd: "bun", args: [filename] },
    ".ts": { cmd: "bun", args: [filename] },
    ".tsx": { cmd: "bun", args: [filename] },
    ".jsx": { cmd: "bun", args: [filename] },
    ".py": { cmd: "python3", args: [filename] },
    ".sh": { cmd: "bash", args: [filename] },
    ".ps1": { cmd: "powershell", args: ["-File", filename] },
    ".bat": { cmd: "cmd", args: ["/c", filename] },
    ".rb": { cmd: "ruby", args: [filename] },
    ".go": { cmd: "go", args: ["run", filename] },
    ".rs": { cmd: "cargo", args: ["script", filename] },
    ".php": { cmd: "php", args: [filename] },
    ".pl": { cmd: "perl", args: [filename] },
  };

  return runners[ext] || null;
}

export async function runScript(
  workspaceDir: string,
  filename: string,
  timeoutMs: number = 30000
): Promise<ToolResult> {
  const runner = getRunner(filename);

  if (!runner) {
    return {
      success: false,
      output: "",
      error: `No runner configured for this file type: ${path.extname(filename) || "unknown"}`,
    };
  }

  const filepath = path.join(workspaceDir, filename);

  if (!fs.existsSync(filepath)) {
    return {
      success: false,
      output: "",
      error: `File not found: ${filename}`,
    };
  }

  return runCommand(runner.cmd, runner.args, workspaceDir, timeoutMs);
}