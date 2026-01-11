# Beads Task Management Skill

Use this skill when managing tasks, issues, and project work using the Beads issue tracker. Beads provides dependency-aware task tracking designed for AI-assisted coding workflows.

---

## Quick Reference

### Installation

```bash
# Install bd CLI
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Initialize in project
bd init --quiet
```

### Essential Commands

| Command | Description |
|---------|-------------|
| `bd ready` | Show tasks with no blockers, ready to work |
| `bd list` | List all open issues |
| `bd list --all` | List all issues including closed |
| `bd show <id>` | Show issue details |
| `bd create "title"` | Create a new task |
| `bd close <id> --reason "summary"` | Close completed task |
| `bd stats` | Show project statistics |

---

## Issue Types & Priority

### Types
- `bug` - Something broken that needs fixing
- `feature` - New functionality to implement
- `task` - General work item
- `epic` - Large feature containing sub-tasks
- `chore` - Maintenance, cleanup, dependencies

### Priority Levels
| Level | Name | Description |
|-------|------|-------------|
| 0 | Critical | Drop everything |
| 1 | High | Important, do soon |
| 2 | Medium | Normal priority (default) |
| 3 | Low | Can wait |
| 4 | Backlog | Future consideration |

---

## Creating Issues

### Basic Task
```bash
bd create "Implement user authentication" --type task --priority 1
```

### Task with Description
```bash
bd create "Add dark mode toggle" \
  --type feature \
  --priority 2 \
  --description "Allow users to switch between light and dark themes"
```

### Child of Epic
```bash
bd create "Create login form" \
  --type task \
  --parent epic-abc123 \
  --priority 1
```

### With GitHub Issue Reference
```bash
bd create "Fix memory leak in parser" \
  --type bug \
  --external-ref "gh-42" \
  --priority 0
```

### Silent Mode (returns only ID)
```bash
TASK_ID=$(bd create "Quick task" --silent)
```

---

## Managing Dependencies

### Add Dependency
```bash
# Task A is blocked by Task B (A cannot start until B is done)
bd dep add <task-a-id> --blocked-by <task-b-id>
```

### View Dependencies
```bash
bd show <id>  # Shows blocked-by and blocks relationships
```

### Dependency Types
- `blocks` - Task cannot start until dependency is complete
- `related` - Informational link
- `parent-child` - Hierarchical relationship
- `discovered-from` - Task discovered while working on another

---

## Workflow Pattern

### 1. Find Ready Work
```bash
bd ready
```

### 2. Claim a Task
```bash
bd update <id> --status in_progress
```

### 3. Work on Task
- Make code changes
- Discover new issues → create them with `bd create`
- Link discoveries: `--deps "discovered-from:<parent-id>"`

### 4. Complete Task
```bash
bd close <id> --reason "Implemented feature with tests"
```

### 5. Check What's Unblocked
```bash
bd close <id> --suggest-next
```

---

## Viewing Issues

### List Open Issues
```bash
bd list
```

### List by Type
```bash
bd list --type bug
bd list --type feature
```

### List by Priority
```bash
bd list --priority 0,1  # Critical and High only
```

### Show Issue Details
```bash
bd show <id>
```

### Search Issues
```bash
bd search "authentication"
```

---

## Closing Issues

### Close with Reason
```bash
bd close <id> --reason "Fixed by implementing retry logic"
```

### Close and Show Next Steps
```bash
bd close <id> --suggest-next
```

### Close Multiple
```bash
bd close id1 id2 id3 --reason "Batch cleanup"
```

---

## Project Statistics

```bash
bd stats
```

Shows:
- Total issues (open/closed)
- Issues by type
- Issues by priority
- Blocked issues count

---

## External References

Link beads issues to external systems:

```bash
# GitHub issue
bd create "Bug fix" --external-ref "gh-123"

# Jira
bd create "Feature" --external-ref "jira-PROJ-456"

# Any external system
bd create "Task" --external-ref "linear-ABC-789"
```

View in issue details:
```bash
bd show <id>  # Shows external-ref field
```

---

## Best Practices

### 1. Create Epics for Large Features
```bash
bd create "User Authentication System" --type epic --priority 1

# Then create child tasks
bd create "Design login flow" --parent <epic-id>
bd create "Implement OAuth" --parent <epic-id>
bd create "Add password reset" --parent <epic-id>
```

### 2. Always Close with Reasons
```bash
bd close <id> --reason "Completed: added retry logic with exponential backoff"
```

### 3. Use Dependencies for Ordering
```bash
# Testing depends on implementation
bd dep add <test-task> --blocked-by <impl-task>
```

### 4. Link to GitHub Issues
```bash
bd create "Reproduce bug from user report" --external-ref "gh-99"
```

### 5. Check Ready Work Before Starting
```bash
bd ready  # Shows unblocked tasks
```

---

## Integration with Git

Beads stores issues in `.beads/issues.jsonl`:
- Committed to git automatically
- Merges cleanly across branches
- No external database required

### Sync After Pull
```bash
git pull
# Beads auto-imports from JSONL if newer
```

### View Changes
```bash
git diff .beads/issues.jsonl
```

---

## Common Patterns

### Sprint Planning
```bash
# Create sprint epic
SPRINT=$(bd create "Sprint 12" --type epic --silent)

# Add tasks to sprint
bd create "Feature A" --parent $SPRINT
bd create "Bug fix B" --parent $SPRINT
bd create "Chore C" --parent $SPRINT
```

### Bug Triage
```bash
# Create bug with full details
bd create "App crashes on login" \
  --type bug \
  --priority 0 \
  --description "Users report crash when clicking login button" \
  --external-ref "gh-101"
```

### Discovery During Work
```bash
# While working on task A, discover related work needed
bd create "Refactor auth module" \
  --type chore \
  --deps "discovered-from:$CURRENT_TASK"
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BEADS_ACTOR` | Name for audit trail |
| `BEADS_DB` | Custom database path |
| `BEADS_NO_AUTO_FLUSH` | Disable auto JSONL export |

---

## Resources

- [Beads GitHub Repository](https://github.com/steveyegge/beads)
- [Beads Documentation](https://steveyegge.github.io/beads/)
- [Medium: Introducing Beads](https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a)
