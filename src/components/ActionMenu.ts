import Wabun from './WabunEdit';
import { ActionGroup, Action } from '../mode';

export default class ActionMenu {
  parent: Wabun;
  $el: HTMLElement;
  timer: number;
  message: string;
  actions: (editor: Wabun) => ActionGroup;
  constructor(parent: Wabun, $el: HTMLElement) {
    this.parent = parent;
    this.$el = $el;
    this.actions = parent.mode.actions;
    this.observeSelection();
    this.observeScroll();
  }

  observeSelection() {
    const doc = this.parent.doc;
    doc.on('selection-changed', () => this.update());
  }

  observeScroll() {
    const editorState = this.parent.editorState;
    editorState.on('scroll', () => this.hide());
  }

  showAt(rect: { top: number; right: number; bottom: number; left: number }) {
    let parentWidth = this.$el.parentElement.clientWidth;
    if (rect.left < 0.7 * parentWidth) {
      this.$el.style.left = rect.right + 'px';
      this.$el.style.right = null;
      this.$el.style.top = rect.top + 'px';
    } else {
      this.$el.style.left = null;
      this.$el.style.right = window.innerWidth - rect.left + 'px';
      this.$el.style.top = rect.top + 'px';
    }
    this.$el.style.display = 'block';
  }

  hide() {
    this.$el.style.display = 'none';
    if (this.timer) clearTimeout(this.timer);
  }

  waitAndShowActionMenu() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = window.setTimeout((): any => {
      this.$el.innerHTML = '';
      const actions = this.actions(this.parent);
      if (!actions) return null;
      this.renderActionGroup(actions).forEach(e => this.$el.appendChild(e));
      const charEl = this.parent.sourcePanel.getCharElAt(
        this.parent.doc.selStart
      );
      const rect = charEl.getBoundingClientRect();
      this.showAt(rect);
    }, 1000);
  }

  isActionGroup(ag: any): ag is ActionGroup {
    return ag.name !== undefined && ag.children !== undefined;
  }

  isAction(a: any): a is Action {
    return a.name !== undefined && a.action !== undefined;
  }

  showSubmenu(parentEl: HTMLElement, children: Array<ActionGroup | Action>) {
    // create dom
    const submenu = document.createElement('div');
    submenu.classList.add('action-menu');
    const items = children.forEach(ch => {
      let el = this.renderAction(ch);
      submenu.appendChild(el);
    });
    // set style
    submenu.style.position = 'fixed';
    const rect = parentEl.getBoundingClientRect();
    if (rect.right < 0.7 * window.outerWidth) {
      submenu.style.left = rect.width + 'px';
    } else {
      submenu.style.right = -rect.width + 'px';
    }
    parentEl.appendChild(submenu);
  }

  renderAction(a: ActionGroup | Action): HTMLElement {
    if (this.isActionGroup(a)) {
      const group = document.createElement('div');
      group.classList.add('action-item');
      group.classList.add('action-group');
      group.innerHTML = `${a.name}<span class="right-arrow">▶</span>`;
      group.addEventListener('mouseenter', () => {
        this.showSubmenu(group, a.children);
      });
      group.addEventListener('mouseleave', () => {
        group.getElementsByClassName('action-menu')[0].remove();
      });
      return group;
    } else {
      const action = document.createElement('div');
      action.classList.add('action-item');
      action.innerText = a.name;
      action.addEventListener('click', () => {
        a.action(this.parent);
      });
      return action;
    }
  }

  renderActionGroup(ag: ActionGroup): Array<HTMLElement> {
    const elms: Array<HTMLElement> = [];
    const header = document.createElement('div');
    header.classList.add('action-header');
    elms.push(header);
    header.innerText = ag.name;
    ag.children.forEach(group => {
      const item = this.renderAction(group);
      elms.push(item);
    });
    return elms;
  }

  update() {
    this.hide();
    this.waitAndShowActionMenu();
  }
}
