---
name: automaker
description: "Manage AutoMaker projects, features, agents, and sessions via the AutoMaker REST API. Create features on the Kanban board, start/stop AI agents, track progress, and manage git worktrees."
homepage: https://github.com/AutoMaker-Org/automaker
metadata:
  {
    "openclaw":
      {
        "emoji": "🏭",
        "requires": { "bins": ["curl", "jq"], "env": ["AUTOMAKER_URL"] },
      },
  }
---

# AutoMaker Skill

Interact with an [AutoMaker](https://github.com/AutoMaker-Org/automaker) instance to manage projects, features, AI agents, and sessions from OpenClaw.

AutoMaker is an autonomous AI development studio that orchestrates Claude-powered agents to build features via a Kanban board workflow.

## Setup

1. Start your AutoMaker server (default: `http://localhost:3008`)
2. Set the base URL:
   ```bash
   export AUTOMAKER_URL="http://localhost:3008"
   ```
3. If API key auth is enabled on your AutoMaker server, also set:
   ```bash
   export AUTOMAKER_API_KEY="your-api-key"
   ```

Helper function (used in all examples below):

```bash
am() {
  local method="$1" path="$2" data="$3"
  local headers=(-H "Content-Type: application/json")
  [ -n "$AUTOMAKER_API_KEY" ] && headers+=(-H "Authorization: Bearer $AUTOMAKER_API_KEY")
  if [ "$method" = "GET" ]; then
    curl -s "$AUTOMAKER_URL/api$path" "${headers[@]}" | jq
  else
    curl -s -X "$method" "$AUTOMAKER_URL/api$path" "${headers[@]}" -d "$data" | jq
  fi
}
```

## Health Check

Verify the AutoMaker server is reachable:

```bash
am GET /health
```

Check environment and container status:

```bash
am GET /health/environment
```

## Features (Kanban Board)

### List all features in a project

```bash
am POST /features/list '{"projectPath": "/path/to/project"}'
```

### Get a specific feature

```bash
am POST /features/get '{"projectPath": "/path/to/project", "featureId": "feature-id"}'
```

### Create a new feature

```bash
am POST /features/create '{"projectPath": "/path/to/project", "title": "Add user auth", "description": "Implement OAuth2 login flow with Google provider"}'
```

### Update a feature

```bash
am POST /features/update '{"projectPath": "/path/to/project", "featureId": "feature-id", "title": "Updated title", "status": "in_progress"}'
```

### Bulk update features

```bash
am POST /features/bulk-update '{"projectPath": "/path/to/project", "features": [{"featureId": "id1", "status": "verified"}, {"featureId": "id2", "status": "verified"}]}'
```

### Delete a feature

```bash
am POST /features/delete '{"projectPath": "/path/to/project", "featureId": "feature-id"}'
```

### Get agent output for a feature

```bash
am POST /features/agent-output '{"projectPath": "/path/to/project", "featureId": "feature-id"}'
```

### Get raw output for a feature

```bash
am POST /features/raw-output '{"projectPath": "/path/to/project", "featureId": "feature-id"}'
```

### Generate a title from a description

```bash
am POST /features/generate-title '{"description": "Implement a REST API for user management with CRUD operations"}'
```

## Agent Operations

### Start an agent

```bash
am POST /agent/start '{"sessionId": "session-id", "workingDirectory": "/path/to/project"}'
```

### Send a message to an agent

```bash
am POST /agent/send '{"sessionId": "session-id", "message": "Implement the login form component"}'
```

### Get agent conversation history

```bash
am POST /agent/history '{"sessionId": "session-id"}'
```

### Stop a running agent

```bash
am POST /agent/stop '{"sessionId": "session-id"}'
```

### Clear agent history

```bash
am POST /agent/clear '{"sessionId": "session-id"}'
```

### Change agent model

```bash
am POST /agent/model '{"sessionId": "session-id", "model": "claude-sonnet-4-5-20250929"}'
```

### Agent Queue

Add a task to the queue:

```bash
am POST /agent/queue/add '{"sessionId": "session-id", "message": "Write unit tests for the auth module"}'
```

List queued tasks:

```bash
am POST /agent/queue/list '{"sessionId": "session-id"}'
```

Remove a task from the queue:

```bash
am POST /agent/queue/remove '{"sessionId": "session-id", "queueId": "queue-item-id"}'
```

Clear the queue:

```bash
am POST /agent/queue/clear '{"sessionId": "session-id"}'
```

## Running Agents

### List all currently running agents

```bash
am GET /running-agents
```

## Sessions

### List all sessions

```bash
am GET /sessions
```

### Create a new session

```bash
am POST /sessions '{"projectPath": "/path/to/project", "name": "Feature work"}'
```

### Update a session

```bash
curl -s -X PUT "$AUTOMAKER_URL/api/sessions/session-id" \
  -H "Content-Type: application/json" \
  ${AUTOMAKER_API_KEY:+-H "Authorization: Bearer $AUTOMAKER_API_KEY"} \
  -d '{"name": "Renamed session"}' | jq
```

### Archive / unarchive a session

```bash
am POST /sessions/session-id/archive '{}'
am POST /sessions/session-id/unarchive '{}'
```

### Delete a session

```bash
curl -s -X DELETE "$AUTOMAKER_URL/api/sessions/session-id" \
  -H "Content-Type: application/json" \
  ${AUTOMAKER_API_KEY:+-H "Authorization: Bearer $AUTOMAKER_API_KEY"} | jq
```

## Git Operations

### View diffs for a project

```bash
am POST /git/diffs '{"projectPath": "/path/to/project"}'
```

### View diff for a specific file

```bash
am POST /git/file-diff '{"projectPath": "/path/to/project", "filePath": "src/index.ts"}'
```

## Worktree Management

AutoMaker uses git worktrees to isolate feature work from the main branch.

```bash
am POST /worktree/list '{"projectPath": "/path/to/project"}'
```

## Settings

```bash
am GET /settings
```

## Workspace

```bash
am POST /workspace '{"projectPath": "/path/to/project"}'
```

## Models

### List available models

```bash
am POST /models '{"projectPath": "/path/to/project"}'
```

## Notes

- AutoMaker defaults to port 3008; set `AUTOMAKER_URL` accordingly
- All `/api/features/*`, `/api/agent/*`, `/api/sessions/*`, and other protected routes require authentication if `AUTOMAKER_API_KEY` is configured on the server
- Real-time events are streamed via WebSocket at `/api/events` and terminal output at `/api/terminal/ws`
- Feature statuses follow the Kanban flow: backlog, in_progress, waiting_approval, verified
- Agents run in isolated git worktrees to avoid conflicts with the main branch

## Examples

```bash
# Full workflow: create a feature and start an agent on it

# 1. Create a session
am POST /sessions '{"projectPath": "/home/user/my-project", "name": "Auth feature"}'

# 2. Create a feature
am POST /features/create '{"projectPath": "/home/user/my-project", "title": "Add JWT auth", "description": "Add JWT-based authentication with refresh tokens"}'

# 3. Check running agents
am GET /running-agents

# 4. Review diffs after agent completes
am POST /git/diffs '{"projectPath": "/home/user/my-project"}'
```
