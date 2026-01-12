import {
  App,
  Editor,
  MarkdownView,
  Notice,
  Plugin
} from 'obsidian';
import {
  TimestampBlockSettings,
  DEFAULT_SETTINGS
} from './types';
import { TimestampService } from './timestamp-service';
import { BlockDetector } from './block-detector';
import { TimestampBlockSettingTab } from './settings';

/**
 * Timestamps Block Plugin for Obsidian
 *
 * Allows users to create blocks where new lines are automatically
 * prepended with configurable timestamps.
 */
export default class TimestampBlockPlugin extends Plugin {
  settings: TimestampBlockSettings;
  timestampService: TimestampService;
  blockDetector: BlockDetector;

  async onload(): Promise<void> {
    console.log('Loading Timestamps Block plugin');

    // Load settings
    await this.loadSettings();

    // Initialize services
    this.timestampService = new TimestampService(this.settings);
    this.blockDetector = new BlockDetector(this.settings);

    // Register commands
    this.registerCommands();

    // Register editor event for auto-timestamping
    this.registerEditorEvents();

    // Add settings tab
    this.addSettingTab(new TimestampBlockSettingTab(this.app, this));
  }

  onunload(): void {
    console.log('Unloading Timestamps Block plugin');
  }

  /**
   * Register all plugin commands
   */
  private registerCommands(): void {
    // Insert timestamp at cursor
    this.addCommand({
      id: 'insert-timestamp',
      name: 'Insert timestamp at cursor',
      editorCallback: (editor: Editor) => {
        const timestamp = this.timestampService.createFullTimestamp();
        editor.replaceSelection(timestamp);
      }
    });

    // Insert timestamped block (header-based)
    this.addCommand({
      id: 'insert-timestamp-block-header',
      name: 'Insert timestamped block (header)',
      editorCallback: (editor: Editor) => {
        const cursor = editor.getCursor();
        const blockTemplate = this.createHeaderBlockTemplate();
        editor.replaceRange(blockTemplate, cursor);

        // Move cursor to the content line
        const newLine = cursor.line + 2;
        const timestamp = this.timestampService.createFullTimestamp();
        editor.setCursor({ line: newLine, ch: timestamp.length });
      }
    });

    // Insert timestamped block (fence-based)
    this.addCommand({
      id: 'insert-timestamp-block-fence',
      name: 'Insert timestamped block (fence)',
      editorCallback: (editor: Editor) => {
        const cursor = editor.getCursor();
        const blockTemplate = this.createFenceBlockTemplate();
        editor.replaceRange(blockTemplate, cursor);

        // Move cursor to the content line
        const newLine = cursor.line + 1;
        const timestamp = this.timestampService.createFullTimestamp();
        editor.setCursor({ line: newLine, ch: timestamp.length });
      }
    });

    // Toggle auto-timestamp
    this.addCommand({
      id: 'toggle-auto-timestamp',
      name: 'Toggle auto-timestamp mode',
      callback: () => {
        this.settings.autoTimestamp = !this.settings.autoTimestamp;
        this.saveSettings();
        new Notice(`Auto-timestamp: ${this.settings.autoTimestamp ? 'ON' : 'OFF'}`);
      }
    });

    // Insert timestamp on current line (even outside blocks)
    this.addCommand({
      id: 'timestamp-current-line',
      name: 'Add timestamp to current line',
      editorCallback: (editor: Editor) => {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Check if line already has timestamp
        if (this.timestampService.lineHasTimestamp(line)) {
          new Notice('Line already has a timestamp');
          return;
        }

        // Get leading whitespace
        const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
        const content = line.trimStart();

        const timestampedLine = leadingWhitespace +
          this.timestampService.createTimestampedLine(content);

        editor.setLine(cursor.line, timestampedLine);
      }
    });
  }

  /**
   * Register editor events for auto-timestamping
   */
  private registerEditorEvents(): void {
    // Handle Enter key for auto-timestamping
    this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      // Only handle Enter key
      if (evt.key !== 'Enter' || evt.isComposing) {
        return;
      }

      // Check if auto-timestamp is enabled
      if (!this.settings.autoTimestamp) {
        return;
      }

      // Get active editor
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        return;
      }

