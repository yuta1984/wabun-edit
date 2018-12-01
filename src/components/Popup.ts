import Wabun from './WabunEdit';
import { Error } from '../model/Document';

export default class Popup {
  parent: Wabun;
  $el: HTMLElement;
  message: string;
  constructor(parent: Wabun, $el: HTMLElement) {
    this.parent = parent;
    this.$el = $el;
    this.$el.style.position = 'abosolute';
    this.observeSelection();
    this.observeScroll();
  }

  observeSelection() {
    const doc = this.parent.doc;
    doc.on('selection-changed', () => {
      this.update();
    });
  }

  observeScroll() {
    const editorState = this.parent.editorState;
    editorState.on('scroll', () => this.hide());
  }

  showError(error: Error) {
    const charEl = <HTMLElement>(
      this.parent.sourcePanel.getCharElAt(error.start)
    );
    if (charEl) {
      const rect: ClientRect = charEl.getBoundingClientRect();
      console.log(rect);
      this.$el.className = 'popup error';
      this.message = error.message;
      this.showAt(rect);
    }
  }

  show() {
    this.$el.style.display = 'block';
    this.$el.innerHTML = this.message;
  }

  showAt(rect: { top: number; right: number; bottom: number; left: number }) {
    let parentWidth = this.$el.parentElement.clientWidth;
    if (rect.left < 0.7 * parentWidth) {
      this.$el.style.left = rect.right + 'px';
      this.$el.style.right = null;
      this.$el.style.top = rect.top + 'px';
    } else {
      this.$el.style.left = null;
      this.$el.style.right = window.outerWidth - rect.left + 'px';
      this.$el.style.top = rect.top + 'px';
    }
    this.show();
  }

  hide() {
    this.$el.style.display = 'none';
  }

  update() {
    const doc = this.parent.doc;
    if (doc.selStart !== doc.selEnd) {
      this.hide();
    } else {
      const start = doc.selStart;
      const err = doc.getErrorAt(start) || doc.getErrorAt(start - 1);
      if (err) {
        this.showError(err);
      } else {
        this.hide();
      }
    }
  }
}
