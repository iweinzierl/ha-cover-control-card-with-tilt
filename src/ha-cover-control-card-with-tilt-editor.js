// ha-cover-control-card-with-tilt-editor.js

// Basisklasse und Hilfsfunktionen von LitElement holen (wie in der Hauptkarte)
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class HaCoverControlCardWithTiltEditor extends LitElement {

    static get properties() {
        return {
            hass: {}, // Home Assistant Objekt, wird von Lovelace übergeben
            _config: {} // Interne Kopie der Konfiguration
        };
    }

    constructor() {
        super();
        this._config = {};
    }

    // Wird von Lovelace aufgerufen, um die aktuelle Konfiguration zu übergeben
    setConfig(config) {
        this._config = config;
    }

    // Wird aufgerufen, wenn sich ein Wert im Formular ändert
    _valueChanged(ev) {
        if (!this._config || !this.hass) {
            return;
        }
        // Hole das Zielelement und seinen Wert
        const target = ev.target;
        let value = target.value;

        // Wenn es eine Checkbox ist, den checked-Status als Wert nehmen
        if (target.type === 'checkbox') {
            value = target.checked;
        }

        // Aktualisiere die interne Konfiguration
        // target.configValue ist ein benutzerdefiniertes Attribut, das wir im HTML setzen,
        // um den Namen des Konfigurationsschlüssels zu speichern.
        if (this._config[target.configValue] !== value) {
            this._config = { ...this._config, [target.configValue]: value };

            // Informiere Lovelace über die geänderte Konfiguration
            const event = new CustomEvent("config-changed", {
                detail: { config: this._config },
                bubbles: true,
                composed: true,
            });
            this.dispatchEvent(event);
        }
    }

    render() {
        if (!this.hass) {
            return html``; // Noch nicht bereit
        }

        // Die `ha-entity-picker` Komponente ermöglicht eine einfache Auswahl von Entitäten.
        // Die `ha-textfield` Komponente ist für Texteingaben.
        return html`
            <div class="card-config">
                <p>
                    Konfigurieren Sie hier Ihre Cover-Steuerungskarte.
                    Wählen Sie eine Entität und geben Sie optional einen Anzeigenamen ein.
                </p>
                <ha-entity-picker
                    .hass="${this.hass}"
                    .value="${this._config.entity}"
                    .configValue="${'entity'}"
                    .includeDomains="${['cover']}"
                    @value-changed="${this._valueChanged}"
                    label="Entität (Erforderlich)"
                    allow-custom-entity
                ></ha-entity-picker>
                
                <ha-textfield
                    label="Anzeigename (Optional)"
                    .value="${this._config.name || ''}"
                    .configValue="${'name'}"
                    @input="${this._valueChanged}"
                ></ha-textfield>
            </div>
        `;
    }

    static get styles() {
        return css`
            .card-config {
                display: flex;
                flex-direction: column;
                gap: 16px; /* Abstand zwischen den Elementen */
                padding: 16px;
            }
            ha-entity-picker, ha-textfield {
                width: 100%;
            }
            p {
                margin-top: 0;
                margin-bottom: 8px;
                font-size: 0.9em;
                color: var(--secondary-text-color);
            }
        `;
    }
}

customElements.define('ha-cover-control-card-with-tilt-editor', HaCoverControlCardWithTiltEditor);