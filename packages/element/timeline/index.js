import './TickerTimelineElement.js';
import './ChannelTimelineInputElement.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['zoom'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          width: 300px;
        }
        damo-timeline-ticker {
          width: 100%;
          z-index: 1;
        }
        damo-timeline-channel {
          width: 100%;
          margin-bottom: 2px;
        }
      </style>
      <damo-timeline-ticker></damo-timeline-ticker>
      <div id="channels">
        <slot></slot>
      </div>
    `;

    this._zoom = 1;
    this._channelsContainer = this.shadowRoot.querySelector('#channels');
    this._timelineTicker = this.shadowRoot.querySelector('damo-timeline-ticker');

    this._channelsContainer.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.currentTime -= 20 / this.zoom;
      } else {
        this.currentTime += 20 / this.zoom;
      }
    });

    // this._timelineTicker.addEventListener('wheel', (event) => {
    //   event.preventDefault();
    //   if (event.deltaY < 0) {
    //     this.zoom *= .95;
    //   } else {
    //     this.zoom /= .95;
    //   }
    // });

    let previousTime = 0;
    this._timelineTicker.addEventListener('timeupdate', () => {
      for (const channel of this._channels) {
        for (const keyframe of channel.keyframes) {
          if (keyframe >= previousTime && keyframe < this.currentTime) {
            this.dispatchEvent(new CustomEvent('input', {
              detail: {
                name: channel.name,
                time: keyframe,
                color: channel.color,
              },
            }));
          }
        }
      }
      previousTime = this.currentTime;
    });

    this._timelineTicker.addEventListener('shiftupdate', () => {
      for (const channel of this._channels) {
        channel.shift = this._timelineTicker.shift;
      }
    });

    this._channels = new Set();

    new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type == 'childList') {
          this._channels.clear();
          for (const child of this.children) {
            if (child.position !== undefined && child.value !== undefined) {
              this._channels.add(child);
            }
          }
        }
      }
    }).observe(this, { childList: true });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'zoom':
        this.zoom = Number(newValue);
        break;
    }
  }

  addChannel({ name, key, color, keyframes, step }) {
    const channel = document.createElement('damo-timeline-channel');
    channel.name = name;
    channel.color = color;
    channel.keyframes = keyframes;
    channel.zoom = this.zoom;
    channel.step = step;
    window.addEventListener('keydown', (event) => {
      if (event.key === key) {
        const time = Math.floor(this.currentTime / channel.step) * channel.step;
        if (channel.keyframes.has(time)) {
          return;
        }
        channel.keyframes.add(time);
        channel._update();
        this.dispatchEvent(new CustomEvent('input', {
          detail: {
            name: channel.name,
            time: time,
            color: channel.color,
          },
        }));
      }
    });
    this._channels.add(channel);
    this._channelsContainer.appendChild(channel);
    this._timelineTicker.tickHeight = this._channelsContainer.clientHeight;
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = value;
    this._timelineTicker.zoom = this._zoom;
    for (const channel of this._channels) {
      channel.zoom = this._zoom;
    }
  }

  get time() {
    return this._time;
  }

  set time(value) {
    this._time = value;
  }

  get currentTime() {
    return this._timelineTicker.currentTime;
  }

  set currentTime(value) {
    this._timelineTicker.currentTime = value;
  }

  play() {
    this._timelineTicker.play();
  }

  pause() {
    this._timelineTicker.pause();
  }

  get paused() {
    return this._timelineTicker.paused;
  }
}

if (!customElements.get('damo-timeline')) {
  customElements.define('damo-timeline', class DamoTimelineInputElement extends TimelineInputElement { });
}