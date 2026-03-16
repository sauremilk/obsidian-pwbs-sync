import { ItemView, WorkspaceLeaf, MarkdownRenderer } from "obsidian";
import { PwbsAPI, PwbsAuthError, type BriefingResponse } from "./api";

export const BRIEFING_VIEW_TYPE = "pwbs-briefing-view";

export class BriefingView extends ItemView {
  private api: PwbsAPI;

  constructor(leaf: WorkspaceLeaf, api: PwbsAPI) {
    super(leaf);
    this.api = api;
  }

  getViewType(): string {
    return BRIEFING_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "PWBS Briefing";
  }

  getIcon(): string {
    return "zap";
  }

  async onOpen(): Promise<void> {
    await this.renderContent();
  }

  async refresh(): Promise<void> {
    await this.renderContent();
  }

  private async renderContent(): Promise<void> {
    const container = this.contentEl;
    container.empty();

    container.createEl("div", { cls: "pwbs-header" }, (header) => {
      header.createEl("h3", { text: "\u26a1 PWBS Briefing" });
      const refreshBtn = header.createEl("button", {
        text: "\u21bb",
        cls: "pwbs-refresh-btn",
        attr: { "aria-label": "Aktualisieren" },
      });
      refreshBtn.addEventListener("click", () => this.refresh());
    });

    if (!this.api.isConfigured) {
      this.renderSetupPrompt(container);
      return;
    }

    try {
      container.createEl("p", {
        text: "Briefing wird geladen\u2026",
        cls: "pwbs-loading",
      });

      const briefing = await this.api.getLatestBriefing();
      container.empty();

      container.createEl("div", { cls: "pwbs-header" }, (header) => {
        header.createEl("h3", { text: "\u26a1 PWBS Briefing" });
        const refreshBtn = header.createEl("button", {
          text: "\u21bb",
          cls: "pwbs-refresh-btn",
          attr: { "aria-label": "Aktualisieren" },
        });
        refreshBtn.addEventListener("click", () => this.refresh());
      });

      if (!briefing) {
        this.renderNoBriefing(container);
        return;
      }

      this.renderBriefing(container, briefing);
    } catch (e) {
      container.querySelector(".pwbs-loading")?.remove();

      if (e instanceof PwbsAuthError) {
        container.createEl("p", {
          text: "\u26a0\ufe0f Token ung\u00fcltig. Bitte in den Einstellungen aktualisieren.",
          cls: "pwbs-error",
        });
      } else {
        container.createEl("p", {
          text: `Fehler: ${e instanceof Error ? e.message : "Unbekannter Fehler"}`,
          cls: "pwbs-error",
        });
      }
    }
  }

  private renderSetupPrompt(container: HTMLElement): void {
    const setup = container.createEl("div", { cls: "pwbs-setup" });
    setup.createEl("p", {
      text: "Verbinde Obsidian mit PWBS f\u00fcr AI-gest\u00fctzte Briefings:",
    });
    const steps = setup.createEl("ol");
    steps.createEl("li", {
      text: "Erstelle ein kostenloses Konto auf pwbs.app",
    });
    steps.createEl("li", { text: "Kopiere deinen API-Token aus den Settings" });
    steps.createEl("li", {
      text: 'F\u00fcge ihn in die Plugin-Einstellungen ein (\u2699\ufe0f \u2192 "PWBS")',
    });

    setup.createEl("a", {
      text: "\u2192 Jetzt kostenlos starten",
      href: "https://pwbs.app/signup",
      cls: "pwbs-cta",
    });
  }

  private renderNoBriefing(container: HTMLElement): void {
    const empty = container.createEl("div", { cls: "pwbs-empty" });
    empty.createEl("p", {
      text: "Noch kein Briefing vorhanden.",
    });
    empty.createEl("p", {
      text: "Synchronisiere deinen Vault (Cmd/Ctrl+P \u2192 'PWBS: Vault synchronisieren'), damit PWBS dein erstes Briefing erstellen kann.",
      cls: "pwbs-hint",
    });
  }

  private renderBriefing(
    container: HTMLElement,
    briefing: BriefingResponse,
  ): void {
    const wrapper = container.createEl("div", { cls: "pwbs-briefing" });

    const meta = wrapper.createEl("div", { cls: "pwbs-meta" });
    const date = new Date(briefing.created_at);
    meta.createEl("span", {
      text: date.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      cls: "pwbs-date",
    });
    meta.createEl("span", {
      text: briefing.type.replace("_", " "),
      cls: "pwbs-type",
    });

    const content = wrapper.createEl("div", { cls: "pwbs-content" });
    MarkdownRenderer.render(this.app, briefing.content, content, "", this);

    if (briefing.sources.length > 0) {
      const sources = wrapper.createEl("details", { cls: "pwbs-sources" });
      sources.createEl("summary", {
        text: `${briefing.sources.length} Quellen`,
      });
      const list = sources.createEl("ul");
      for (const src of briefing.sources) {
        list.createEl("li", {
          text: `${src.title} (${src.source_type})`,
        });
      }
    }
  }
}
