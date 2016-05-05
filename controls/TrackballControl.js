import Pointer from "../input/Pointer";
import Ticker from "../utils/Ticker";
import Matrix4 from "../math/Matrix4";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Quaternion from "../math/Quaternion";

export default class TrackballControl {
  constructor(matrix = new Matrix4(), {domElement = document.body, distance = 0, distanceStep = 1}) {
    this.matrix = matrix;
    this.distance = distance;
    this.distanceStep = distanceStep;

    this._pointer = Pointer.get(domElement);

    this._cachedQuaternion = new Quaternion();
    this._cachedMatrix = new Matrix4();
    this._cachedVector3 = new Vector3();

    this._velocity = new Vector2();
    this._velocityOrigin = new Vector2();

    this._position = new Vector3(this.matrix.x, this.matrix.y, this.matrix.z);
    this._positionPrevious = this._position.clone();
    this._positionOffset = new Vector3();

    domElement.addEventListener("wheel", this.onWheel.bind(this));

    Ticker.add(this.update, this);
  }

  onWheel(e) {
    if(e.deltaY > 0) {
      this.distance += this.distanceStep;
    } else {
      this.distance -= this.distanceStep;
    }
    this.distance = Math.max(this.distance, 0);
  }

  update() {
    this._cachedMatrix.identity();
    this._cachedQuaternion.identity();

    this._position.set(this.matrix.x, this.matrix.y, this.matrix.z).subtract(this._positionOffset);

    this.matrix.x = 0;
    this.matrix.y = 0;
    this.matrix.z = 0;

    if(this._pointer.downed) {
      this._velocity.copy(this._pointer.velocity).scale(.002);
    }

    this._velocity.lerp(this._velocityOrigin, .1);

    this._cachedQuaternion.rotateY(this._velocity.x);
    this._cachedQuaternion.rotateX(this._velocity.y);

    this._cachedMatrix.fromQuaternion(this._cachedQuaternion);

    this.matrix.multiply(this._cachedMatrix);

    this._positionOffset.set(0, 0, 1);
    this._positionOffset.applyMatrix4(this.matrix);
    this._positionOffset.scale(this.distance);

    this._cachedVector3.copy(this._position).add(this._positionOffset);

    this.matrix.x = this._cachedVector3.x;
    this.matrix.y = this._cachedVector3.y;
    this.matrix.z = this._cachedVector3.z;
  }
}