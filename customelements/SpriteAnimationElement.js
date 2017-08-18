import LoopElement from "../customelements/LoopElement.js";
import SpriteAnimation from "../abstract/SpriteAnimation.js";
import Ticker from "../utils/Ticker.js";
import Loader from "../utils/Loader.js";

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-spriteanimation {
      display: block;
      position: relative;
    }
  `;
  document.head.appendChild(style);
})();

window.customElements.define("dlib-spriteanimation", class SpriteAnimationElement extends LoopElement {
  constructor() {
    super({
      autoplay: false
    });

    this._autoplay = this.hasAttribute("autoplay");

    this._resizeBinded = this.resize.bind(this);
    this._scale = 1;

    this._sprite = document.createElement("div");
    this._sprite.style.position = "absolute";
    this._sprite.style.width = "100%";
    this._sprite.style.height = "100%";
    this._sprite.style.top = "0";
    this._sprite.style.left = "0";
    this.appendChild(this._sprite);

    this._spriteAnimation = new SpriteAnimation({
      loop: this.hasAttribute("loop"),
      fps: this.hasAttribute("fps") ? parseFloat(this.getAttribute("fps")) : undefined,
      autoplay: this._autoplay
    });

    this.src = this.getAttribute("src");
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._resizeBinded);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._resizeBinded);
  }

  play() {
    super.play();
    this._spriteAnimation.play();
  }

  pause() {
    Ticker.delete(this._updateBinded);
    this._spriteAnimation.pause();
  }

  update() {
    this._sprite.style.backgroundPosition = `left ${-this._spriteAnimation.x}px top ${-this._spriteAnimation.y}px`;
    this._sprite.style.width = `${this._spriteAnimation.width}px`;
    this._sprite.style.height = `${this._spriteAnimation.height}px`;
    this._sprite.style.top = "50%";
    this._sprite.style.left = "50%";
    this._sprite.style.transform = `translate(-50%, -50%) translate(${this._spriteAnimation.offsetX * this._scale}px, ${this._spriteAnimation.offsetY * this._scale}px) rotate(${this._spriteAnimation.rotated ? -90 : 0}deg) scale(${this._scale})`;
  }

  resize() {
    this._scale = Math.min(this.offsetWidth / this._spriteAnimation.sourceWidth, this.offsetHeight / this._spriteAnimation.sourceHeight);
    this.update();
  }

  get duration() {
    return this._spriteAnimation.duration;
  }

  get currentTime() {
    return this._spriteAnimation.currentTime;
  }

  set currentTime(value) {
    this._spriteAnimation.currentTime = value;
    this.update();
  }

  get fps() {
    return this._spriteAnimation.fps;
  }

  set fps(value) {
    this._spriteAnimation.fps = value;
  }

  get loop() {
    return this._spriteAnimation.loop
  }

  set loop(value) {
    this._spriteAnimation.loop = value;
  }

  get playbackRate() {
    return this._spriteAnimation.playbackRate
  }

  set playbackRate(value) {
    this._spriteAnimation.playbackRate = value;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this._src = value;

    Loader.load(this._src).then((data) => {
      this._spriteAnimation.data = data;
      this._sprite.style.backgroundImage = `url(${/(.*[\/\\]).*$/.exec(this._src)[1]}${data.meta.image})`;
      this.resize();
      this.update();
    });
  }
});