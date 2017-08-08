/*
 * scratchblocks
 * http://scratchblocks.github.io/
 *
 * Copyright 2013-2016, Tim Radvan
 * @license MIT
 * http://opensource.org/licenses/MIT
 */
(function (mod) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    var makeCanvas = function() { return document.createElement('canvas'); };
    var scratchblocks = window.scratchblocks = mod(window, makeCanvas);

    // add our CSS to the page
    document.head.appendChild(scratchblocks.makeStyle());
  }
}(function(window, makeCanvas) {
  'use strict';

  var document = window.document;


  /* utils */

  function extend(src, dest) { return Object.assign({}, dest, src); }

  /*****************************************************************************/

  var { allLanguages, loadLanguages } = require('./blocks.js');

  var parse = require('./syntax.js').parse;

  var style = require('./style.js');

  /*****************************************************************************/

  var {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,
  } = require('./model.js');

  /*****************************************************************************/

  var SVG = require('./draw.js');
  SVG.init(window, makeCanvas);

  Label.measuring = (function() {
    var canvas = SVG.makeCanvas();
    return canvas.getContext('2d');
  }());

  /*****************************************************************************/

  function render(doc, cb) {
    return doc.render(cb);
  }


  /*** Render ***/

  // read code from a DOM element
  function readCode(el, options) {
    var options = extend({
      inline: false,
    }, options);

    var html = el.innerHTML.replace(/<br>\s?|\n|\r\n|\r/ig, '\n');
    var pre = document.createElement('pre');
    pre.innerHTML = html;
    var code = pre.textContent;
    if (options.inline) {
      code = code.replace('\n', '');
    }
    return code;
  }

  // insert 'svg' into 'el', with appropriate wrapper elements
  function replace(el, svg, scripts, options) {
    if (options.inline) {
      var container = document.createElement('span');
      var cls = "scratchblocks scratchblocks-inline";
      if (scripts[0] && !scripts[0].isEmpty) {
        cls += " scratchblocks-inline-" + scripts[0].blocks[0].shape;
      }
      container.className = cls;
      container.style.display = 'inline-block';
      container.style.verticalAlign = 'middle';
    } else {
      var container = document.createElement('div');
      container.className = "scratchblocks";
    }
    container.appendChild(svg);

    el.innerHTML = '';
    el.appendChild(container);
  }

  /* Render all matching elements in page to shiny scratch blocks.
   * Accepts a CSS selector as an argument.
   *
   *  scratchblocks.renderMatching("pre.blocks");
   *
   * Like the old 'scratchblocks2.parse().
   */
  var renderMatching = function (selector, options) {
    var selector = selector || "pre.blocks";
    var options = extend({
      inline: false,
      languages: ['en'],

      read: readCode, // function(el, options) => code
      parse: parse,   // function(code, options) => doc
      render: render, // function(doc, cb) => svg
      replace: replace, // function(el, svg, doc, options)
    }, options);

    // find elements
    var results = [].slice.apply(document.querySelectorAll(selector));
    results.forEach(function(el) {
      var code = options.read(el, options);

      var doc = options.parse(code, options);

      options.render(doc, function(svg) {
        options.replace(el, svg, doc, options);
      });
    });
  };


  /* Parse scratchblocks code and return XML string.
   *
   * Convenience function for Node, really.
   */
  var renderSVGString = function (code, options) {
    var doc = parse(code, options);

    // WARN: Document.render() may become async again in future :-(
    doc.render(function() {});

    return doc.exportSVGString();
  };


  return {
    allLanguages: allLanguages, // read-only
    loadLanguages: loadLanguages,

    fromJSON: Document.fromJSON,
    toJSON: function(doc) { return doc.toJSON(); },
    stringify: function(doc) { return doc.stringify(); },

    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,

    read: readCode,
    parse: parse,
    // render: render, // REMOVED since doc.render(cb) makes much more sense
    replace: replace,
    renderMatching: renderMatching,

    renderSVGString: renderSVGString,
    makeStyle: style.makeStyle,
  };

}));
