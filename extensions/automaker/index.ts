import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { AutoMakerClient } from "./src/client.js";
import { createAutoMakerTool } from "./src/tools.js";

type AutoMakerPluginConfig = {
  url?: string;
  apiKey?: string;
};

const automakerPlugin = {
  id: "automaker",
  name: "AutoMaker",
  description: "Manage AutoMaker projects, features, AI agents, and sessions.",
  configSchema: {
    safeParse(value: unknown) {
      if (value === undefined) {
        return { success: true, data: undefined };
      }
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {
          success: false,
          error: { issues: [{ path: [], message: "expected config object" }] },
        };
      }
      return { success: true, data: value };
    },
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        url: { type: "string", description: "AutoMaker server URL" },
        apiKey: { type: "string", description: "Optional API key" },
      },
    },
  },
  register(api: OpenClawPluginApi) {
    api.registerTool(
      () => {
        const cfg = (api.pluginConfig ?? {}) as AutoMakerPluginConfig;
        const url = cfg.url || process.env.AUTOMAKER_URL;
        if (!url) {
          // No URL configured; skip tool registration
          return null;
        }
        const client = new AutoMakerClient({ url, apiKey: cfg.apiKey || process.env.AUTOMAKER_API_KEY });
        return createAutoMakerTool(client);
      },
      { names: ["automaker"] },
    );
  },
};

export default automakerPlugin;
