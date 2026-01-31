export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export const commandAliases: Record<string, string> = {
  "/q": "/quit",
  "/e": "/exit",
  "/quit": "/quit",
  "/exit": "/quit",
  "/h": "/help",
  "/?": "/help",
  "/c": "/clear",
  "/cls": "/clear",
  "/hist": "/history",
  "/cfg": "/config",
  "/settings": "/config",
  "/l": "/ls",
  "/dir": "/ls",
  "/list": "/ls",
  "/s": "/save",
  "/w": "/save",
  "/write": "/save",
  "/r": "/read",
  "/cat": "/cat",
  "/show": "/cat",
  "/read": "/cat",
  "/d": "/delete",
  "/del": "/delete",
  "/rm": "/delete",
  "/x": "/run",
  "/exec": "/run",
  "/sh": "/sh",
  "/$": "/sh",
  "/cmd": "/sh",
  "/shell": "/sh",
  "/m": "/model",
  "/models": "/models",
  "/retry": "/retry",
  "/r!": "/retry",
  "/st": "/status",
  "/info": "/status",
  "/cd": "/cd",
  "/chdir": "/cd",
  "/tree": "/tree",
  "/t": "/tree",
  "/add": "/add",
  "/a": "/add",
  "/include": "/add",
  "/edit": "/edit",
  "/ed": "/edit",
  "/vi": "/edit",
  "/vim": "/edit",
  "/setup": "/setup",
  "/init": "/setup",
  "/auto": "/auto",
  "/y": "/auto",
};

export function resolveCommand(cmd: string): string {
  const lower = cmd.toLowerCase();
  return commandAliases[lower] || lower;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  const matches = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  const parts = matches.map((part) => {
    if ((part.startsWith('"') && part.endsWith('"')) || 
        (part.startsWith("'") && part.endsWith("'"))) {
      return part.slice(1, -1);
    }
    return part;
  });

  const command = resolveCommand(parts[0] || "");
  const args = parts.slice(1);

  return {
    command,
    args,
    raw: trimmed,
  };
}

export interface CommandInfo {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category: "setup" | "files" | "shell" | "chat" | "other";
}

export const commandRegistry: CommandInfo[] = [
  {
    name: "/setup",
    aliases: ["/init"],
    description: "Configure API connection",
    usage: "/setup",
    category: "setup",
  },
  {
    name: "/models",
    aliases: ["/model", "/m"],
    description: "Select AI model",
    usage: "/models",
    category: "setup",
  },
  {
    name: "/status",
    aliases: ["/st", "/info"],
    description: "Show current settings",
    usage: "/status",
    category: "setup",
  },
  {
    name: "/config",
    aliases: ["/cfg", "/settings"],
    description: "Show config file location",
    usage: "/config",
    category: "setup",
  },
  {
    name: "/ls",
    aliases: ["/l", "/dir", "/list"],
    description: "List directory contents",
    usage: "/ls [path]",
    category: "files",
  },
  {
    name: "/tree",
    aliases: ["/t"],
    description: "Show directory tree",
    usage: "/tree [path]",
    category: "files",
  },
  {
    name: "/cat",
    aliases: ["/read", "/show", "/r"],
    description: "View file contents",
    usage: "/cat <file>",
    category: "files",
  },
  {
    name: "/add",
    aliases: ["/a", "/include"],
    description: "Add file to conversation context",
    usage: "/add <file>",
    category: "files",
  },
  {
    name: "/edit",
    aliases: ["/ed", "/vi", "/vim"],
    description: "Edit file in $EDITOR",
    usage: "/edit <file>",
    category: "files",
  },
  {
    name: "/run",
    aliases: ["/x", "/exec"],
    description: "Execute a script file",
    usage: "/run <file>",
    category: "shell",
  },
  {
    name: "/sh",
    aliases: ["/shell", "/cmd", "/$"],
    description: "Run shell command",
    usage: "/sh <command>",
    category: "shell",
  },
  {
    name: "/cd",
    aliases: ["/chdir"],
    description: "Change working directory",
    usage: "/cd <path>",
    category: "shell",
  },
  {
    name: "/clear",
    aliases: ["/c", "/cls"],
    description: "Clear conversation history",
    usage: "/clear",
    category: "chat",
  },
  {
    name: "/retry",
    aliases: ["/r!"],
    description: "Retry last message",
    usage: "/retry",
    category: "chat",
  },
  {
    name: "/auto",
    aliases: ["/y"],
    description: "Toggle auto-accept file saves",
    usage: "/auto",
    category: "chat",
  },
  {
    name: "/help",
    aliases: ["/h", "/?"],
    description: "Show this help",
    usage: "/help",
    category: "other",
  },
  {
    name: "/quit",
    aliases: ["/q", "/e", "/exit"],
    description: "Exit Cody",
    usage: "/quit",
    category: "other",
  },
];