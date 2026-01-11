# GitHub Issues to Create

These GitHub issues should be created to match the beads issue tracking. Each beads issue has an `external-ref` field linking to the intended GitHub issue number.

## Issue #1: Test plugin on desktop Obsidian

**Beads ID:** `obsidian-timestamps-block-7z6.7`
**Type:** Testing
**Priority:** High (P1)

### Description
Test all commands, settings persistence, block detection, and auto-timestamping on desktop Obsidian client.

### Acceptance Criteria
- [ ] Plugin loads without errors
- [ ] All 5 commands work correctly
- [ ] Settings persist across restarts
- [ ] Header-based block detection works
- [ ] Fence-based block detection works
- [ ] Auto-timestamping on new lines works
- [ ] No console errors

---

## Issue #2: Test plugin on mobile Obsidian

**Beads ID:** `obsidian-timestamps-block-7z6.8`
**Type:** Testing
**Priority:** High (P1)

### Description
Test all functionality on iOS and Android using app.emulateMobile(true) and real devices.

### Acceptance Criteria
- [ ] Plugin loads on mobile
- [ ] Commands accessible via command palette
- [ ] Settings UI works on mobile
- [ ] Block detection works
- [ ] Auto-timestamping works
- [ ] No console errors
- [ ] No iOS regex lookbehind crashes

---

## Issue #3: Submit to Obsidian Community Plugins

**Beads ID:** `obsidian-timestamps-block-7z6.10`
**Type:** Documentation/Release
**Priority:** Low (P3)

### Description
Create PR to obsidian-releases repository to submit plugin to community plugins list.

### Prerequisites
- [ ] Plugin fully tested on desktop (Issue #1)
- [ ] Plugin fully tested on mobile (Issue #2)
- [ ] README complete with usage instructions
- [ ] LICENSE file included
- [ ] No external dependencies beyond Obsidian API

### Steps
1. Fork obsidian-releases repo
2. Add plugin to community-plugins.json
3. Create PR with plugin details

---

## Creating These Issues

Run these commands after authenticating with `gh auth login`:

```bash
# Issue #1
gh issue create --title "Test plugin on desktop Obsidian" \
  --body "## Description
Test all commands, settings persistence, block detection, and auto-timestamping on desktop Obsidian client.

## Beads Issue
\`obsidian-timestamps-block-7z6.7\`

## Acceptance Criteria
- [ ] Plugin loads without errors
- [ ] All 5 commands work correctly
- [ ] Settings persist across restarts
- [ ] Header-based block detection works
- [ ] Fence-based block detection works
- [ ] Auto-timestamping on new lines works
- [ ] No console errors" \
  --label "testing"

# Issue #2
gh issue create --title "Test plugin on mobile Obsidian" \
  --body "## Description
Test all functionality on iOS and Android.

## Beads Issue
\`obsidian-timestamps-block-7z6.8\`

## Acceptance Criteria
- [ ] Plugin loads on mobile
- [ ] Commands accessible via command palette
- [ ] Settings UI works on mobile
- [ ] Block detection works
- [ ] Auto-timestamping works
- [ ] No console errors
- [ ] No iOS regex lookbehind crashes" \
  --label "testing"

# Issue #3
gh issue create --title "Submit to Obsidian Community Plugins" \
  --body "## Description
Create PR to obsidian-releases repository.

## Beads Issue
\`obsidian-timestamps-block-7z6.10\`

## Prerequisites
- [ ] Plugin fully tested on desktop (#1)
- [ ] Plugin fully tested on mobile (#2)
- [ ] README complete
- [ ] LICENSE included" \
  --label "documentation"
```
