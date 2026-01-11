# Timestamps Block

A mobile and desktop compatible Obsidian plugin for creating timestamped log blocks in your notes.

## Features

- **Timestamped Blocks**: Create designated sections where new lines are automatically prepended with timestamps
- **Configurable Format**: Use any moment.js format string (e.g., `YYYY-MM-DD HH:mm`, `HH:mm:ss`)
- **Flexible Detection**: Identify timestamp blocks by header pattern or code fence
- **Cross-Platform**: Works on desktop AND mobile (iOS, Android)
- **Commands**: Quick commands to insert timestamps and timestamped blocks

## Installation

### From Obsidian Community Plugins
1. Open Settings > Community plugins
2. Disable Safe mode
3. Click Browse and search for "Timestamps Block"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract to your vault's `.obsidian/plugins/timestamps-block/` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community plugins

## Usage

### Creating Timestamped Blocks

**Method 1: Header-based** (default)

Create a header that matches the configured pattern (default: `## Log`, `## Journal`, `## Notes`, etc.):

```markdown
## Log
[2024-01-15 14:30] Started working on the project
[2024-01-15 14:45] Completed initial setup
[2024-01-15 15:00] Running into issues with configuration
```

**Method 2: Fence-based**

Use a code fence with the configured language (default: `timestamp-log`):

````markdown
```timestamp-log
[2024-01-15 14:30] First entry
[2024-01-15 14:45] Second entry
```
````

### Commands

Access these commands via the Command Palette (Ctrl/Cmd + P):

| Command | Description |
|---------|-------------|
| **Insert timestamp at cursor** | Insert a formatted timestamp at the current cursor position |
| **Insert timestamped block (header)** | Insert a new header-based timestamp block |
| **Insert timestamped block (fence)** | Insert a new fence-based timestamp block |
| **Add timestamp to current line** | Prepend a timestamp to the current line |
| **Toggle auto-timestamp mode** | Enable/disable automatic timestamping |

### Auto-Timestamping

When enabled (default), pressing Enter while inside a timestamp block will automatically add a timestamp to the new line.

## Settings

### Timestamp Format
- **Timestamp format**: moment.js format string (default: `YYYY-MM-DD HH:mm`)
- **Timestamp prefix**: Text before the timestamp (default: `[`)
- **Timestamp suffix**: Text after the timestamp (default: `] `)

### Block Detection
- **Block identifier**: Choose `Header`, `Fence`, or `Both`
- **Header pattern**: Regex pattern for matching headers (default matches Log, Journal, Notes, Timestamps)
- **Fence language**: Code fence language identifier (default: `timestamp-log`)

### Behavior
- **Auto-timestamp**: Automatically add timestamp on new lines in blocks
- **Timestamp empty lines**: Add timestamp even for empty lines

## Format Examples

| Format | Output |
|--------|--------|
| `YYYY-MM-DD HH:mm` | 2024-01-15 14:30 |
| `HH:mm:ss` | 14:30:45 |
| `ddd MMM D, YYYY` | Mon Jan 15, 2024 |
| `YYYY/MM/DD` | 2024/01/15 |
| `h:mm A` | 2:30 PM |

## Development

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

H4ZM47
