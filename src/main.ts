import {
  App,
  Editor,
  MarkdownView,
  Notice,
  Plugin
} from 'obsidian';
import { Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
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
   * Register editor events for auto-timestamping using CodeMirror 6 extensions
   * This approach works reliably on both desktop and mobile (iOS/Android)
   */
  private registerEditorEvents(): void {
    // Use CodeMirror 6 transaction filter to detect newline insertions
    const newlineExtension = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      if (!this.settings.autoTimestamp) return;

      // Check if a newline was inserted
      let newlineInserted = false;
      let insertionLine = -1;

      update.transactions.forEach((tr: Transaction) => {
        if (!tr.docChanged) return;

        tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
          const insertedText = inserted.toString();
          if (insertedText.includes('\n')) {
            newlineInserted = true;
            // Get the line number after the insertion
            const pos = fromB + insertedText.length;
            insertionLine = update.state.doc.lineAt(pos).number - 1; // 0-indexed
          }
        });
      });

      if (!newlineInserted || insertionLine < 0) return;

      // Get the Obsidian editor
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      const editor = view.editor;

      // Check if the PREVIOUS line (where we pressed Enter) was in a timestamp block
      const previousLine = insertionLine - 1;
      if (previousLine < 0) return;

      if (!this.blockDetector.isInTimestampBlock(editor, previousLine)) {
        return;
      }

      // Also verify the new line is still in the block
      if (!this.blockDetector.isInTimestampBlock(editor, insertionLine)) {
        return;
      }

      // Use requestAnimationFrame to ensure the editor state is fully updated
      requestAnimationFrame(() => {
        this.insertTimestampOnLine(editor, insertionLine);
      });
    });

    this.registerEditorExtension(newlineExtension);
  }

  /**
   * Insert timestamp on a specific line
   */
  private insertTimestampOnLine(editor: Editor, lineNumber: number): void {
    const currentLine = editor.getLine(lineNumber);
    if (currentLine === undefined) return;

    // Check if line already has a timestamp
    if (this.timestampService.lineHasTimestamp(currentLine)) {
      return;
    }

    const isEmptyLine = currentLine.trim() === '';
    const leadingWhitespace = currentLine.match(/^(\s*)/)?.[1] || '';
    const content = currentLine.trimStart();

    // Check for list markers (-, *, +, or numbered like "1.")
    const listMarkerMatch = content.match(/^([-*+]|\d+\.)\s*/);

    let timestampedLine: string;
    let cursorOffset: number;

    if (listMarkerMatch) {
      // Place timestamp AFTER list marker: "- [time] content"
      const listMarker = listMarkerMatch[0];
      const restOfContent = content.slice(listMarker.length);
      const timestamp = this.timestampService.createFullTimestamp();
      timestampedLine = leadingWhitespace + listMarker + timestamp + restOfContent;
      cursorOffset = leadingWhitespace.length + listMarker.length + timestamp.length;
    } else if (isEmptyLine) {
      // Empty line - just add timestamp
      const timestamp = this.timestampService.createFullTimestamp();
      timestampedLine = leadingWhitespace + timestamp;
      cursorOffset = leadingWhitespace.length + timestamp.length;
    } else {
      // Has content, prepend timestamp
      const timestamp = this.timestampService.createFullTimestamp();
      timestampedLine = leadingWhitespace + timestamp + content;
      cursorOffset = leadingWhitespace.length + timestamp.length;
    }

    editor.setLine(lineNumber, timestampedLine);
    editor.setCursor({ line: lineNumber, ch: cursorOffset });
  }

  /**
   * Create a header-based block template
   */
  private createHeaderBlockTemplate(): string {
    const timestamp = this.timestampService.createFullTimestamp();
    const header = this.settings.headerText || '## Log';
    return `\n${header}\n${timestamp}`;
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
