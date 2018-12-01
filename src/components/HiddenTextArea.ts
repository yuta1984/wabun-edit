import Document from '../model/Document';
import Wabun from './WabunEdit';
import { Observable, applyMixins } from '../utils/Observable';

export default class HiddenTextArea implements Observable {
  parent: Wabun;
  $el: HTMLTextAreaElement;
  doc: Document;
  handlers: { [s: string]: Array<(d: any) => void> } = {};

  constructor(parent: Wabun, $el: HTMLTextAreaElement) {
    this.parent = parent;
    this.doc = parent.doc;
    this.$el = $el;

    this.observeFocus();
    this.observeSrc();
    this.observeEl();
    this.observeSelection();
    this.observeEditor();
    this.observeKeyEvents();
  }

  setValue(value: string) {
    this.$el.value = value;
  }

  focus() {
    this.$el.focus();
  }

  hasFocus(): boolean {
    return this.$el.matches(':focus');
  }

  observeSrc() {
    let events = ['input', 'click', 'oncut', 'onpaste', 'keyup'];
    events.forEach(e => {
      this.$el.addEventListener(e, () => {
        this.doc.updateSource(this.$el.value);
        this.setScroll();
      });
    });
  }

  private observeFocus() {
    this.$el.addEventListener('focus', e => {
      // console.log('focus');
      this.emit('focus');
    });
    this.$el.addEventListener('blur', e => {
      // console.log('blur');
      this.emit('blur');
    });
  }

  private observeSelection() {
    setInterval(() => {
      if (
        this.$el.selectionStart !== this.doc.selStart ||
        this.$el.selectionEnd !== this.doc.selEnd
      ) {
        this.doc.setSelection(this.$el.selectionStart, this.$el.selectionEnd);
        const char = this.parent.sourcePanel.currentCaretEl();
        const rect = char.getBoundingClientRect();
        this.parent.caret.x = rect.left;
        this.parent.caret.y = rect.top;
      }
    }, 10);
  }

  observeEl() {
    this.$el.addEventListener('scroll', e => {
      this.setScroll();
    });
    this.$el.addEventListener('resize', e => {
      this.setScroll();
    });
    this.$el.addEventListener('focus', e => {
      this.parent.editorState.setFocus(true);
    });
    this.$el.addEventListener('blur', e => {
      this.parent.editorState.setFocus(false);
    });
  }

  observeEditor() {
    this.parent.editorState.on('resize', () => {
      const edt = this.parent.editorState;
      this.$el.style.width = edt.height - 30 + 'px';
      this.$el.style.height = edt.widthPx();
      this.$el.style.left = edt.widthPx();
    });
  }

  observeKeyEvents() {
    this.$el.addEventListener('compositionstart', e => {});
    this.$el.addEventListener('compositionupdate', e => {
      let data = (<CompositionEvent>e).data;
      let start = this.doc.selStart - data.length;
      let end = this.doc.selStart;
      this.doc.removeClass('overline', 0, this.doc.chars.length - 1);
      this.doc.addClass('overline', start, end);
      console.log(start, end);
      this.doc.emit('updated');
    });
    this.$el.addEventListener('compositionend', e => {
      console.log('end');
      this.doc.removeClass('overline', 0, this.doc.chars.length - 1);
      this.doc.emit('updated');
    });

    this.$el.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') {
        this.moveUp();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this.moveRight();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.moveDown();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        this.moveLeft();
        e.preventDefault();
      }
    });
  }

  moveUp() {
    const start = this.$el.selectionStart;
    if (start > 0) {
      this.$el.selectionStart = start - 1;
      this.$el.selectionEnd = start - 1;
    } else {
      this.$el.selectionStart = start;
      this.$el.selectionEnd = start;
    }
  }

  moveDown() {
    const end = this.$el.selectionEnd;
    if (end < this.$el.value.length) {
      this.$el.selectionStart = end + 1;
      this.$el.selectionEnd = end + 1;
    } else {
      this.$el.selectionStart = end;
      this.$el.selectionEnd = end;
    }
  }

  moveLeft() {
    const x = this.parent.caret.x;
    const y = this.parent.caret.y;
    const chars = this.parent.sourcePanel.charElArray();
    const nearest = this.parent.sourcePanel.findVisuallyNearestCharInNextLine(
      x,
      y
    );
    console.log(nearest);
    let pos = this.$el.value.length;
    if (nearest) {
      pos = chars.indexOf(nearest);
    }
    this.$el.selectionStart = pos;
    this.$el.selectionEnd = pos;
  }

  moveRight() {
    const x = this.parent.caret.x;
    const y = this.parent.caret.y;

    const chars = this.parent.sourcePanel.charElArray();
    const nearest = this.parent.sourcePanel.findVisuallyNearestCharInPrevLine(
      x,
      y
    );
    let pos = 0;
    if (nearest) {
      pos = chars.indexOf(nearest);
    }
    this.$el.selectionStart = pos;
    this.$el.selectionEnd = pos;
  }

  setScroll() {
    // console.log(this.$el.scrollTop, this.$el.scrollHeight);
    this.parent.editorState.setCurrentScroll(this.$el.scrollTop);
    this.parent.editorState.setMaxScroll(this.$el.scrollHeight);
  }

  setSelection(start: number, end: number) {
    this.$el.selectionStart = start;
    this.$el.selectionEnd = end;
  }
  emit: (event: string) => void;
  on: (events: string, handler: (e: any) => void) => void;
}

// mixin
applyMixins(HiddenTextArea, [Observable]);
