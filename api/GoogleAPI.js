export default class GoogleAPI {
  static load() {
    return new Promise((resolve) => {
      if(document.querySelector(`script[src$="//apis.google.com/js/api.js"]`)) {
        resolve();
      }
    
      let script = document.createElement("script");
      script.onload = resolve;
      script.src = "//apis.google.com/js/api.js";
      document.head.appendChild(script);
    });;
  }
}