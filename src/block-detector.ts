import { Editor } from 'obsidian';
import { TimestampBlockSettings, BlockBoundaries } from './types';

/**
 * Service for detecting timestamp blocks in the editor
 */
export class BlockDetector {
  private settings: TimestampBlockSettings;

  constructor(settings: TimestampBlockSettings) {
    this.settings = settings;
  }

  /**
   * Update settings reference
   */
  updateSettings(settings: TimestampBlockSettings): void {
    this.settings = settings;
  }

  /**
   * Check if the cursor is currently inside a timestamp block
   */
  isInTimestampBlock(editor: Editor, line: number): boolean {
    const identifier = this.settings.blockIdentifier;

    if (identifier === 'header' || identifier === 'both') {
      if (this.isUnderTimestampHeader(editor, line)) {
        return true;
      }
    }

    if (identifier === 'fence' || identifier === 'both') {
      if (this.isInTimestampFence(editor, line)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a line matches the configured header pattern
   */
  private matchesHeaderPattern(lineText: string): boolean {
    if (this.settings.useAdvancedHeaderPattern) {
      // Use regex pattern
      try {
        const headerRegex = new RegExp(this.settings.headerPattern, 'i');
        return headerRegex.test(lineText);
      } catch (e) {
        // Invalid regex, fall back to simple matching
        return lineText.trim().toLowerCase() === this.settings.headerText.trim().toLowerCase();
      }
    } else {
      // Simple text matching (case-insensitive)
      return lineText.trim().toLowerCase() === this.settings.headerText.trim().toLowerCase();
    }
  }

  /**
   * Check if the current line is under a timestamp header
   */
  private isUnderTimestampHeader(editor: Editor, line: number): boolean {
    // Generic header pattern to detect any header
    const anyHeaderRegex = /^#{1,6}\s/;

    // Search backwards from current line to find a header
    for (let i = line - 1; i >= 0; i--) {
      const lineText = editor.getLine(i);

      // Check if this is any header
      if (anyHeaderRegex.test(lineText)) {
        // If it matches our timestamp header pattern, we're in a block
        if (this.matchesHeaderPattern(lineText)) {
          return true;
        }
        // If it's a different header, we've left the potential timestamp section
        return false;
      }
    }

    return false;
  }

  /**
   * Check if the cursor is inside a timestamp fence block
   */
  private isInTimestampFence(editor: Editor, line: number): boolean {
    const fenceLanguage = this.settings.fenceLanguage;
    const fenceStart = '```' + fenceLanguage;
    const fenceEnd = '```';

    let inFence = false;
    let fenceStartLine = -1;

    for (let i = 0; i <= line; i++) {
      const lineText = editor.getLine(i).trim();

      if (!inFence && lineText.startsWith(fenceStart)) {
        inFence = true;
        fenceStartLine = i;
      } else if (inFence && lineText === fenceEnd && i > fenceStartLine) {
        inFence = false;
      }
    }

    return inFence;
  }

  /**
   * Find the boundaries of the current timestamp block
   */
  findBlockBoundaries(editor: Editor, line: number): BlockBoundaries | null {
    const identifier = this.settings.blockIdentifier;

    // Check fence first (more specific)
    if (identifier === 'fence' || identifier === 'both') {
      const fenceBounds = this.findFenceBoundaries(editor, line);
      if (fenceBounds) {
        return fenceBounds;
      }
    }

    // Check header
    if (identifier === 'header' || identifier === 'both') {
      const headerBounds = this.findHeaderBoundaries(editor, line);
      if (headerBounds) {
        return headerBounds;
      }
    }

    return null;
  }

  /**
   * Find boundaries of a fence block
   */
  private findFenceBoundaries(editor: Editor, line: number): BlockBoundaries | null {
    const fenceLanguage = this.settings.fenceLanguage;
    const fenceStart = '```' + fenceLanguage;
    const fenceEnd = '```';

    let startLine = -1;
    let inFence = false;

    // Find the start of the fence
    for (let i = 0; i <= line; i++) {
      const lineText = editor.getLine(i).trim();

      if (!inFence && lineText.startsWith(fenceStart)) {
        inFence = true;
        startLine = i;
      } else if (inFence && lineText === fenceEnd && i > startLine) {
        inFence = false;
        startLine = -1;
      }
    }

    if (!inFence || startLine === -1) {
      return null;
    }

    // Find the end of the fence
    const lineCount = editor.lineCount();
    for (let i = line + 1; i < lineCount; i++) {
      const lineText = editor.getLine(i).trim();
      if (lineText === fenceEnd) {
        return {
          start: startLine + 1, // Content starts after fence opener
          end: i - 1,           // Content ends before fence closer
          type: 'fence'
        };
      }
    }

    // No closing fence found, extend to end of document
    return {
      start: startLine + 1,
      end: lineCount - 1,
      type: 'fence'
    };
  }

  /**
   * Find boundaries of a header-based block
   */
  private findHeaderBoundaries(editor: Editor, line: number): BlockBoundaries | null {
    const anyHeaderRegex = /^#{1,6}\s/;
    let startLine = -1;
    let headerLevel = 0;

    // Find the header that starts this block
    for (let i = line - 1; i >= 0; i--) {
      const lineText = editor.getLine(i);

      if (anyHeaderRegex.test(lineText)) {
        if (this.matchesHeaderPattern(lineText)) {
          startLine = i;
          // Extract header level
          const match = lineText.match(/^(#{1,6})/);
          headerLevel = match ? match[1].length : 1;
          break;
        }
        // Hit a different header, not in a timestamp block
        return null;
      }
    }

    if (startLine === -1) {
      return null;
    }

    // Find the end of the block (next header of same or higher level, or end of doc)
    const lineCount = editor.lineCount();
    const sameOrHigherHeader = new RegExp(`^#{1,${headerLevel}}\\s`);

    for (let i = line + 1; i < lineCount; i++) {
      const lineText = editor.getLine(i);
      if (sameOrHigherHeader.test(lineText)) {
        return {
          start: startLine + 1,
          end: i - 1,
          type: 'header'
        };
      }
    }

    return {
      start: startLine + 1,
      end: lineCount - 1,
      type: 'header'
    };
  }
}
