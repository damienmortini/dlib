import ConnectorInputElement from '../connector-input/index.js';

const CONNECTORS = new Set();

let activeConnector = null;

/**
 * Handle connector elements linking
 */
class ConnectorInputLinkableElement extends ConnectorInputElement {
  constructor() {
    super();

    this.shadowRoot.querySelector('slot style').insertAdjacentHTML('beforeend', `
      :host {
        cursor: pointer;
        margin: 0;
        padding: .2em;
      }
      :host(:hover) {
        background: red;
      }
      :host(:focus-within) {
        background: green;
      }
      :host([connected]) {
        background: orange;
      }
    `);

    this.addEventListener('pointerdown', this._onPointerDown);

    this._onWindowPointerUpBinded = this._onWindowPointerUp.bind(this);
    this.addEventListener('pointerup', (event) => {
      console.log(event.composedPath());
    }, { passive: false });
  }

  connectedCallback() {
    CONNECTORS.add(this);
    console.log(CONNECTORS);
  }

  disconnectedCallback() {
    CONNECTORS.delete(this);
    super.disconnectedCallback();
  }

  _onPointerDown() {
    if (activeConnector) {
      return;
    }
    activeConnector = this;

    window.addEventListener('pointerup', this._onWindowPointerUpBinded, { passive: false });

    this.dispatchEvent(new CustomEvent('linkstart', {
      composed: true,
      bubbles: true,
      detail: {
        input: this,
        output: undefined,
      },
    }));
  }

  _onWindowPointerUp(event) {
    if (!activeConnector) {
      return;
    }

    let hitConnector;

    for (const connector of CONNECTORS) {
      const boundingClientRect = connector.getBoundingClientRect();
      if (event.clientX > boundingClientRect.x &&
        event.clientX < boundingClientRect.x + boundingClientRect.width &&
        event.clientY > boundingClientRect.y &&
        event.clientY < boundingClientRect.y + boundingClientRect.height) {
        hitConnector = connector;
      }
    }

    if (hitConnector === activeConnector) {
      return;
    }

    window.removeEventListener('pointerup', this._onWindowPointerUpBinded);

    if (!hitConnector || (activeConnector.type === hitConnector.type && hitConnector.type !== ConnectorInputLinkableElement.TYPE_BOTH)) {
      activeConnector = null;
      this.dispatchEvent(new CustomEvent('linkend', {
        composed: true,
        bubbles: true,
        detail: {
          input: null,
          output: null,
        },
      }));
      return;
    }

    const inputConnector = activeConnector.type & ConnectorInputLinkableElement.TYPE_OUTPUT ? activeConnector : hitConnector;
    const outputConnector = hitConnector.type & ConnectorInputLinkableElement.TYPE_INPUT ? hitConnector : activeConnector;

    inputConnector.outputs.add(outputConnector);

    activeConnector = null;

    this.dispatchEvent(new CustomEvent('linkend', {
      composed: true,
      bubbles: true,
      detail: {
        input: inputConnector,
        output: outputConnector,
      },
    }));
  }
}

export default ConnectorInputLinkableElement;
