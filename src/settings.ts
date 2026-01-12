import { App, PluginSettingTab, Setting } from 'obsidian';
import { TimestampBlockSettings, BlockIdentifier } from './types';
import TimestampBlockPlugin from './main';

/**
 * Settings tab for the Timestamps Block plugin
 */
export class TimestampBlockSettingTab extends PluginSettingTab {
  plugin: TimestampBlockPlugin;
  private previewSetting: Setting | null = null;

  constructor(app: App, plugin: TimestampBlockPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Timestamp Format Section
    containerEl.createEl('h2', { text: 'Timestamp Format' });

    new Setting(containerEl)
      .setName('Format string')
      .setDesc('moment.js format (e.g., YYYY-MM-DD HH:mm, HH:mm:ss)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD HH:mm')
        .setValue(this.plugin.settings.timestampFormat)
        .onChange(async (value) => {
          this.plugin.settings.timestampFormat = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    new Setting(containerEl)
      .setName('Prefix')
      .setDesc('Text before the timestamp')
      .addText(text => text
        .setPlaceholder('[')
        .setValue(this.plugin.settings.timestampPrefix)
        .onChange(async (value) => {
          this.plugin.settings.timestampPrefix = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    new Setting(containerEl)
      .setName('Suffix')
      .setDesc('Text after the timestamp')
      .addText(text => text
        .setPlaceholder('] ')
        .setValue(this.plugin.settings.timestampSuffix)
        .onChange(async (value) => {
          this.plugin.settings.timestampSuffix = value;
          await this.plugin.saveSettings();
          this.updatePreview();
        }));

    // Preview as a proper Setting component
    this.previewSetting = new Setting(containerEl)
      .setName('Preview')
      .setDesc(this.createPreviewFragment());

    // Block Detection Section
    containerEl.createEl('h2', { text: 'Block Detection' });

    new Setting(containerEl)
      .setName('Detection method')
      .setDesc('How to identify timestamp blocks in your notes')
      .addDropdown(dropdown => dropdown
        .addOption('header', 'Header-based (## Log)')
        .addOption('fence', 'Fence-based (```timestamp-log)')
        .addOption('both', 'Both methods')
        .setValue(this.plugin.settings.blockIdentifier)
        .onChange(async (value: BlockIdentifier) => {
          this.plugin.settings.blockIdentifier = value;
          await this.plugin.saveSettings();
          this.display();
        }));

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
    containerEl.createEl('h2', { text: 'Behavior' });

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

    // Format Reference Section
    containerEl.createEl('h2', { text: 'Format Reference' });

    new Setting(containerEl)
      .setName('Common format tokens')
      .setDesc(this.createFormatReferenceFragment());
  }

  private createPreviewFragment(): DocumentFragment {
    const frag = document.createDocumentFragment();
    const preview = this.plugin.timestampService.getFormatPreview();

    const wrapper = frag.createEl('div', { cls: 'setting-item-description' });

    // Standard line preview
    const standardRow = wrapper.createEl('div');
    standardRow.createEl('span', { text: 'Standard: ' });
    standardRow.createEl('code', { text: preview, cls: 'timestamp-preview-code' });

    // List context preview
    const listRow = wrapper.createEl('div');
    listRow.createEl('span', { text: 'In a list: ' });
    listRow.createEl('code', { text: '- ' + preview, cls: 'timestamp-preview-code' });

    return frag;
  }

  private createFormatReferenceFragment(): DocumentFragment {
    const frag = document.createDocumentFragment();

    const tokens = [
      ['YYYY', '4-digit year'],
      ['MM', '2-digit month'],
      ['DD', '2-digit day'],
      ['HH', '24-hour'],
      ['mm', 'minutes'],
      ['ss', 'seconds'],
      ['ddd', 'short day (Mon)'],
    ];

    const wrapper = frag.createEl('div', { cls: 'timestamp-format-reference' });
    tokens.forEach(([token, desc]) => {
      const item = wrapper.createEl('span', { cls: 'timestamp-format-token' });
      item.createEl('code', { text: token });
      item.createEl('span', { text: ` ${desc}` });
      wrapper.createEl('span', { text: ' · ' });
    });

    return frag;
  }

  private updatePreview(): void {
    if (this.previewSetting) {
      this.previewSetting.setDesc(this.createPreviewFragment());
    }
  }
}
