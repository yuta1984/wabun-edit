import diff = require('virtual-dom/diff');
import patch = require('virtual-dom/patch');
import createElement = require('virtual-dom/create-element');
import h = require('virtual-dom/h');
import { VTree } from 'virtual-dom';
import Document from '../model/Document';
import Wabun from './WabunEdit';

export default class SourcePanel {
  parent: Wabun;
  $el: HTMLElement;
  root: Element;
  doc: Document;
  vtree: VTree;

  constructor(parent: Wabun, $el: HTMLElement) {
    this.parent = parent;
    this.doc = parent.doc;
    this.$el = $el;
    // init
    this.vtree = this.render();
    const $newEl = createElement(this.vtree);
    this.$el.parentElement.replaceChild($newEl, this.$el);
    this.$el = <HTMLElement>$newEl;
    this.observeDoc();
    this.observeEditor();
  }

  observeDoc() {
    this.doc.on('updated selection-changed', d => {
      this.update();
    });
  }

  observeEditor() {
    this.parent.editorState.on('resize', () => {
      const edt = this.parent.editorState;
      // this.$el.style.width = edt.widthPx();
      this.$el.style.height = edt.height + 'px';
    });
  }

  scrollBy(x: number, y: number) {
    this.$el.scrollBy(x, y);
  }

  scrollTo(x: number, y: number) {
    this.$el.scrollTo(x, y);
  }

  charElArray(): Array<Element> {
    const chars = this.$el.getElementsByClassName('char');
    const ary: Array<Element> = [];
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      ary.push(char);
    }
    return ary;
  }

  // TODO: FIX THIS!
  findVisuallyNearestCharInPrevLine(x: number, y: number) {
    const lineWidth = 24;
    let candidates: Array<Element> = [];
    const chars = this.$el.getElementsByClassName('char');
    for (let index = 0; index < chars.length; index++) {
      const char = chars[index];
      if (char.getBoundingClientRect().left > x) candidates.push(char);
    }
    let nearest: Element;
    candidates.reverse().forEach(c => {
      nearest = nearest || c;
      let cTop = c.getBoundingClientRect().top;
      let nTop = nearest.getBoundingClientRect().top;
      if (Math.abs(cTop - y) < Math.abs(nTop - y)) nearest = c;
    });
    return nearest;
  }

  // TODO: FIX THIS!
  findVisuallyNearestCharInNextLine(x: number, y: number) {
    const lineWidth = 24;
    let candidates: Array<Element> = [];
    const chars = this.$el.getElementsByClassName('char');
    for (let index = 0; index < chars.length; index++) {
      const char = chars[index];
      if (char.getBoundingClientRect().left < x) candidates.push(char);
    }
    let nearest: Element;
    candidates.forEach(c => {
      nearest = nearest || c;
      let cTop = c.getBoundingClientRect().top;
      let nTop = nearest.getBoundingClientRect().top;
      if (Math.abs(cTop - y) < Math.abs(nTop - y)) nearest = c;
    });
    return nearest;
  }

  currentLineEl(): Element {
    const charEl = this.$el.getElementsByClassName('char')[this.doc.selStart];
    if (charEl) {
      return charEl.parentElement;
    } else {
      const lines = this.$el.getElementsByClassName('line');
      return lines[lines.length - 1];
    }
  }

  currentCaretEl(): Element {
    const charEl = this.$el.getElementsByClassName('char')[this.doc.selStart];
    if (charEl) {
      return charEl;
    } else {
      const lines = this.$el.getElementsByClassName('line');
      const lineEl = lines[lines.length - 1];
      return lineEl;
    }
  }

  getCharElAt(index: number): Element {
    return this.$el.getElementsByClassName('char')[index];
  }

  render() {
    const lines = this.doc.getLines();
    const lineDivs = lines.map((l, linenum) => {
      let chars = l.map(c => {
        return h(
          'span.char',
          { key: `char-${c.index}`, className: c.classList.join(' ') },
          c.char
        );
      });
      let hasError = chars.some(c => {
        return c.properties.className.indexOf('error') > 0;
      });
      return h(
        `div.line`,
        { key: `line-${linenum}`, className: hasError ? 'error' : '' },
        chars
      );
    });
    const linenumDiv = h('div.linenum', { key: 'linenum' }, '');
    lineDivs.unshift(linenumDiv);
    return h('div.source-panel', { key: 'root' }, lineDivs);
  }

  update() {
    let start = Date.now();
    const newTree = this.render();
    const patches = diff(this.vtree, newTree);
    patch(this.$el, patches);
    let end = Date.now();
    this.vtree = newTree;
    // console.log('render: ', end - start, ' ms.');
  }
}
