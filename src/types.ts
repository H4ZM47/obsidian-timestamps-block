/**
 * Block identifier type
 */
export type BlockIdentifier = 'header' | 'fence' | 'both';

/**
 * Plugin settings interface
 */
export interface TimestampBlockSettings {
  /** moment.js format string for timestamps */
  timestampFormat: string;

  /** How to identify timestamp blocks */
  blockIdentifier: BlockIdentifier;

  /** Simple header text to match (e.g., "## Log") */
  headerText: string;

  /** Whether to use advanced regex pattern instead of simple header text */
  useAdvancedHeaderPattern: boolean;

  /** Regex pattern for matching headers (case-insensitive) - used when useAdvancedHeaderPattern is true */
  headerPattern: string;

  /** Language identifier for code fences */
  fenceLanguage: string;

  /** Text to prepend before timestamp */
  timestampPrefix: string;

  /** Text to append after timestamp */
  timestampSuffix: string;

  /** Automatically add timestamp on new line in blocks */
  autoTimestamp: boolean;

  /** Add timestamp even for empty lines */
  includeOnEmptyLine: boolean;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: TimestampBlockSettings = {
  timestampFormat: 'YYYY-MM-DD HH:mm',
  blockIdentifier: 'header',
  headerText: '## Log',
  useAdvancedHeaderPattern: false,
  headerPattern: '^#{1,6}\\s*(log|journal|notes|timestamps?)\\s*$',
  fenceLanguage: 'timestamp-log',
  timestampPrefix: '[',
  timestampSuffix: '] ',
  autoTimestamp: true,
  includeOnEmptyLine: false,
};

/**
 * Block boundaries
 */
export interface BlockBoundaries {
  start: number;
  end: number;
  type: 'header' | 'fence';
}
