const hljs = require('highlight.js')
const loaderUtils = require('loader-utils')
const markdown = require('markdown-it')

/**
 * `{{ }}` => `<span>{{</span> <span>}}</span>`
 * @param  {string} str
 * @return {string}
 */
const replaceDelimiters = str => {
  return str.replace(/({{|}})/g, '<span>$1</span>')
}

/**
 * renderHighlight
 * @param  {string} str
 * @param  {string} lang
 */
const renderHighlight = (str, lang) => {
  if (!(lang && hljs.getLanguage(lang))) {
    return ''
  }

  try {
    return replaceDelimiters(hljs.highlight(lang, str, true).value)
  } catch (err) {}
}

/**
 * html => vue file template
 * @param  {[type]} html [description]
 * @return {[type]}      [description]
 */
const renderVueTemplate = html => {
  return '<section>' + html + '</section>\n'
}

/**
 * Resolves plguins passed as string
 * @param {String|Object} plugin
 * @return {Object}
 */
const resolvePlugin = plugin => {
  if (typeof plugin === 'string') {
    return require(plugin)
  }
  return plugin
}

module.exports = function (source) {
  this.cacheable()

  let parser
  const params = loaderUtils.getOptions(this)
  let opts = Object.assign({}, params)

  if (typeof (opts.render) === 'function') {
    parser = opts
  } else {
    opts = Object.assign({
      preset: 'default',
      html: true,
      highlight: renderHighlight
    }, opts)

    const plugins = opts.use
    var preprocess = opts.preprocess

    delete opts.use
    delete opts.preprocess

    parser = markdown(opts.preset, opts)
    if (plugins) {
      plugins.forEach(plugin => {
        if (Array.isArray(plugin)) {
          plugin[0] = resolvePlugin(plugin[0])
          parser.use.apply(parser, plugin)
        } else {
          parser.use(resolvePlugin(plugin))
        }
      })
    }
  }

  const codeInlineRender = parser.renderer.rules.code_inline;
  parser.renderer.rules.code_inline = function () {
    return replaceDelimiters(codeInlineRender.apply(this, arguments));
  }

  if (preprocess) {
    source = preprocess.call(this, parser, source)
  }

  const content = parser.render(source)

  return renderVueTemplate(content)
}
