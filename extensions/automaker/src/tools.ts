/**
 * AutoMaker tool definitions for the OpenClaw Pi agent.
 *
 * Provides a single "automaker" tool with action-based dispatch
 * (similar to the slack skill pattern).
 */

import { Type } from "@sinclair/typebox";
import type { AutoMakerClient } from "./client.js";

// Tool schema avoids Type.Union per project guardrails (no anyOf/oneOf/allOf).
// Actions are passed as a plain string enum via Type.Unsafe.
const ActionEnum = Type.Unsafe<string>({
  type: "string",
  enum: [
    "health",
    "list_features",
    "get_feature",
    "create_feature",
    "update_feature",
    "delete_feature",
    "agent_output",
    "start_agent",
    "send_to_agent",
    "agent_history",
    "stop_agent",
    "running_agents",
    "list_sessions",
    "create_session",
    "archive_session",
    "delete_session",
    "git_diffs",
    "git_file_diff",
    "list_models",
    "settings",
  ],
  description: "The AutoMaker action to perform.",
});

export function createAutoMakerTool(client: AutoMakerClient) {
  return {
    name: "automaker",
    description:
      "Interact with an AutoMaker instance to manage projects, features, AI agents, and sessions on its Kanban board.",
    parameters: Type.Object({
      action: ActionEnum,
      projectPath: Type.Optional(
        Type.String({ description: "Absolute path to the project directory." }),
      ),
      featureId: Type.Optional(Type.String({ description: "Feature ID." })),
      title: Type.Optional(Type.String({ description: "Feature title (for create/update)." })),
      description: Type.Optional(
        Type.String({ description: "Feature description (for create/update)." }),
      ),
      status: Type.Optional(
        Type.String({
          description:
            "Feature status (for update): backlog, in_progress, waiting_approval, verified.",
        }),
      ),
      sessionId: Type.Optional(Type.String({ description: "Session ID." })),
      sessionName: Type.Optional(
        Type.String({ description: "Session name (for create_session)." }),
      ),
      message: Type.Optional(
        Type.String({ description: "Message to send to an agent (for send_to_agent)." }),
      ),
      filePath: Type.Optional(
        Type.String({ description: "Relative file path (for git_file_diff)." }),
      ),
    }),

    async execute(_id: string, params: Record<string, unknown>) {
      const action = params.action as string;
      const projectPath = params.projectPath as string | undefined;
      const featureId = params.featureId as string | undefined;
      const sessionId = params.sessionId as string | undefined;

      switch (action) {
        case "health": {
          const res = await client.health();
          return result(res);
        }

        case "list_features": {
          requireParam(projectPath, "projectPath");
          const res = await client.listFeatures(projectPath!);
          return result(res);
        }

        case "get_feature": {
          requireParam(projectPath, "projectPath");
          requireParam(featureId, "featureId");
          const res = await client.getFeature(projectPath!, featureId!);
          return result(res);
        }

        case "create_feature": {
          requireParam(projectPath, "projectPath");
          const title = params.title as string | undefined;
          requireParam(title, "title");
          const res = await client.createFeature(
            projectPath!,
            title!,
            params.description as string | undefined,
          );
          return result(res);
        }

        case "update_feature": {
          requireParam(projectPath, "projectPath");
          requireParam(featureId, "featureId");
          const updates: Record<string, unknown> = {};
          if (params.title) updates.title = params.title;
          if (params.description) updates.description = params.description;
          if (params.status) updates.status = params.status;
          const res = await client.updateFeature(projectPath!, featureId!, updates);
          return result(res);
        }

        case "delete_feature": {
          requireParam(projectPath, "projectPath");
          requireParam(featureId, "featureId");
          const res = await client.deleteFeature(projectPath!, featureId!);
          return result(res);
        }

        case "agent_output": {
          requireParam(projectPath, "projectPath");
          requireParam(featureId, "featureId");
          const res = await client.getAgentOutput(projectPath!, featureId!);
          return result(res);
        }

        case "start_agent": {
          requireParam(sessionId, "sessionId");
          const res = await client.startAgent(
            sessionId!,
            projectPath,
          );
          return result(res);
        }

        case "send_to_agent": {
          requireParam(sessionId, "sessionId");
          const message = params.message as string | undefined;
          requireParam(message, "message");
          const res = await client.sendToAgent(sessionId!, message!);
          return result(res);
        }

        case "agent_history": {
          requireParam(sessionId, "sessionId");
          const res = await client.agentHistory(sessionId!);
          return result(res);
        }

        case "stop_agent": {
          requireParam(sessionId, "sessionId");
          const res = await client.stopAgent(sessionId!);
          return result(res);
        }

        case "running_agents": {
          const res = await client.runningAgents();
          return result(res);
        }

        case "list_sessions": {
          const res = await client.listSessions();
          return result(res);
        }

        case "create_session": {
          requireParam(projectPath, "projectPath");
          const res = await client.createSession(
            projectPath!,
            params.sessionName as string | undefined,
          );
          return result(res);
        }

        case "archive_session": {
          requireParam(sessionId, "sessionId");
          const res = await client.archiveSession(sessionId!);
          return result(res);
        }

        case "delete_session": {
          requireParam(sessionId, "sessionId");
          const res = await client.deleteSession(sessionId!);
          return result(res);
        }

        case "git_diffs": {
          requireParam(projectPath, "projectPath");
          const res = await client.gitDiffs(projectPath!);
          return result(res);
        }

        case "git_file_diff": {
          requireParam(projectPath, "projectPath");
          const filePath = params.filePath as string | undefined;
          requireParam(filePath, "filePath");
          const res = await client.gitFileDiff(projectPath!, filePath!);
          return result(res);
        }

        case "list_models": {
          requireParam(projectPath, "projectPath");
          const res = await client.listModels(projectPath!);
          return result(res);
        }

        case "settings": {
          const res = await client.getSettings();
          return result(res);
        }

        default:
          throw new Error(`Unknown automaker action: ${action}`);
      }
    },
  };
}

function requireParam(value: unknown, name: string): asserts value is string {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required for this action`);
  }
}

function result(res: { ok: boolean; status: number; data?: unknown; error?: string }) {
  if (!res.ok) {
    return {
      content: [
        {
          type: "text" as const,
          text: `AutoMaker error (${res.status}): ${res.error ?? "unknown error"}`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(res.data, null, 2),
      },
    ],
  };
}
