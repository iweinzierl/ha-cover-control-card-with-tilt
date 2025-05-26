// ha-cover-control-card-with-tilt.js

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class HaCoverControlCardWithTilt extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  constructor() {
    super();
    this._hass = {};
    this._config = {};
    this.entityState = null;
    this.tiltPresets = [0, 20, 40, 50, 60, 80, 100]; // Tilt-Voreinstellungen [cite: 1]
  }

  static async getConfigElement() {
    // Die JavaScript-Datei für das Editor-Element dynamisch importieren.
    // Stellen Sie sicher, dass der Pfad korrekt ist, relativ zu dieser Datei,
    // oder absolut, wenn Sie es anders im www-Ordner ablegen.
    // Wenn beide Dateien im selben Ordner im www-Verzeichnis liegen:
    await import("./ha-cover-control-card-with-tilt-editor.js");
    return document.createElement("ha-cover-control-card-with-tilt-editor");
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    const coverEntity =
      entities.find((eid) => eid.startsWith("cover.")) ||
      entitiesFallback.find((eid) => eid.startsWith("cover."));
    return {
      entity: coverEntity || "cover.example_cover",
      name: "Meine Cover Steuerung", // Standardname für neue Karten
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error(
        "Die Entität (entity) muss in der Konfiguration definiert sein."
      );
    }
    if (config.entity.split(".")[0] !== "cover") {
      console.warn(
        `Warnung: Die konfigurierte Entität '${config.entity}' ist kein 'cover'. Funktionalität könnte eingeschränkt sein.`
      );
    }

    this._config = {
      theme: "default",
      name: null, // Für die benutzerdefinierte Beschreibung/Name in Zeile 1 [cite: 1]
      ...config,
    };

    if (this._hass && this._hass.states) {
      this.entityState = this._hass.states[this._config.entity];
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (hass && this._config.entity) {
      this.entityState = hass.states[this._config.entity];
      this.requestUpdate();
    }
  }

  getCardSize() {
    let size = 3; // Grundgröße für Name und Hauptsteuerelemente
    if (
      this.entityState &&
      this.entityState.attributes.hasOwnProperty("current_tilt_position")
    ) {
      size += 1; // Mehr Platz für Tilt-Spalte mit Presets und Slider
    }
    return Math.max(3, size);
  }

  _handleTiltPresetClick(percentage) {
    this._callCoverService("set_cover_tilt_position", {
      tilt_position: percentage,
    });
  }

  _setCoverTiltPosition(e) {
    // Wird jetzt auch vom neuen horizontalen Tilt-Slider verwendet
    const tilt_position = parseInt(e.target.value, 10);
    this._callCoverService("set_cover_tilt_position", {
      tilt_position: tilt_position,
    });
  }

  render() {
    if (!this._hass || !this._config) {
      return html`<ha-card
        ><div class="card-content">Initialisiere...</div></ha-card
      >`;
    }

    if (!this.entityState && this._config.entity) {
      if (this._hass.states && this._hass.states[this._config.entity]) {
        this.entityState = this._hass.states[this._config.entity];
      } else {
        return html`
          <ha-card header="${this._config.name || "Cover Steuerung"}">
            <div class="card-content error-message">
              Entität ${this._config.entity} nicht gefunden. Bitte Konfiguration
              prüfen.
            </div>
          </ha-card>
        `;
      }
    }

    if (!this.entityState) {
      return html`
        <ha-card header="${this._config.name || "Cover Steuerung"}">
          <div class="card-content">
            Lade Zustand für ${this._config.entity}...
          </div>
        </ha-card>
      `;
    }

    const state = this.entityState;
    const attributes = state.attributes;
    const displayName =
      this._config.name || attributes.friendly_name || this._config.entity; // z.B. "Raffstore Büro" [cite: 1]
    const currentPosition = attributes.current_position;
    const supportsTilt = attributes.hasOwnProperty("current_tilt_position");
    const currentTiltPosition = supportsTilt
      ? attributes.current_tilt_position
      : undefined;
    const isUnavailable = state.state === "unavailable";

    return html`
      <ha-card>
        <div class="card-header">${displayName}</div>

        <div class="card-content">
          ${isUnavailable
            ? html`<div class="warning-message">
                Entität ${this._config.entity} ist nicht verfügbar.
              </div>`
            : ""}

          <div class="main-columns-container">
            <div class="column column-position-controls">
              <div class="position-slider-area">
                <ha-icon
                  icon="mdi:blinds-horizontal${currentPosition === 0
                    ? "-closed"
                    : currentPosition === 100
                    ? ""
                    : ""}"
                ></ha-icon>
                <ha-slider
                  vertical
                  min="0"
                  max="100"
                  step="1"
                  .value="${currentPosition}"
                  pin
                  ignore-bar-touch
                  @change="${this._setCoverPosition}"
                  .disabled="${isUnavailable}"
                  id="positionSlider"
                ></ha-slider>
                <span class="slider-value"
                  >${currentPosition !== undefined
                    ? currentPosition + "%"
                    : "N/A"}</span
                >
              </div>
            </div>

            <div class="column-main-action-buttons">
              <mwc-button
                @click="${() => this._callCoverService("open_cover")}"
                title="Öffnen"
                .disabled="${isUnavailable || currentPosition === 100}"
                class="action-button"
              >
                <ha-icon slot="icon" icon="mdi:arrow-up"></ha-icon>
              </mwc-button>
              <mwc-button
                @click="${() => this._callCoverService("stop_cover")}"
                title="Stopp"
                .disabled="${isUnavailable}"
                class="action-button"
              >
                <ha-icon slot="icon" icon="mdi:stop"></ha-icon>
              </mwc-button>
              <mwc-button
                @click="${() => this._callCoverService("close_cover")}"
                title="Schließen"
                .disabled="${isUnavailable || currentPosition === 0}"
                class="action-button"
              >
                <ha-icon slot="icon" icon="mdi:arrow-down"></ha-icon>
              </mwc-button>
            </div>

            <div class="column column-tilt-controls">
              ${supportsTilt
                ? html`
                    <div class="tilt-preset-buttons-area">
                      ${this.tiltPresets.map(
                        (preset) => html`
                          <mwc-button
                            class="tilt-preset-button"
                            ${currentTiltPosition === preset ? "raised" : ""}
                            dense
                            outlined
                            @click="${() =>
                              this._handleTiltPresetClick(preset)}"
                            .disabled="${isUnavailable}"
                            title="Neigung ${preset}%"
                          >
                            ${preset}%
                          </mwc-button>
                        `
                      )}
                    </div>
                  `
                : ""}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  _callCoverService(serviceName, data = {}) {
    if (!this._hass || !this._config.entity) return;
    this._hass.callService("cover", serviceName, {
      entity_id: this._config.entity,
      ...data,
    });
  }

  _setCoverPosition(e) {
    const position = parseInt(e.target.value, 10);
    this._callCoverService("set_cover_position", { position: position });
  }

  static async getConfigElement() {
    await import("./ha-cover-control-card-with-tilt-editor.js");
    return document.createElement("ha-cover-control-card-with-tilt-editor");
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    const coverEntity =
      entities.find((eid) => eid.startsWith("cover.")) ||
      entitiesFallback.find((eid) => eid.startsWith("cover."));
    return {
      entity: coverEntity || "cover.example_cover",
      name: "Meine Cover Steuerung",
    };
  }

  static get styles() {
    return css`
      .card-header {
        font-size: var(--ha-card-header-font-size, 18px);
        font-weight: var(--ha-card-header-font-weight, normal);
        padding: 0px 16px 0px 16px;
        text-align: left;
      }
      .card-content {
      }
      .error-message,
      .warning-message {
        background-color: var(--warning-color);
        color: var(--text-primary-color);
        padding: 8px;
        border-radius: var(--ha-card-border-radius, 4px);
        margin-bottom: 8px;
        text-align: center;
      }

      .main-columns-container {
        /* Zeile 2 Container für die zwei Hauptspalten */
        display: flex;
        flex-direction: row;
        justify-content: space-around; /* Passt den Raum zwischen den Spalten an */
        gap: 20px; /* Abstand zwischen linker und rechter Hauptspalte */
      }

      .column {
        /* Basis für Hauptspalten */
        display: flex;
        flex-direction: row;
        align-items: center; /* Zentriert Inhalte in der Spalte horizontal */
      }

      .column-position-controls {
        /* Linke Hauptspalte */
        flex: 3; /* Nimmt relativ weniger Platz als Tilt, wenn Tilt da ist, sonst 100% */
        justify-content: space-between; /* Verteilt Slider-Bereich und Button-Bereich vertikal */
        gap: 15px; /* Abstand zwischen Sliderbereich und Buttons */
      }

      .column-main-action-buttons {
        /* Buttons für Hoch, Stopp, Runter */
        flex: 2;
        display: flex;
        flex-direction: row; /* Untereinander */
        align-items: center;
        gap: 8px; /* Abstand zwischen den Buttons */
      }

      .column-tilt-controls {
        /* Rechte Hauptspalte für Tilt */
        flex: 5; /* Nimmt relativ mehr Platz für Presets und Slider */
        justify-content: space-between; /* Verteilt Preset-Buttons und Tilt-Slider vertikal */
        gap: 15px;
        min-width: 120px; /* Mindestbreite für die Tilt-Spalte */
      }

      .position-slider-area {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
      }
      .position-slider-area ha-icon {
        margin-bottom: 8px;
      }
      .position-slider-area ha-slider {
        /* Vertikaler Positionsslider */
        width: 100%;
      }
      .position-slider-area .slider-value {
        margin-top: 8px;
        font-size: 0.9em;
      }

      .main-action-buttons ha-icon-button {
        --mdc-icon-button-size: 44px;
        --mdc-icon-button-size: 44px; /* Ihre bestehende Regel */
      }

      .tilt-preset-buttons-area {
        /* Buttons für Tilt-Presets */
        display: flex;
        flex-direction: row;
        align-items: stretch; /* Streckt Buttons auf Spaltenbreite */
        gap: 26px;
        width: 100%;
      }
      .tilt-preset-button {
        width: 50px;
        height: 30px;
        --mdc-button-dense-padding: 4px 6px;
        font-size: 0.85em;
        box-sizing: border-box;
      }
      .tilt-preset-button.active {
        background-color: var(--primary-color);
        color: var(--text-primary-color);
        border-color: var(--primary-color);
      }

      ha-icon {
        color: var(--mdc-theme-primary,#6200ee) !important;
        width: 24px !important;
        height: 24px !important;
        display: inline-block !important;
      }
    `;
  }
}

customElements.define(
  "ha-cover-control-card-with-tilt",
  HaCoverControlCardWithTilt
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-cover-control-card-with-tilt',
  name: 'Cover Steuerung (Layout nach Skizze)',
  description: 'Layout mit Position (links) und Tilt (rechts, mit Presets und Slider).',
  preview: true,
});
