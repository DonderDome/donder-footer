/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { CARD_VERSION } from './constants';
import './editor';

import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';

/* eslint no-console: 0 */
console.info(
  `%c  donder-footer \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'donder-footer',
  name: 'Donder Footer',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // REPLACE "donder-footer" with widget name, everywhere in the project
    // REPLACE the file name with the actual widget name
    return document.createElement('donder-footer-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Donder Footer',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  private navigate(ev, room) {
    ev.stopPropagation();
    const path = `/lovelace/${room.id}`
    const isSelected = path === window.location.pathname

    // const isJarvis = window.location.pathname === '/lovelace/0'
    this.hass.callService('browser_mod', 'navigate', {
      path: isSelected ? '/lovelace/0' : path,
      browser_id: localStorage.getItem('browser_mod-browser-id'),
    })
  }

  static get styles(): CSSResultGroup {
    return css`
      /* REPLACE "donder-footer" with actual widget name */
      .type-custom-donder-footer {
        height: 100%;
        width: 100%;
        background: transparent !important;
      }
      .donder-footer-wrapper {
        display: flex;
        justify-content: center;
      }
      ha-card.ha-badge {
        background-color: var(--card-background-color) !important;
        box-sizing: border-box;
        padding: var(--spacing);
        display: flex;
        height: auto;
        margin: 5px;
        flex: 0 1 250px;
      }
      ha-card.ha-badge.selected {
        opacity: 1;
      }
      ha-card.ha-badge.faded {
        opacity: 0.5;
      }
      ha-card.ha-badge ha-icon {
        border-radius: 50%;
        background-color: var(--card-background-color);
        width: 42px;
        min-width: 42px;
        height: 42px;
        display: flex;
        text-align: center;
        align-content: center;
        align-items: center;
        justify-content: center;
      }
      ha-card.ha-badge .ha-badge-content {
        margin-left: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        align-content: center;
      }
      ha-card.ha-badge .ha-badge-content .ha-badge-title {
        font-size: .8rem;
        font-weight: 400;
        opacity: 0.7;
        text-transform: uppercase;
      }
      ha-card.ha-badge .ha-badge-content .ha-badge-status {
        font-size: 1rem;
        font-weight: 500;
        line-height: normal;
      }
    `;
  }

  private renderBadge(room: any) {
    const path = `/lovelace/${room.id}`
    const isSelected = path === window.location.pathname
    const isHome = window.location.pathname === '/lovelace/0'
    const hasAC = room.climate?.entity
    const renderThermostat = hasAC || room.climate.internal_temp
    
    let widgetDom

    if (renderThermostat){
      if (hasAC) {
        const climateEntity = this.hass.states[room.climate?.entity]
        widgetDom = html`
          <div class="ha-badge-status">${climateEntity.attributes.current_temperature}${climateEntity.attributes.temperature_unit}</div>
        `
      } else {
        const climateEntity = this.hass.states[room.climate?.internal_temp]
        widgetDom = html`
          <div class="ha-badge-status">${climateEntity.state}C</div>
        `
      }
    }
    
    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        @click=${(ev) => this.navigate(ev, room)}
        class=${`ha-badge ${isSelected ? 'selected' : ''} ${!isHome ? 'faded' : ''}}`}
      >
        <ha-icon icon=${room.icon || 'mdi:home'}></ha-icon>
        <div class="ha-badge-content">
          <div class="ha-badge-title">${room.name}</div>
          ${widgetDom}
        </div>
      </ha-card>
    `
  }

  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    const env = this.hass.states['donder_env.global'].attributes
    const { rooms } = env

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
      >
        <div class="donder-widget">
          <div class="donder-footer-wrapper">
            ${rooms.map(room => this.renderBadge(room))}
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("donder-footer", BoilerplateCard);
