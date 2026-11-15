import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface AgentDiskBundle {
  agentId: string;
  folderPath: string;
  agentMd: string;
  notesMd: string;
  tasks: unknown[];
  receipts: unknown[];
  specs: Record<string, string>;
}

function readJsonSafe(filePath: string): unknown[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Fallback to empty array if malformed
  }
  return [];
}

function readTextSafe(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch {
    // Fallback to empty string
  }
  return '';
}

function collectAgentFolders(agentsRoot: string): AgentDiskBundle[] {
  const bundles: AgentDiskBundle[] = [];
  if (!fs.existsSync(agentsRoot)) return bundles;

  const topEntries = fs.readdirSync(agentsRoot, { withFileTypes: true });
  for (const entry of topEntries) {
    if (!entry.isDirectory()) continue;
    const topDir = path.join(agentsRoot, entry.name);
    bundles.push(readSingleAgentFolder(entry.name, topDir, entry.name));

    // Check for workers/ subdirectory (B3 workers)
    const workersDir = path.join(topDir, 'workers');
    if (fs.existsSync(workersDir) && fs.statSync(workersDir).isDirectory()) {
      const workerEntries = fs.readdirSync(workersDir, { withFileTypes: true });
      for (const wEntry of workerEntries) {
        if (!wEntry.isDirectory()) continue;
        const wDir = path.join(workersDir, wEntry.name);
        const relPath = `${entry.name}/workers/${wEntry.name}`;
        bundles.push(readSingleAgentFolder(wEntry.name, wDir, relPath));
      }
    }
  }
  return bundles;
}

function readSingleAgentFolder(agentId: string, absDir: string, relFolderPath: string): AgentDiskBundle {
  const profileOrAgentMd = fs.existsSync(path.join(absDir, 'PROFILE.md'))
    ? readTextSafe(path.join(absDir, 'PROFILE.md'))
    : readTextSafe(path.join(absDir, 'AGENT.md'));
  const notesMd = readTextSafe(path.join(absDir, 'NOTES.md'));
  const tasks = readJsonSafe(path.join(absDir, 'TASKS.json'));
  const receipts = readJsonSafe(path.join(absDir, 'RECEIPTS.json'));

  const specs: Record<string, string> = {};
  const specsDir = path.join(absDir, 'SPECS');
  if (fs.existsSync(specsDir) && fs.statSync(specsDir).isDirectory()) {
    for (const file of fs.readdirSync(specsDir)) {
      if (file.endsWith('.md')) {
        specs[file] = readTextSafe(path.join(specsDir, file));
      }
    }
  }

  return {
    agentId,
    folderPath: relFolderPath,
    agentMd: profileOrAgentMd,
    notesMd,
    tasks,
    receipts,
    specs,
  };
}

