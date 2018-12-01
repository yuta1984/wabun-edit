import Document from '../model/Document';
import SourcePanel from './SourcePanel';
import { Observable, applyMixins } from '../utils/Observable';
import { CaretPanel } from './CaretPanel';
import HiddenTextArea from './HiddenTextArea';
import EditorState from '../model/EditorState';
import Display from './Display';
import modeList, { Mode } from '../mode';
import CaretPos from '../model/CaretPos';
import Popup from './Popup';
import ActionMenu from './ActionMenu';

export interface Options {
  value?: string;
  showLineNumbers?: boolean;
  mode?: string;
}

export default class Wabun implements Observable {
  mode: Mode;
  private $container: HTMLElement;
  private $root: HTMLElement;
  // models and states
  doc: Document;
  editorState: EditorState;
  caret: CaretPos;
  // componensts
  display: Display;
  sourcePanel: SourcePanel;
  caretPanel: CaretPanel;
  textArea: HiddenTextArea;
  popup: Popup;
  actionMenu: ActionMenu;
  handlers: { [s: string]: Array<(d: any) => void> } = {};

  constructor($container: HTMLElement, options: Options) {
    this.setMode(options.mode);
    // get container and its size
    this.$container = $container;
    // init models
    this.doc = new Document(this.mode);
    this.editorState = new EditorState();
    this.caret = new CaretPos(this);
    // build doms
    this.$root = document.createElement('div');
    this.$root.classList.add('wabun-edit');
    this.$root.style.width = this.editorState.width + 'px';
    this.$root.style.height = this.editorState.height + 'px';

    const $textarea = document.createElement('textarea');
    $textarea.classList.add('editor');
    $textarea.value = options.value || '';
    const $display = document.createElement('div');
    $display.classList.add('display');

    const $sourcePanel = document.createElement('div');
    $sourcePanel.classList.add('source-panel');
    const $caretPanel = document.createElement('div');
    $caretPanel.classList.add('caret-panel');
    const $caret = document.createElement('span');
    $caret.classList.add('caret');
    const $popup = document.createElement('div');
    $popup.classList.add('popup');
    const $actionMenu = document.createElement('div');
    $actionMenu.classList.add('action-menu');
    this.$root.appendChild($textarea);
    this.$root.appendChild($display);

    $display.appendChild($sourcePanel);
    $display.appendChild($caretPanel);
    $display.appendChild($popup);
    $display.appendChild($actionMenu);
    $caretPanel.appendChild($caret);
    // put the root dom in container
    this.$container.innerHTML = '';
    this.$container.appendChild(this.$root);

    // create components from doms
    this.display = new Display(this, $display);
    this.sourcePanel = new SourcePanel(this, $sourcePanel);
    this.caretPanel = new CaretPanel(this, $caretPanel);
    this.textArea = new HiddenTextArea(this, $textarea);
    this.popup = new Popup(this, $popup);
    this.actionMenu = new ActionMenu(this, $actionMenu);

    // update model
    this.doc.updateSource(options.value);

    // start observers
    this.observeEditor();
    this.observeDoc();

    // set editor size
    const rect = this.$container.getBoundingClientRect();
    this.editorState.setSize(rect.width, rect.height - 10);
    this.display.syncScroll();
  }

  setMode(name: string) {
    this.mode = modeList[name] || modeList['koji'];
  }

  observeEditor() {
    this.editorState.on('resize', () => {
      this.$root.style.width = this.editorState.widthPx();
      this.$root.style.height = this.editorState.heightPx();
    });
  }

  observeDoc() {
    this.doc.on('updated', () => {
      this.emit('updated');
    });
  }

  addClass(className: string, from: number, to: number) {
    this.doc.addClass(className, from, to);
  }
  removeClass(className: string, from: number, to: number) {
    this.doc.removeClass(className, from, to);
  }

  get value(): string {
    return this.doc.src;
  }

  get ast(): any {
    return this.doc.ast;
  }

  emit: (event: string) => void;
  on: (events: string, handler: (e: any) => void) => void;
}

applyMixins(Wabun, [Observable]);
