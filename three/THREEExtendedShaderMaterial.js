import THREE from "three";

import THREEShader from "./THREEShader.js";

export default class THREEExtendedShaderMaterial extends THREE.ShaderMaterial {
  constructor ({originalShaderName = "", vertexShaderHooks, fragmentShaderHooks, uniforms = {}} = {}) {
    vertexShaderHooks = Object.assign({prefix: "", main: "", suffix: ""}, vertexShaderHooks);
    fragmentShaderHooks = Object.assign({prefix: "", main: "", suffix: ""}, fragmentShaderHooks);

    let originalShader = THREE.ShaderLib[originalShaderName] || {};
    let tempShader = new THREEShader({vertexShader: vertexShaderHooks.prefix, fragmentShader: fragmentShaderHooks.prefix});

    uniforms = Object.assign(THREE.UniformsUtils.clone(originalShader.uniforms), tempShader.uniforms, uniforms);

    var regExp = /([\s\S]*?\bvoid\b +\bmain\b[\s\S]*?{)([\s\S]*)}/m;

    let generateSubstringFromHooks = (hooks) => {
      return `${hooks.prefix}\n\n$1\n\n${hooks.main}\n\n$2\n\n${hooks.suffix}\n\n}`
    }

    super(Object.assign({
      vertexShader: originalShader.vertexShader.replace(regExp, generateSubstringFromHooks(vertexShaderHooks)),
      fragmentShader: originalShader.fragmentShader.replace(regExp, generateSubstringFromHooks(fragmentShaderHooks))
    }, {}));

    for (let key of ["bumpMap", "displacementMap", "emissiveMap", "envMap", "lightMap", "map", "metalnessMap", "normalMap", "roughnessMap", "specularMap"]) {
      if(this.uniforms[key]) {
        this[key] = this.uniforms[key].value;
      }
    }

    this.lights = /lambert|phong|standard/.test(originalShaderName);
  }
}
