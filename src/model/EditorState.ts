import { Observable, applyMixins } from '../utils/Observable';

type EditorEvent = 'resize' | 'focus' | 'blur' | 'scroll';

export default class EditorState implements Observable {
  width: number;
  height: number;
  focus: boolean;
  maxScroll: number;
  currentScroll: number = 0;
  handlers: { [s: string]: Array<(d: any) => void> } = {};

  emit: (event: EditorEvent) => void;
  on: (events: EditorEvent, handler: (e: any) => void) => void;

  setSize(width: number, height: number) {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.emit('resize');
    }
  }

  widthPx(): string {
    return this.width + 'px';
  }

  heightPx(): string {
    return this.height + 'px';
  }

  setFocus(focus: boolean) {
    if (focus !== this.focus) {
      this.focus = focus;
      if (focus) {
        this.emit('focus');
      } else {
        this.emit('blur');
      }
    }
  }

  setCurrentScroll(num: number) {
    if (num !== this.currentScroll) {
      this.currentScroll = num;
      this.emit('scroll');
    }
  }

  setMaxScroll(num: number) {
    if (num !== this.maxScroll) {
      this.maxScroll = num;
      this.emit('scroll');
    }
  }
}

applyMixins(EditorState, [Observable]);
