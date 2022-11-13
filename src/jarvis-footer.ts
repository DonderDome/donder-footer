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
  `%c  jarvis-footer \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'jarvis-footer',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // REPLACE "jarvis-footer" with widget name, everywhere in the project
    // REPLACE the file name with the actual widget name
    return document.createElement('jarvis-footer-editor');
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
      name: 'Boilerplate',
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

  private navigate(isSelected: boolean) {

    this.hass.callService('browser_mod', 'navigate', {navigation_path: isSelected ? '/lovelace/0' : this.config.navigation_path})
  }

  static get styles(): CSSResultGroup {
    return css`
      /* REPLACE "jarvis-footer" with actual widget name */
      .type-custom-jarvis-footer {
        height: 100%;
        width: 100%;
      }
      .jarvis-widget {
        height: 100%;
        width: 100%;
        /* position: absolute; */
        top: 0;
        left: 0;
        /* padding: 20px; */
        box-sizing: border-box;
        color: #fff;
      }
      .jarvis-widget.transparent {
        opacity: .5;
      }
      .jarvis-nav-wrapper {

      }
      .jarvis-nav-title {
        text-transform: uppercase;
        font-size: 0.9rem;
        font-weight: 600;
        font-stretch: 160%;
        border-left: 3px solid rgb(72, 75, 92);
        line-height: 1em;
        padding-left: 7px;
      }
      .jarvis-nav-button {
        background: url('/local/jarvis/assets/floor_frame.svg');
        padding: 50px;
        background-position: center;
        background-repeat: no-repeat;
      }
    `;
  }

  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    const isSelected = this.config.navigation_path === window.location.pathname
    const isJarvis = window.location.pathname === '/lovelace/0'
    const isTransparent = !isJarvis && !isSelected

    return html`
      <ha-card
        @action=${this._handleAction}
        tabindex="0"
      >
        <div class=${'jarvis-widget '+ (isTransparent ? 'transparent' : '')} @click="${() => this.navigate(isSelected)}">
          <div class="jarvis-nav-wrapper">
            <div class="jarvis-nav-title">
              ${this.config.name}
            </div>
            <div class="jarvis-nav-button"></div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("jarvis-footer", BoilerplateCard);
