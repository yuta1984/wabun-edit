import Document from '../model/Document';
import Wabun from './WabunEdit';
import { resolveTxt } from 'dns';

export class CaretPanel {
  $el: HTMLElement;
  $caret: HTMLSpanElement;
  parent: Wabun;
  doc: Document;

  constructor(parent: Wabun, $el: HTMLElement) {
    this.parent = parent;
    this.$el = $el;
    this.$caret = <HTMLSpanElement>this.$el.getElementsByClassName('caret')[0];
    this.doc = parent.doc;
    this.hideCaret();
    this.observeDocument();
    this.observeEditor();
    this.observeScroll();
  }

  observeDocument() {
    this.doc.on('selection-changed', () => this.update());
  }

  observeEditor() {
    this.parent.editorState.on('focus', (e: Wabun) => {
      this.showCaret();
    });
    this.parent.editorState.on('blur', (e: Wabun) => {
      this.hideCaret();
    });
  }

  observeScroll() { }

  caretCoordinates() {
    const selStart = this.doc.selStart;
    const chars = this.parent.sourcePanel.$el.getElementsByClassName('char');
    const origin = this.parent.sourcePanel.$el.getBoundingClientRect();
    let rect: ClientRect;
    if (chars[selStart]) {
      rect = chars[selStart].getBoundingClientRect();
    } else if (chars[selStart - 1] && chars[selStart - 1].innerHTML != '\n') {
      rect = chars[selStart - 1].getBoundingClientRect();
      return {
        x: rect.left - origin.left,
        y: rect.bottom - origin.top,
        width: rect.width,
        height: rect.height
      };
    } else {
      const lines = this.parent.sourcePanel.$el.getElementsByClassName('line');
      const line = lines[lines.length - 1];
      rect = line.getBoundingClientRect();
    }
    return {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      width: rect.width,
      height: rect.height
    };
  }

  getCaretCoordinates() {
    const coord = { x: 0, y: 0 };
    const selStart = this.doc.selStart;
    const chars = this.parent.sourcePanel.$el.getElementsByClassName('char');
    const next = chars[selStart];
    const previous = chars[selStart - 1];
    const origin = this.$el.getBoundingClientRect();
    if (next) {
      let rect = next.getBoundingClientRect();
      coord.x = rect.left - origin.left;
      coord.y = rect.top - origin.top;
    } else if (previous) {
      let rect = previous.getBoundingClientRect();
      if (previous.innerHTML === '\n') {
        const lnum = this.doc.getCurrentLineNum();
        const line = this.parent.sourcePanel.$el.getElementsByClassName('line')[
          lnum
        ];
        let rect = line.getBoundingClientRect();
        coord.x = rect.left - origin.left - 24;
        coord.y = rect.top - origin.top;
      } else {
        coord.x = rect.left - origin.left;
        coord.y = rect.bottom - origin.top;
      }
    } else {
      /*       const line = this.parent.sourcePanel.$el.getElementsByClassName(
        'line'
      )[0];
      let rect = line.getBoundingClientRect();
      coord.x = rect.left - origin.left;
      coord.y = rect.top - origin.top; */
    }
    return coord;
  }

  hideCaret() {
    this.$caret.style.display = 'none';
    // console.log('hige', this.$caret);
  }

  showCaret() {
    this.$caret.style.display = 'block';
  }

  update() {
    if (this.parent.textArea.hasFocus()) {
      this.showCaret();
    } else {
      this.hideCaret();
    }
    const selStart = this.doc.selStart;
    const selEnd = this.doc.selEnd;
    if (selStart === selEnd) {
      const newCaret = <HTMLSpanElement>this.$caret.cloneNode();
      const coord = this.caretCoordinates();
      // console.log(coord);
      newCaret.style.top = coord.y + 'px';
      newCaret.style.left = coord.x + 'px';
      this.$caret.parentNode.replaceChild(newCaret, this.$caret);
      this.$caret = newCaret;
    } else {
      this.hideCaret();
    }
  }
}
