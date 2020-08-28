import ELEMENTS from './elements.js';

const section = document.body.querySelector('section');
const list = document.body.querySelector('nav ul');
const iframe = document.body.querySelector('iframe');

for (const [elementName, { previewHTML, demo }] of ELEMENTS) {
  const elementString = previewHTML || `<${elementName}></${elementName}>`;
  list.insertAdjacentHTML('beforeend', `
        <li data-elementname="${elementName}">
          <h2><a href="#${elementName}">${elementName.replace('element-', '')}</a></h2>
          ${elementString}
        </li>
      `);
  import(`../${elementName}/index.js`).then((module) => {
    customElements.define(`${elementName}`, class extends module.default { });
  });
}

const updatePath = () => {
  const elementName = location.hash.slice(1);
  if (elementName) {
    section.classList.remove('grid');
    iframe.contentWindow.location.replace(`../${elementName}/demo/index.html`);
  } else {
    section.classList.add('grid');
  }
};

updatePath();
window.addEventListener('hashchange', updatePath);
