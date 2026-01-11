# Obsidian Timestamps Block Plugin - Implementation Plan

## Overview

This plugin allows users to create designated blocks within markdown documents where new lines are automatically prepended with configurable timestamps. It works on both desktop and mobile Obsidian clients.

## Core Features

### 1. Timestamped Log Blocks
- Users can designate sections of a document as "timestamped log blocks"
- When typing in these blocks, each new line automatically gets a timestamp prefix
- Blocks are identified by configurable markers (header pattern or special syntax)

### 2. Configurable Timestamp Format
- Uses moment.js format strings (built into Obsidian)
- Default: `YYYY-MM-DD HH:mm`
- Examples: `HH:mm`, `YYYY-MM-DD`, `ddd MMM D HH:mm:ss`

### 3. Block Identification Methods
Two methods for identifying timestamped blocks:

**Method A: Header-based** (Default)
```markdown
## Log
- [2024-01-15 10:30] First entry
- [2024-01-15 10:35] Second entry
```

**Method B: Code fence with custom language**
```markdown
```timestamp-log
[2024-01-15 10:30] First entry
[2024-01-15 10:35] Second entry
```⁠
```

### 4. Commands
- **Insert Timestamped Block**: Inserts a new timestamped log block at cursor
- **Insert Timestamp**: Manually insert a timestamp at cursor position
- **Toggle Timestamped Mode**: Enable/disable auto-timestamping for current line

---

## Technical Architecture

### File Structure

```
obsidian-timestamps-block/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── settings.ts             # Settings interface and tab
│   ├── timestamp-service.ts    # Timestamp formatting logic
│   ├── block-detector.ts       # Detects if cursor is in timestamp block
│   └── types.ts                # TypeScript interfaces
├── styles.css                  # Optional styling
├── manifest.json               # Obsidian plugin manifest
├── package.json                # NPM configuration
├── tsconfig.json               # TypeScript configuration
├── esbuild.config.mjs          # Build configuration
├── .gitignore
└── README.md
```

### Core Components

#### 1. TimestampService (`timestamp-service.ts`)
```typescript
interface TimestampService {
  formatTimestamp(format: string): string;
  createTimestampedLine(content: string, format: string): string;
  parseTimestampFromLine(line: string): { timestamp: string; content: string } | null;
}
```

#### 2. BlockDetector (`block-detector.ts`)
```typescript
interface BlockDetector {
  isInTimestampBlock(editor: Editor, cursor: EditorPosition): boolean;
  findBlockBoundaries(editor: Editor, cursor: EditorPosition): { start: number; end: number } | null;
  getBlockType(editor: Editor, line: number): 'header' | 'fence' | null;
}
```

#### 3. Plugin Settings (`settings.ts`)
```typescript
interface TimestampBlockSettings {
  // Timestamp format (moment.js)
  timestampFormat: string;

  // Block detection settings
  blockIdentifier: 'header' | 'fence' | 'both';
  headerPattern: string;  // Regex pattern for header matching
  fenceLanguage: string;  // Custom code fence language

  // Formatting options
  timestampPrefix: string;  // e.g., "["
  timestampSuffix: string;  // e.g., "] "

  // Behavior options
  autoTimestamp: boolean;  // Auto-add timestamp on new line
  includeOnEmptyLine: boolean;  // Add timestamp even for empty lines
}
```

---

## Implementation Details

### Phase 1: Project Setup

1. **Initialize npm project**
   - Create `package.json` with dependencies
   - Configure TypeScript with `tsconfig.json`
   - Set up esbuild for bundling

2. **Create manifest.json**
   ```json
   {
     "id": "timestamps-block",
     "name": "Timestamps Block",
     "version": "1.0.0",
     "minAppVersion": "0.15.0",
     "description": "Create timestamped log blocks in your notes",
     "author": "H4ZM47",
     "isDesktopOnly": false
   }
   ```

3. **Set up .gitignore**
   - Ignore `node_modules/`, `main.js`, `.npm/`

### Phase 2: Core Plugin Structure

1. **Main plugin class** (`main.ts`)
   ```typescript
   export default class TimestampBlockPlugin extends Plugin {
     settings: TimestampBlockSettings;

     async onload() {
       await this.loadSettings();
       this.registerCommands();
       this.registerEditorExtension();
       this.addSettingTab(new TimestampBlockSettingTab(this.app, this));
     }
   }
   ```

2. **Settings management**
   - Load/save settings with defaults
   - Create settings UI tab

3. **Command registration**
   - Register all user-facing commands

### Phase 3: Block Detection Logic

1. **Header-based detection**
   ```typescript
   // Check if current line is under a matching header
   function isUnderTimestampHeader(editor: Editor, line: number): boolean {
     const headerPattern = new RegExp(this.settings.headerPattern, 'i');

     // Search backwards for a header
     for (let i = line - 1; i >= 0; i--) {
       const lineText = editor.getLine(i);

       // Stop if we hit another header (different section)
       if (/^#{1,6}\s/.test(lineText) && !headerPattern.test(lineText)) {
         return false;
       }

       // Found matching header
       if (headerPattern.test(lineText)) {
         return true;
       }
     }
     return false;
   }
   ```

