import Vector2 from "../math/Vector2.js";
import Vector3 from "../math/Vector3.js";
import Vector4 from "../math/Vector4.js";
import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Shader from "../3d/Shader.js";
import GLTexture from "./GLTexture.js";

export default class GLProgram extends Shader {
  constructor({gl,
    vertexShader = undefined,
    fragmentShader = undefined,
    uniforms = undefined,
    attributes = undefined,
    vertexShaderChunks = undefined,
    fragmentShaderChunks = undefined,
    shaders = undefined
  } = {}) {
    super({vertexShader, fragmentShader, uniforms, attributes, vertexShaderChunks, fragmentShaderChunks, shaders});

    this.gl = gl;
    this._program = gl.createProgram();
    this._attachedShaders = new Map();

    const self = this;
    const program = this._program;

    this._vertexAttribDivisor = function() {};
    const instancedArraysExtension = this.gl.getExtension("ANGLE_instanced_arrays");
    if(instancedArraysExtension) {
      this._vertexAttribDivisor = instancedArraysExtension.vertexAttribDivisorANGLE.bind(instancedArraysExtension);
    } else if(this.gl.vertexAttribDivisor) {
      this._vertexAttribDivisor = this.gl.vertexAttribDivisor.bind(this.gl);
    }

    const attributesLocations = new Map();
    class Attributes extends Map {
      set (name , {buffer, location = attributesLocations.get(name), size, type = gl.FLOAT, normalized = false, stride = 0, offset = 0, divisor} = {}) {
        if(name instanceof Map) {
          for (let [key, value] of name) {
            this.set(key, value);
          }
          return;
        }
        buffer.bind();
        if(!location) {
          location = gl.getAttribLocation(program, name);
          if(location === -1) {
            console.warn(`Attribute "${name}" is missing or never used`)
          }
          attributesLocations.set(name, location);
        }
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        if(divisor !== undefined) {
          self._vertexAttribDivisor(location, divisor);
        }
        super.set(name, {buffer, size, type, normalized, stride, offset});
      }
    }

    const uniformLocations = new Map();
    const uniformTypes = new Map();
    class Uniforms extends Map {
      set (name, ...values) {
        let value = values[0];
        if(value === undefined) {
          return;
        }
        
        let location = uniformLocations.get(name);
        if(location === undefined) {
          location = gl.getUniformLocation(program, name);
          uniformLocations.set(name, location);
        }
        
        if(value.length === undefined) {
          if(value instanceof Object) {
            for (let key in value) {
              self.uniforms.set(`${name}.${key}`, value[key]);
            }
            return;
          }
          if(values.length > 1) {
            value = self.uniforms.get(name);
            value.set(...values);
          } else {
            value = values;
          }
        } else if(value[0] instanceof Object) {
          for (let i = 0; i < value.length; i++) {
            for (let key in value[i]) {
              self.uniforms.set(`${name}[${i}].${key}`, value[i][key]);
            }
          }
          return;
        }
        
        if(location === null) {
          return;
        }

        let type = uniformTypes.get(name);
        if(!type) {
          type = /int|ivec|sampler2D|samplerCube/.test(self._uniformTypes.get(name)) ? "iv" : "fv";
          uniformTypes.set(name, type);
        }

        if(value.length <= 4) {
          gl[`uniform${value.length || 1}${type}`](location, value);
        }
        else if(value.length === 9) {
          gl.uniformMatrix3fv(location, false, value);
        }
        else if(value.length === 16) {
          gl.uniformMatrix4fv(location, false, value);
        }

        super.set(name, value);
      }
    }

    this.vertexShader = this.vertexShader;
    this.fragmentShader = this.fragmentShader;

    this.use();

    this.attributes = new Attributes();
    this.uniforms = new Uniforms([...this.uniforms]);
  }

  set vertexShader(value) {
    super.vertexShader = value;
    if(this.gl) {
      this._updateShader(this.gl.VERTEX_SHADER, this.vertexShader);
    }
  }

  get vertexShader() {
    return super.vertexShader;
  }

  set fragmentShader(value) {
    super.fragmentShader = value;
    if(this.gl) {
      this._updateShader(this.gl.FRAGMENT_SHADER, this.fragmentShader);
    }
  }

  get fragmentShader() {
    return super.fragmentShader;
  }
  
  use() {
    this.gl.useProgram(this._program);
  }

  _updateShader(type, source) {
    if(!source) {
      return;
    }

    if(!(this.gl instanceof WebGL2RenderingContext)) {
      source = source.replace(/#version.*?\n/g, "");
      if(type === this.gl.VERTEX_SHADER) {
        source = source.replace(/\bin\b/g, "attribute");
        source = source.replace(/\bout\b/g, "varying");
      } else {
        source = source.replace(/\bin\b/g, "varying");
        const results = /out vec4 (.*?);/.exec(source);
        if(results) {
          const fragColorName = results[1];
          source = source.replace(/out.*?;/, "");
          source = source.replace(new RegExp(`\\b${fragColorName}\\b`, "g"), "gl_FragColor");
        }
      }
    }

    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      const lineNumberResults = /ERROR: 0:(\d+):/.exec(error);
      if (lineNumberResults) {
        const lineNumber = parseFloat(lineNumberResults[1]);
        const shaderLines = source.split("\n");
        console.error(`${error}\nat: ${shaderLines[lineNumber - 1].replace(/^\s*/, "")}`);
      } else {
        console.error(error);
      }
    }

    const attachedShader = this._attachedShaders.get(type);
    if(attachedShader) {
      this.gl.detachShader(this._program, attachedShader);
      this.gl.deleteShader(attachedShader);
    }
    this._attachedShaders.set(type, shader);
    this.gl.attachShader(this._program, shader);

    if(this.gl.getAttachedShaders(this._program).length === 2) {
      this.gl.linkProgram(this._program);
    }
  }

  _parseUniforms(string) {
    super._parseUniforms(string, {
      Vector2,
      Vector3,
      Vector4,
      Matrix3,
      Matrix4,
      GLTexture
    });
  }
}
