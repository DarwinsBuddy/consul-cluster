import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

export class FConfig {
  center!: number;
  charge!: number;
  link!: number;
}

@customElement("force-config")
export class ForceConfig extends LitElement {
  @property({ type: FConfig })
  force = {
    center: 1,
    charge: 0.1,
    link: 0.5,
  };

  updateChargeForce(e?: Event) {
    if (e) {
      this.force = { ...this.force, charge: +e.target?.value };
    }
  }

  updateCenterForce(e?: Event) {
    if (e) {
      this.force = { ...this.force, center: +e.target?.value };
    }
  }

  updateLinkStrength(e?: Event) {
    if (e) {
      this.force = { ...this.force, link: +e.target?.value };
    }
  }

  updated(changedProperties: any) {
    if (changedProperties.get("force")) {
			const event = new CustomEvent('value-changed', {
				detail: { value: this.force },
				bubbles: true,
				composed: true
			});
      this.dispatchEvent(event);
    }
  }

  render() {
    return html`<div>
      <div class="input-wrapper">
        <div>charge</div>
        <input
          id="charge"
          type="range"
          .value="${this.force.charge}"
          min="-2"
          step="0.1"
          max="2"
          @change=${this.updateChargeForce}
        />
        <div>${this.force.charge}</div>
      </div>
      <div class="input-wrapper">
        <div>center</div>
        <input
          id="center"
          type="range"
          .value="${this.force.center}"
          min="-2"
          step="0.1"
          max="2"
          @change=${this.updateCenterForce}
        />
        <div>${this.force.center}</div>
      </div>
      <div class="input-wrapper">
        <div>link</div>
        <input
          id="link"
          type="range"
          .value="${this.force.link}"
          min="-2"
          step="0.1"
          max="2"
          @change=${this.updateLinkStrength}
        />
        <div>${this.force.link}</div>
      </div>
    </div>`;
  }

  static styles = css`
    .input-wrapper {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
    }

    .input-wrapper > input {
      width: 50%
    }

    .input-wrapper > div {
      width: 25%
    }
  `
}
declare global {
    interface HTMLElementTagNameMap {
      'force-config': ForceConfig
    }
  }