import fs from 'fs-extra';

/**
 * @param {String} name Element name
 * @param {String} [template=element] Template name
 */
export default function (name, template) {
  fs.copySync(`node_modules/@damienmortini/element-starter-${template}`, `./packages/${name}`, {
    dereference: true,
  });
  const packageData = fs.readJSONSync(`./packages/${name}/package.json`);
  fs.outputFileSync(`./packages/${name}/package.json`, JSON.stringify({
    name: `@damienmortini/${name}`,
    private: true,
    version: '0.0.0',
    dependencies: packageData.dependencies,
    devDependencies: packageData.devDependencies,
  }, null, 2));
  let indexFileContent = fs.readFileSync(`./packages/${name}/index.js`, { encoding: 'utf-8' });
  indexFileContent = indexFileContent.replace(new RegExp(`damo-starter-${template}`, 'g'), name);
  fs.writeFileSync(`./packages/${name}/index.js`, indexFileContent);
  fs.removeSync(`./packages/${name}/LICENSE`);
};
