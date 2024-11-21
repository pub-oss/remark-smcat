'use strict';
const visit = require('unist-util-visit');
const utils = require('./utils');
const render = utils.render;
const getDestinationDir = utils.getDestinationDir;
const visitCodeBlock = (ast: any, vFile: any) => {
  const options = vFile.data
  return visit(ast, 'code', (node: any, index: any, parent: any) => {
    // TODO add meta parsing
    const { lang, value, position } = node;
    // smcat 输出的目标路径
     const destinationDir = getDestinationDir(vFile);
    if (['smcat'].includes(lang)) {
      let graphSvgFilename;
      try {
        graphSvgFilename = render(destinationDir, value, lang);
        vFile.info(`${lang} code block replaced with graph`, position, 'remark-smcat');
      } catch (error) {
        console.error(error);
        vFile.message(error, position, 'remark-smcat');
        return node;
      }

      let svgUrl = graphSvgFilename
      if (options && options.rewriteSvgUrl) {
        svgUrl = options.rewriteSvgUrl(svgUrl)
      }
      // @see https://github.com/syntax-tree/mdast?tab=readme-ov-file#image
      // 通过 img 标签直接引用 svg 图片
      const image = {
        type: 'image',
        title: '`smcat` image',
        url: svgUrl,
      };
      parent.children.splice(index, 1, image);
      return node;
    }
  })
}

export const smcatParser = (options: any) => {
  return function transformer(ast: any, vFile: any, next: any) {
    
    vFile.data = options;
    visitCodeBlock(ast, vFile);

    if (typeof next === 'function') {
      return next(null, ast, vFile);
    }

    return ast;
  }
}

module.exports = smcatParser;
