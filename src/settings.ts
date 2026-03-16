import { App, PluginSettingTab, Setting } from "obsidian";
import type PwbsPlugin from "./main";

export interface PwbsSettings {
  apiUrl: string;
  apiToken: string;
  excludedFolders: string;
  autoSyncMinutes: number;
}

export const DEFAULT_SETTINGS: PwbsSettings = {
  apiUrl: "https://api.pwbs.app",
  apiToken: "",
  excludedFolders: "",
  autoSyncMinutes: 0,
};

export class PwbsSettingTab extends PluginSettingTab {
  plugin: PwbsPlugin;

  constructor(app: App, plugin: PwbsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "PWBS \u2013 Einstellungen" });

    // Connection section
    containerEl.createEl("h3", { text: "Verbindung" });

    new Setting(containerEl)
      .setName("API URL")
      .setDesc("Die URL deiner PWBS-Instanz")
      .addText((text) =>
        text
          .setPlaceholder("https://api.pwbs.app")
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiUrl = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("API Token")
      .setDesc(
        "Dein pers\u00f6nlicher API-Token. Findest du unter pwbs.app \u2192 Einstellungen \u2192 API.",
      )
      .addText((text) => {
        text
          .setPlaceholder("pwbs_xxxxxxxxxxxxxxxx")
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });

    const testBtn = new Setting(containerEl)
      .setName("Verbindung testen")
      .setDesc("Pr\u00fcft ob API-URL und Token korrekt sind");

    testBtn.addButton((btn) =>
      btn.setButtonText("Testen").onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText("Teste\u2026");
        try {
          const user = await this.plugin.api.getMe();
          testBtn.setDesc(`\u2705 Verbunden als ${user.display_name}`);
        } catch (e) {
          testBtn.setDesc(
            `\u274c ${e instanceof Error ? e.message : "Verbindungsfehler"}`,
          );
        } finally {
          btn.setDisabled(false);
          btn.setButtonText("Testen");
        }
      }),
    );

    // Sync section
    containerEl.createEl("h3", { text: "Synchronisation" });

    new Setting(containerEl)
      .setName("Ausgeschlossene Ordner")
      .setDesc(
        "Komma-getrennte Liste von Ordnern die nicht synchronisiert werden (z.B. private,archiv)",
      )
      .addText((text) =>
        text
          .setPlaceholder("private,archiv,templates")
          .setValue(this.plugin.settings.excludedFolders)
          .onChange(async (value) => {
            this.plugin.settings.excludedFolders = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Auto-Sync (Minuten)")
      .setDesc("Automatische Synchronisation alle X Minuten. 0 = deaktiviert.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 120, 15)
          .setValue(this.plugin.settings.autoSyncMinutes)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.autoSyncMinutes = value;
            await this.plugin.saveSettings();
            this.plugin.restartAutoSync();
          }),
      );

    // Info section
    containerEl.createEl("h3", { text: "\u00dcber PWBS" });
    containerEl.createEl("p", {
      text: "PWBS verwandelt dein Wissen in kontextbezogene Briefings \u2013 morgens, vor Meetings oder f\u00fcr Projekte.",
      cls: "setting-item-description",
    });
    containerEl.createEl("a", {
      text: "\u2192 Mehr erfahren auf pwbs.app",
      href: "https://pwbs.app",
    });
  }
}
