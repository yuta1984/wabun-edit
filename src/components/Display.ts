import Wabun from './WabunEdit';

export default class Display {
  parent: Wabun;
  $el: HTMLElement;

  constructor(parent: Wabun, $el: HTMLElement) {
    this.parent = parent;
    this.$el = $el;
    this.observeEditor();
  }

  observeEditor() {
    this.parent.editorState.on('resize', () => {
      const edt = this.parent.editorState;
      this.$el.style.width = edt.widthPx();
      this.$el.style.height = edt.heightPx();
    });

    this.parent.editorState.on('scroll', () => {
      this.syncScroll()
    });
  }

  syncScroll() {
    const offset =
      this.$el.scrollWidth -
      this.$el.clientWidth -
      this.parent.editorState.currentScroll;
    this.$el.scrollTo(offset, 0);
  }
}
