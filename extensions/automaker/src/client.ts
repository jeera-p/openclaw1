/**
 * Lightweight HTTP client for the AutoMaker REST API.
 * Wraps fetch calls to the AutoMaker server with optional API key auth.
 */

export type AutoMakerClientOptions = {
  url: string;
  apiKey?: string;
};

export type AutoMakerResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export class AutoMakerClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(opts: AutoMakerClientOptions) {
    // Strip trailing slash
    this.baseUrl = opts.url.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      h["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return h;
  }

  async get<T = unknown>(path: string): Promise<AutoMakerResponse<T>> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "GET",
      headers: this.headers(),
    });
    return this.parseResponse<T>(res);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<AutoMakerResponse<T>> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "POST",
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(res);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<AutoMakerResponse<T>> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(res);
  }

  async del<T = unknown>(path: string): Promise<AutoMakerResponse<T>> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    return this.parseResponse<T>(res);
  }

  private async parseResponse<T>(res: Response): Promise<AutoMakerResponse<T>> {
    let data: T | undefined;
    let error: string | undefined;
    try {
      const json = await res.json();
      if (res.ok) {
        data = json as T;
      } else {
        error =
          typeof json === "object" && json !== null && "error" in json
            ? String((json as Record<string, unknown>).error)
            : JSON.stringify(json);
      }
    } catch {
      if (!res.ok) {
        error = `HTTP ${res.status} ${res.statusText}`;
      }
    }
    return { ok: res.ok, status: res.status, data, error };
  }

  // --- Convenience methods ---

  async health() {
    return this.get("/health");
  }

  async listFeatures(projectPath: string) {
    return this.post("/features/list", { projectPath });
  }

  async getFeature(projectPath: string, featureId: string) {
    return this.post("/features/get", { projectPath, featureId });
  }

  async createFeature(projectPath: string, title: string, description?: string) {
    return this.post("/features/create", { projectPath, title, description });
  }

  async updateFeature(projectPath: string, featureId: string, updates: Record<string, unknown>) {
    return this.post("/features/update", { projectPath, featureId, ...updates });
  }

  async deleteFeature(projectPath: string, featureId: string) {
    return this.post("/features/delete", { projectPath, featureId });
  }

  async getAgentOutput(projectPath: string, featureId: string) {
    return this.post("/features/agent-output", { projectPath, featureId });
  }

  async startAgent(sessionId: string, workingDirectory?: string) {
    return this.post("/agent/start", { sessionId, workingDirectory });
  }

  async sendToAgent(sessionId: string, message: string) {
    return this.post("/agent/send", { sessionId, message });
  }

  async agentHistory(sessionId: string) {
    return this.post("/agent/history", { sessionId });
  }

  async stopAgent(sessionId: string) {
    return this.post("/agent/stop", { sessionId });
  }

  async runningAgents() {
    return this.get("/running-agents");
  }

  async listSessions() {
    return this.get("/sessions");
  }

  async createSession(projectPath: string, name?: string) {
    return this.post("/sessions", { projectPath, name });
  }

  async archiveSession(sessionId: string) {
    return this.post(`/sessions/${encodeURIComponent(sessionId)}/archive`, {});
  }

  async deleteSession(sessionId: string) {
    return this.del(`/sessions/${encodeURIComponent(sessionId)}`);
  }

  async gitDiffs(projectPath: string) {
    return this.post("/git/diffs", { projectPath });
  }

  async gitFileDiff(projectPath: string, filePath: string) {
    return this.post("/git/file-diff", { projectPath, filePath });
  }

  async listModels(projectPath: string) {
    return this.post("/models", { projectPath });
  }

  async getSettings() {
    return this.get("/settings");
  }
}
