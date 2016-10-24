import Component from "dlib/ecs/Component.js";

export default class View extends Component {
  constructor(entity, view, {
    visibilityExecutor = (resolve) => resolve()
  } = {}) {
    super(entity);

    this.visibilityExecutor = visibilityExecutor;

    this._view = view;

    this.visibilityPromise = null;

    this._children = new Set();

    this._visible = true;
  }

  set visible(value) {
    this._visible = value;

    if(this._visible) {
      this._view.visible = true;
    }

    let promises = [];

    promises.push(new Promise((resolve) => {
      this.visibilityExecutor(resolve, this);
    }));

    for (let child of this._children) {
      child.visible = this._visible;
      promises.push(child.visibilityPromise);
    }

    this.visibilityPromise = Promise.all(promises).then(() => {
      this._view.visible = this._visible;
      this.visibilityPromise = null;
    });
  }

  get visible() {
    return this._visible;
  }

  get view() {
    return this._view;
  }

  add(view) {
    this._children.add(view);
    view.visible = this.visible;
    this._view.add(view._view);
  }

  remove(view) {
    this._children.delete(view);
    this._view.remove(view._view);
  }
}