2. **Fence-based detection**
   ```typescript
   // Check if cursor is inside a timestamp-log fence
   function isInTimestampFence(editor: Editor, line: number): boolean {
     const fenceStart = '```' + this.settings.fenceLanguage;
     let inFence = false;

     for (let i = 0; i <= line; i++) {
       const lineText = editor.getLine(i).trim();
       if (lineText.startsWith(fenceStart)) {
         inFence = true;
       } else if (lineText === '```' && inFence) {
         inFence = false;
       }
     }
     return inFence;
   }
   ```

### Phase 4: Editor Integration

1. **Key event handling**
   - Listen for Enter key in timestamp blocks
   - Prepend timestamp to new line

   ```typescript
   this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
     if (evt.key === 'Enter' && !evt.isComposing) {
       const view = this.app.workspace.getActiveViewOfType(MarkdownView);
       if (view && this.shouldAutoTimestamp(view.editor)) {
         // Will be handled after the newline is created
         setTimeout(() => this.insertTimestamp(view.editor), 0);
       }
     }
   });
   ```

2. **Alternative: Editor Extension approach**
   - Use Obsidian's `registerEditorExtension` for cleaner integration
   - Works better with mobile

### Phase 5: Commands Implementation

1. **Insert Timestamped Block**
   ```typescript
   this.addCommand({
     id: 'insert-timestamp-block',
     name: 'Insert timestamped log block',
     editorCallback: (editor: Editor) => {
       const cursor = editor.getCursor();
       const blockTemplate = this.getBlockTemplate();
       editor.replaceRange(blockTemplate, cursor);
     }
   });
   ```

2. **Insert Timestamp**
   ```typescript
   this.addCommand({
     id: 'insert-timestamp',
     name: 'Insert timestamp at cursor',
     editorCallback: (editor: Editor) => {
       const timestamp = this.formatTimestamp();
       editor.replaceSelection(timestamp);
     }
   });
   ```

3. **Toggle Auto-timestamp**
   ```typescript
   this.addCommand({
     id: 'toggle-auto-timestamp',
     name: 'Toggle auto-timestamp mode',
     callback: () => {
       this.settings.autoTimestamp = !this.settings.autoTimestamp;
       this.saveSettings();
       new Notice(`Auto-timestamp: ${this.settings.autoTimestamp ? 'ON' : 'OFF'}`);
     }
   });
   ```

### Phase 6: Settings UI

Create a comprehensive settings tab with:

1. **Timestamp Format**
   - Text input with format string
   - Live preview of current format

2. **Block Detection**
   - Dropdown: Header / Fence / Both
   - Header pattern input (regex)
   - Fence language input

3. **Formatting Options**
   - Prefix/suffix inputs
   - Preview display

4. **Behavior Options**
   - Toggle switches for auto-timestamp
   - Empty line handling

---

## Mobile Compatibility Considerations

### DO:
- Use `Platform.isMobile` for conditional behavior
- Test with `this.app.emulateMobile(true)`
- Use Obsidian's built-in APIs only
- Use simple regex without lookbehind

### DON'T:
- Use Node.js APIs (`fs`, `path`, etc.)
- Use Electron APIs
- Use regex lookbehind (breaks iOS Safari)
- Assume desktop-specific features

### Mobile-specific code:
```typescript
import { Platform } from 'obsidian';

// Example: Adjust UI for mobile
if (Platform.isMobile) {
  // Simplified touch-friendly UI
}
```

---

## Default Settings

```typescript
const DEFAULT_SETTINGS: TimestampBlockSettings = {
  timestampFormat: 'YYYY-MM-DD HH:mm',
  blockIdentifier: 'header',
  headerPattern: '^#{1,6}\\s*(log|journal|notes|timestamps?)\\s*$',
  fenceLanguage: 'timestamp-log',
  timestampPrefix: '[',
  timestampSuffix: '] ',
  autoTimestamp: true,
  includeOnEmptyLine: false,
};
```

---

## Testing Checklist

- [ ] Plugin loads without errors
- [ ] Settings persist across restarts
- [ ] Commands appear in command palette
- [ ] Header-based block detection works
- [ ] Fence-based block detection works
- [ ] Timestamps format correctly
- [ ] New lines get timestamps in blocks
- [ ] Works on desktop
- [ ] Works on mobile (iOS and Android)
- [ ] No console errors
- [ ] Performance is acceptable with large files

---

## Future Enhancements

1. **Multiple timestamp formats per block**
2. **Block templates (customizable insertion)**
3. **Export timestamped entries to separate file**
4. **Calendar view of log entries**
5. **Search/filter by date range**
6. **Sync with external logging systems**
