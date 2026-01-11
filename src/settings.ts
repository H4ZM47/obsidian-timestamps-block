import { App, PluginSettingTab, Setting } from 'obsidian';
import { TimestampBlockSettings, BlockIdentifier } from './types';
import TimestampBlockPlugin from './main';

/**
 * Settings tab for the Timestamps Block plugin
 */
export class TimestampBlockSettingTab extends PluginSettingTab {
  plugin: TimestampBlockPlugin;

  constructor(app: App, plugin: TimestampBlockPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Timestamps Block Settings' });

    // Timestamp Format Section
    containerEl.createEl('h3', { text: 'Timestamp Format' });

    new Setting(containerEl)
      .setName('Timestamp format')
      .setDesc('moment.js format string (e.g., YYYY-MM-DD HH:mm)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD HH:mm')
        .setValue(this.plugin.settings.timestampFormat)
        .onChange(async (value) => {
          this.plugin.settings.timestampFormat = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    new Setting(containerEl)
      .setName('Timestamp prefix')
      .setDesc('Text before the timestamp (e.g., [)')
      .addText(text => text
        .setPlaceholder('[')
        .setValue(this.plugin.settings.timestampPrefix)
        .onChange(async (value) => {
          this.plugin.settings.timestampPrefix = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    new Setting(containerEl)
      .setName('Timestamp suffix')
      .setDesc('Text after the timestamp (e.g., ] )')
      .addText(text => text
        .setPlaceholder('] ')
        .setValue(this.plugin.settings.timestampSuffix)
        .onChange(async (value) => {
          this.plugin.settings.timestampSuffix = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    // Preview
    const previewContainer = containerEl.createDiv({ cls: 'timestamp-preview-container' });
    previewContainer.createEl('strong', { text: 'Preview: ' });
    this.previewEl = previewContainer.createSpan({ cls: 'timestamp-preview' });
    this.updatePreview();

    // Block Detection Section
    containerEl.createEl('h3', { text: 'Block Detection' });

    new Setting(containerEl)
      .setName('Block identifier')
      .setDesc('How to identify timestamp blocks')
      .addDropdown(dropdown => dropdown
        .addOption('header', 'Header-based (## Log)')
        .addOption('fence', 'Fence-based (```timestamp-log)')
        .addOption('both', 'Both methods')
        .setValue(this.plugin.settings.blockIdentifier)
        .onChange(async (value: BlockIdentifier) => {
          this.plugin.settings.blockIdentifier = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide relevant options
        }));

    // Header settings
    if (this.plugin.settings.blockIdentifier === 'header' ||
        this.plugin.settings.blockIdentifier === 'both') {
      new Setting(containerEl)
        .setName('Header pattern')
        .setDesc('Regex pattern to match headers (case-insensitive)')
        .addText(text => text
          .setPlaceholder('^#{1,6}\\s*(log|journal)\\s*$')
          .setValue(this.plugin.settings.headerPattern)
          .onChange(async (value) => {
            this.plugin.settings.headerPattern = value;
            await this.plugin.saveSettings();
          }));
    }

    // Fence settings
    if (this.plugin.settings.blockIdentifier === 'fence' ||
        this.plugin.settings.blockIdentifier === 'both') {
      new Setting(containerEl)
        .setName('Fence language')
        .setDesc('Code fence language identifier')
        .addText(text => text
          .setPlaceholder('timestamp-log')
          .setValue(this.plugin.settings.fenceLanguage)
          .onChange(async (value) => {
            this.plugin.settings.fenceLanguage = value;
            await this.plugin.saveSettings();
          }));
    }

    // Behavior Section
    containerEl.createEl('h3', { text: 'Behavior' });

    new Setting(containerEl)
      .setName('Auto-timestamp')
      .setDesc('Automatically add timestamp when pressing Enter in a timestamp block')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoTimestamp)
        .onChange(async (value) => {
          this.plugin.settings.autoTimestamp = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Timestamp empty lines')
      .setDesc('Add timestamp even when creating an empty line')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeOnEmptyLine)
        .onChange(async (value) => {
          this.plugin.settings.includeOnEmptyLine = value;
          await this.plugin.saveSettings();
        }));

    // Help Section
    containerEl.createEl('h3', { text: 'Help' });

    const helpDiv = containerEl.createDiv({ cls: 'timestamp-help' });
    helpDiv.createEl('p', {
      text: 'Common moment.js format tokens:'
    });

    const formatList = helpDiv.createEl('ul');
    const formats = [
      'YYYY - 4-digit year (2024)',
      'MM - 2-digit month (01-12)',
      'DD - 2-digit day (01-31)',
      'HH - 24-hour (00-23)',
      'mm - Minutes (00-59)',
      'ss - Seconds (00-59)',
      'ddd - Short day name (Mon)',
      'dddd - Full day name (Monday)',
    ];
    formats.forEach(f => formatList.createEl('li', { text: f }));

    helpDiv.createEl('p', {
      text: 'Example formats:'
    });

    const exampleList = helpDiv.createEl('ul');
    const examples = [
      'YYYY-MM-DD HH:mm - 2024-01-15 14:30',
      'HH:mm:ss - 14:30:45',
      'ddd MMM D, YYYY - Mon Jan 15, 2024',
      'YYYY/MM/DD - 2024/01/15',
    ];
    examples.forEach(e => exampleList.createEl('li', { text: e }));
  }

  private previewEl: HTMLElement | null = null;

  private updatePreview(): void {
    if (this.previewEl) {
      const preview = this.plugin.timestampService.getFormatPreview();
      this.previewEl.setText(preview);
    }
  }
}
