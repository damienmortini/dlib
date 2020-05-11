import Ticker from '../core/util/Ticker.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 10px;
        }
        #controls button {
          width: 60px;
          display: block;
          cursor: pointer;
        }
        #tickarea {
          position: relative;
          width: 100%;
          height: 20px;
          background: grey;
          z-index: 1;
        }
        #tick {
          pointer-events: none;
          margin-left: -5px;
          position: absolute;
          left: 0;
          top: 5px;
          width: 10px;
        }
        damo-input-timeline-channel {
          margin-bottom: 2px;
        }
      </style>
      <div id="controls">
        <button id="play">Play</button>
        <button id="pause">Pause</button>
        <button id="record">Record</button>
      </div>
      <div id="timeline">
        <div id="tickarea">
          <svg id="tick">
            <polyline fill="red" fill="none" points="0 0 5 5 10 0" />
            <line stroke="red" x1="5" y1="5" x2="5" y2="10" />
          </svg>
        </div>
        <div id="channels"></div>
      </div>
    `;

    this._channelsContainer = this.shadowRoot.querySelector('#channels');

    this._channels = new Set();

    this._shift = 0;

    /**
     * Header tick
     */
    this._tickArea = this.shadowRoot.querySelector('#tickarea');
    this._tick = this.shadowRoot.querySelector('#tick');
    this._tickLine = this.shadowRoot.querySelector('#tick line');
    this._tickAreaWidth = 0;
    this._tickX = 0;
    this._previousTickX = 0;

    const tickUpdate = () => {
      const padding = this._tickAreaWidth * .2;
      let x = this._tickX;
      if (x > this._tickAreaWidth - padding) {
        this.shift += x - this._previousTickX;
        x = this._tickAreaWidth - padding;
      } else if (x < padding && this.shift) {
        this.shift += x - this._previousTickX;
        x = padding;
      } else {
        x = Math.max(0, x);
      }
      this._tick.style.transform = `translateX(${x}px)`;
      this._previousTickX = x;
    };

    const pointerDown = (event) => {
      this._tickArea.setPointerCapture(event.pointerId);
      this._tickArea.addEventListener('pointermove', pointerMove);
      this._tickArea.addEventListener('pointerup', pointerUp);
      this._tickArea.addEventListener('pointerout', pointerUp);
      Ticker.add(tickUpdate);
    };
    const pointerMove = (event) => {
      this._tickX = event.offsetX;
    };
    const pointerUp = (event) => {
      Ticker.delete(tickUpdate);
      this._tickArea.releasePointerCapture(event.pointerId);
      this._tickArea.removeEventListener('pointermove', pointerMove);
      this._tickArea.removeEventListener('pointerup', pointerUp);
      this._tickArea.removeEventListener('pointerout', pointerUp);
    };
    this._tickArea.addEventListener('pointerdown', pointerDown);
    this._tickArea.addEventListener('contextmenu', (event) => event.preventDefault());
    const resizeObserver = new ResizeObserver((entries) => {
      this._tickAreaWidth = entries[0].contentRect.width;
    });
    resizeObserver.observe(this._tickArea);

    /**
     * Controls
     */
    const playTicker = () => {
      this._tickX++;
      tickUpdate();
    };

    this._playButton = this.shadowRoot.querySelector('#play');
    this._pauseButton = this.shadowRoot.querySelector('#pause');

    this._playButton.addEventListener('click', () => {
      Ticker.add(playTicker);
    });
    this._pauseButton.addEventListener('click', () => {
      Ticker.delete(playTicker);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
  }

  addChannel({ name, key, color, keyframes }) {
    const channel = document.createElement('damo-input-timeline-channel');
    channel.color = color;
    channel.keyframes = keyframes;
    this._channels.add(channel);
    this._channelsContainer.appendChild(channel);
    this._tickLine.setAttribute('y2', `${this._channelsContainer.clientHeight + 15}`);
  }

  get shift() {
    return this._shift;
  }

  set shift(value) {
    this._shift = Math.max(0, value);
    for (const channel of this._channels) {
      channel.shift = this._shift;
    }
  }

  get currentFrame() {
    return this._currentFrame;
  }

  set currentFrame(value) {
    this._currentFrame = value;
  }

  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;
  }
}

if (!customElements.get('damo-input-timeline')) {
  customElements.define('damo-input-timeline', class DamoTimelineInputElement extends TimelineInputElement { });
}

class ChannelTimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: 20px;
          width: 360px;
          background: lightgrey;
        }
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._context = this._canvas.getContext('2d');
    this._shift = 0;
    this.frameSize = 10;
    this.startFrame = 0;
    this.color = 'white';
    this.keyframes = new Set();

    const pointerDown = (event) => {
      this._canvas.setPointerCapture(event.pointerId);
      this._canvas.addEventListener('pointermove', pointerMove);
      this._canvas.addEventListener('pointerup', pointerUp);
      this._canvas.addEventListener('pointerout', pointerUp);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      const frame = Math.floor((event.offsetX + this.shift) / this.frameSize);
      if (event.buttons === 1) {
        this.keyframes.add(frame);
      } else {
        this.keyframes.delete(frame);
      }
      this._update();
    };
    const pointerUp = (event) => {
      this._canvas.releasePointerCapture(event.pointerId);
      this._canvas.removeEventListener('pointermove', pointerMove);
      this._canvas.removeEventListener('pointerup', pointerUp);
      this._canvas.removeEventListener('pointerout', pointerUp);
    };
    this._canvas.addEventListener('pointerdown', pointerDown);
    this._canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    const resizeObserver = new ResizeObserver((entries) => {
      this._canvas.width = entries[0].contentRect.width;
      this._canvas.height = entries[0].contentRect.height;
      this._update();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
  }

  connectedCallback() {
    this._update();
  }

  get keyframes() {
    return this._keyframes;
  }

  set keyframes(value) {
    this._keyframes = value;
    this._update();
  }

  get shift() {
    return this._shift;
  }

  set shift(value) {
    this._shift = value;
    this._update();
  }

  _update() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillStyle = this.color;
    this._context.beginPath();
    for (const keyframe of this.keyframes) {
      const x = keyframe * this.frameSize - this.shift;
      this._context.fillRect(x, this._canvas.height * .25, this.frameSize, this._canvas.height * .5);
    }
  }
}

if (!customElements.get('damo-input-timeline-channel')) {
  customElements.define('damo-input-timeline-channel', class DamoChannelTimelineInputElement extends ChannelTimelineInputElement { });
}