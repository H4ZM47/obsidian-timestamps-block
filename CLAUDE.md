# Claude Code Configuration for Obsidian Timestamps Block Plugin

## Project Overview

This is an Obsidian plugin that enables timestamped log blocks within markdown documents. The plugin works on both desktop and mobile Obsidian clients.

## Key Requirements

- **Cross-platform**: Must work on desktop AND mobile (iOS, Android)
- **No Node.js APIs**: Cannot use `fs`, `path`, `child_process`, etc.
- **No Electron APIs**: Cannot use Electron-specific features
- **No Regex Lookbehind**: iOS Safari doesn't support it
- **moment.js**: Use `window.moment()` for date/time formatting (built into Obsidian)

## Skills Reference

When working on this project, refer to the skill at:
- `.claude/skills/obsidian-plugin-development.md` - Comprehensive Obsidian plugin development guide

## Project Structure

```
src/
├── main.ts              # Plugin entry point
├── settings.ts          # Settings interface and tab
├── timestamp-service.ts # Timestamp formatting
├── block-detector.ts    # Detects timestamp blocks
└── types.ts             # TypeScript interfaces
```

## Important Files

- `manifest.json` - Plugin metadata (id, name, version, isDesktopOnly)
- `package.json` - NPM dependencies and build scripts
- `tsconfig.json` - TypeScript configuration
- `esbuild.config.mjs` - Build bundler configuration
- `IMPLEMENTATION_PLAN.md` - Detailed implementation plan

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development with watch mode
npm run build     # Production build
```

## Plugin Features

1. **Timestamped Blocks**: Designated sections where new lines get automatic timestamps
2. **Configurable Format**: moment.js format strings (e.g., `YYYY-MM-DD HH:mm`)
3. **Block Detection**: Header-based or fence-based block identification
4. **Commands**:
   - Insert timestamped block
   - Insert timestamp at cursor
   - Toggle auto-timestamp mode

## Settings Schema

```typescript
interface TimestampBlockSettings {
  timestampFormat: string;      // moment.js format
  blockIdentifier: 'header' | 'fence' | 'both';
  headerPattern: string;        // Regex for header matching
  fenceLanguage: string;        // Code fence language
  timestampPrefix: string;      // e.g., "["
  timestampSuffix: string;      // e.g., "] "
  autoTimestamp: boolean;       // Auto-add on new line
  includeOnEmptyLine: boolean;  // Timestamp empty lines
}
```

## Testing

- Test on desktop Obsidian
- Test on mobile using: `this.app.emulateMobile(true)` in dev console
- Verify no console errors
- Verify settings persist

## Code Style

- TypeScript with strict null checks
- No default hotkeys (conflict risk)
- Save settings immediately on change
- Use `this.registerEvent()` for auto-cleanup
- Handle missing editor gracefully
