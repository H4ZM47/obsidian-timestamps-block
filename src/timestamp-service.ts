import { TimestampBlockSettings } from './types';

/**
 * Service for formatting timestamps
 */
export class TimestampService {
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
   * Format current time using the configured format
   */
  formatTimestamp(format?: string): string {
    const formatStr = format || this.settings.timestampFormat;
    return window.moment().format(formatStr);
  }

  /**
   * Create a full timestamp string with prefix and suffix
   */
  createFullTimestamp(): string {
    const timestamp = this.formatTimestamp();
    return `${this.settings.timestampPrefix}${timestamp}${this.settings.timestampSuffix}`;
  }

  /**
   * Create a timestamped line
   */
  createTimestampedLine(content: string): string {
    return `${this.createFullTimestamp()}${content}`;
  }

  /**
   * Check if a line already has a timestamp
   * Uses a simple heuristic based on the prefix
   */
  lineHasTimestamp(line: string): boolean {
    const trimmed = line.trimStart();
    const prefix = this.settings.timestampPrefix;

    if (!prefix) {
      return false;
    }

    // Check if line starts with the timestamp prefix
    if (!trimmed.startsWith(prefix)) {
      return false;
    }

    // Try to find a matching suffix
    const suffix = this.settings.timestampSuffix;
    if (suffix) {
      const suffixIndex = trimmed.indexOf(suffix, prefix.length);
      // Timestamp should be within reasonable length (e.g., within first 50 chars)
      return suffixIndex > prefix.length && suffixIndex < 50;
    }

    return true;
  }

  /**
   * Get a preview of the current timestamp format
   */
  getFormatPreview(): string {
    return this.createFullTimestamp();
  }
}
