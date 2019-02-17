import PlaneMesh from "../../3d/mesh/PlaneMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import BasicShader from "../../shader/BasicShader.js";

export default class GLPlaneObject extends GLObject {
  constructor({
    gl,
    width = undefined,
    height = undefined,
    columns = undefined,
    rows = undefined,
    normals = true,
    uvs = true,
    shaders = [],
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh({
        gl,
        ...new PlaneMesh({
          width,
          height,
          columns,
          rows,
          normals,
          uvs,
        })
      }),
      program: new GLProgram({
        gl,
        shaders: [
          new BasicShader({
            normals: normals,
            uvs: uvs,
          }),
          ...shaders,
        ],
      }),
    });

    this.transform = this.program.uniforms.get("transform");
  }
}
