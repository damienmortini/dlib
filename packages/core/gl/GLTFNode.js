import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import Vector3 from '../math/Vector3.js';

export default class GLTFNode {
  constructor({
    data,
  }) {
    this.name = data.name;
    this.children = data.children || [];
    this.skin = data.skin;
    this.mesh = data.mesh;
    this.scale = new Vector3(data.scale ?? [1, 1, 1]);
    this.rotation = new Quaternion(data.rotation);
    this.translation = new Vector3(data.translation);
    this.matrix = new Matrix4(data.matrix);
    if (!data.matrix) {
      this.updateMatrix();
    }

    this.worldTransform = new Matrix4();
    this.inverseWorldTransform = new Matrix4();
    this.normalMatrix = new Matrix4();
  }

  updateMatrix() {
    this.matrix.fromTranslationRotationScale(this.translation, this.rotation, this.scale);
  }

  get weights() {
    return this.mesh?.weights;
  }

  set weights(value) {
    if (this.mesh) this.mesh.weights = value;
  }
}