      const editor = view.editor;
      const cursor = editor.getCursor();

      // Check if we're in a timestamp block
      if (!this.blockDetector.isInTimestampBlock(editor, cursor.line)) {
        return;
      }

      // Schedule timestamp insertion after the new line is created
      // Using setTimeout to let the Enter key create the new line first
      setTimeout(() => {
        this.insertTimestampOnNewLine(editor);
      }, 0);
    });
  }

  /**
   * Insert timestamp on the current (new) line
   */
  private insertTimestampOnNewLine(editor: Editor): void {
    const cursor = editor.getCursor();
    const currentLine = editor.getLine(cursor.line);

    // Check if line is empty or only whitespace
    const isEmptyLine = currentLine.trim() === '';

    if (isEmptyLine && !this.settings.includeOnEmptyLine) {
      // Don't add timestamp to empty lines if setting is off
      // But we still need to add it since the user will type something
      const timestamp = this.timestampService.createFullTimestamp();
      const leadingWhitespace = currentLine.match(/^(\s*)/)?.[1] || '';

      editor.setLine(cursor.line, leadingWhitespace + timestamp);
      editor.setCursor({
        line: cursor.line,
        ch: leadingWhitespace.length + timestamp.length
      });
      return;
    }

    // Check if line already has content (user typed fast, or Obsidian added list marker)
    if (!isEmptyLine) {
      // Check if it already has a timestamp
      if (this.timestampService.lineHasTimestamp(currentLine)) {
        return;
      }

      // Add timestamp to existing content, preserving list markers
      const leadingWhitespace = currentLine.match(/^(\s*)/)?.[1] || '';
      const content = currentLine.trimStart();

      // Check for list markers (-, *, +, or numbered like "1.")
      const listMarkerMatch = content.match(/^([-*+]|\d+\.)\s*/);

      let timestampedLine: string;
      if (listMarkerMatch) {
        // Place timestamp AFTER list marker: "- [time] content"
        const listMarker = listMarkerMatch[0];
        const restOfContent = content.slice(listMarker.length);
        timestampedLine = leadingWhitespace + listMarker +
          this.timestampService.createTimestampedLine(restOfContent);
      } else {
        // No list marker, timestamp goes at start
        timestampedLine = leadingWhitespace +
          this.timestampService.createTimestampedLine(content);
      }

      editor.setLine(cursor.line, timestampedLine);

      // Position cursor at end of timestamp
      const timestamp = this.timestampService.createFullTimestamp();
      const cursorPos = timestampedLine.indexOf(timestamp) + timestamp.length;
      editor.setCursor({ line: cursor.line, ch: cursorPos });
      return;
    }

    // Insert timestamp at cursor
    const timestamp = this.timestampService.createFullTimestamp();
    const leadingWhitespace = currentLine.match(/^(\s*)/)?.[1] || '';

    editor.setLine(cursor.line, leadingWhitespace + timestamp);
    editor.setCursor({
      line: cursor.line,
      ch: leadingWhitespace.length + timestamp.length
    });
  }

  /**
   * Create a header-based block template
   */
  private createHeaderBlockTemplate(): string {
    const timestamp = this.timestampService.createFullTimestamp();
    return `\n## Log\n${timestamp}`;
  }

  /**
   * Create a fence-based block template
   */
  private createFenceBlockTemplate(): string {
    const timestamp = this.timestampService.createFullTimestamp();
    const fenceLanguage = this.settings.fenceLanguage;
    return `\n\`\`\`${fenceLanguage}\n${timestamp}\n\`\`\`\n`;
  }

  /**
   * Load plugin settings
   */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save plugin settings
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // Update services with new settings
    if (this.timestampService) {
      this.timestampService.updateSettings(this.settings);
    }
    if (this.blockDetector) {
      this.blockDetector.updateSettings(this.settings);
    }
  }
}