function resolveAgentDir(agentsRoot: string, agentIdOrFolder: string): string | null {
  const directCandidate = path.join(agentsRoot, agentIdOrFolder);
  if (fs.existsSync(directCandidate) && fs.statSync(directCandidate).isDirectory()) {
    return directCandidate;
  }
  // Search inside b2-*/workers/<agentId>
  if (!fs.existsSync(agentsRoot)) return null;
  for (const entry of fs.readdirSync(agentsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const workerCandidate = path.join(agentsRoot, entry.name, 'workers', agentIdOrFolder);
    if (fs.existsSync(workerCandidate) && fs.statSync(workerCandidate).isDirectory()) {
      return workerCandidate;
    }
  }
  return null;
}

function parseRequestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? (JSON.parse(body) as Record<string, unknown>) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

function agentFilesystemApiPlugin(): Plugin {
  return {
    name: 'agent-filesystem-api',
    configureServer(server) {
      const rootDir = process.cwd();
      const agentsRoot = path.join(rootDir, 'agents');
      const memoryMdPath = path.join(rootDir, 'MEMORY.md');

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/agents')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');

        try {
          if (req.method === 'GET' && urlObj.pathname === '/api/agents') {
            const bundles = collectAgentFolders(agentsRoot);
            const memoryMd = readTextSafe(memoryMdPath);
            return sendJson(res, 200, {
              ok: true,
              timestamp: new Date().toISOString(),
              agents: bundles,
              memoryMd,
            });
          }

          if (req.method === 'POST' && urlObj.pathname === '/api/agents/task') {
            const body = await parseRequestBody(req);
            const agentId = String(body.agentId || '');
            const task = body.task as Record<string, unknown> | undefined;
            const receipt = body.receipt as Record<string, unknown> | undefined;
            const noteLine = typeof body.noteLine === 'string' ? body.noteLine : '';

            const targetDir = resolveAgentDir(agentsRoot, agentId);
            if (!targetDir || !task) {
              return sendJson(res, 400, { ok: false, error: `Invalid agentId (${agentId}) or missing task payload` });
            }

            // 1. Update TASKS.json
            const tasksPath = path.join(targetDir, 'TASKS.json');
            const existingTasks = readJsonSafe(tasksPath) as Array<Record<string, unknown>>;
            const idx = existingTasks.findIndex((t) => t.id === task.id);
            if (idx >= 0) {
              existingTasks[idx] = { ...existingTasks[idx], ...task };
            } else {
              existingTasks.unshift(task);
            }
            fs.writeFileSync(tasksPath, JSON.stringify(existingTasks, null, 2) + '\n', 'utf-8');

            // 2. Update RECEIPTS.json if receipt provided
            if (receipt) {
              const receiptsPath = path.join(targetDir, 'RECEIPTS.json');
              const existingReceipts = readJsonSafe(receiptsPath) as Array<Record<string, unknown>>;
              const rIdx = existingReceipts.findIndex((r) => r.id === receipt.id);
              if (rIdx >= 0) {
                existingReceipts[rIdx] = { ...existingReceipts[rIdx], ...receipt };
              } else {
                existingReceipts.unshift(receipt);
              }
              fs.writeFileSync(receiptsPath, JSON.stringify(existingReceipts, null, 2) + '\n', 'utf-8');
            }

            // 3. Append timestamped learning note in agent's NOTES.md and root MEMORY.md
            const ts = new Date().toISOString();
            const logEntry = noteLine
              ? `\n- **[${ts}]** ${noteLine}`
              : `\n- **[${ts}]** Task \`${String(task.id)}\` (${String(task.title || 'Mission')}) -> Statut: **${String(task.status)}**`;

            const notesPath = path.join(targetDir, 'NOTES.md');
            fs.appendFileSync(notesPath, logEntry + '\n', 'utf-8');

            if (fs.existsSync(memoryMdPath)) {
              fs.appendFileSync(memoryMdPath, `\n- **[${ts}] [${agentId}]** ${noteLine || `Task ${String(task.id)} updated to ${String(task.status)}`}`, 'utf-8');
            }

            const updatedBundle = readSingleAgentFolder(
              agentId,
              targetDir,
              path.relative(agentsRoot, targetDir)
            );
            return sendJson(res, 200, { ok: true, bundle: updatedBundle });
          }

          if (req.method === 'POST' && urlObj.pathname === '/api/agents/notes') {
            const body = await parseRequestBody(req);
            const agentId = String(body.agentId || '');
            const fileType = String(body.fileType || 'NOTES.md');
            const content = String(body.content ?? '');
            const specName = String(body.specName || '');

            const targetDir = resolveAgentDir(agentsRoot, agentId);
            if (!targetDir) {
              return sendJson(res, 400, { ok: false, error: `Agent folder not found for ${agentId}` });
            }

            if (fileType === 'NOTES.md') {
              fs.writeFileSync(path.join(targetDir, 'NOTES.md'), content, 'utf-8');
            } else if (fileType === 'AGENT.md' || fileType === 'PROFILE.md') {
              const targetFile = fs.existsSync(path.join(targetDir, 'PROFILE.md')) ? 'PROFILE.md' : 'AGENT.md';
              fs.writeFileSync(path.join(targetDir, targetFile), content, 'utf-8');
            } else if (fileType === 'SPEC' && specName) {
              const specsDir = path.join(targetDir, 'SPECS');
              if (!fs.existsSync(specsDir)) fs.mkdirSync(specsDir, { recursive: true });
              fs.writeFileSync(path.join(specsDir, path.basename(specName)), content, 'utf-8');
            }

            const ts = new Date().toISOString();
            if (fs.existsSync(memoryMdPath)) {
              fs.appendFileSync(
                memoryMdPath,
                `\n- **[${ts}] [${agentId}]** Fichier \`${specName || fileType}\` mis à jour manuellement via l'Inspecteur A0.`,
                'utf-8'
              );
            }

            const updatedBundle = readSingleAgentFolder(
              agentId,
              targetDir,
              path.relative(agentsRoot, targetDir)
            );
            return sendJson(res, 200, { ok: true, bundle: updatedBundle });
          }

          return sendJson(res, 404, { ok: false, error: 'Endpoint /api/agents inconnu' });
        } catch (error) {
          return sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Internal Server Error',
          });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), agentFilesystemApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
