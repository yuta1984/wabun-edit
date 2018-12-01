import { Observable, applyMixins } from '../utils/Observable';
import Wabun from '../components/WabunEdit';
import Document from './Document';

export default class CaretPos implements Observable {
  doc: Document;
  selStart: number = 0;
  selEnd: number = 0;
  parent: Wabun;
  x: number = 0;
  y: number = 0;
  handlers: { [s: string]: Array<(d: any) => void> } = {};
  emit: (event: string) => void;
  on: (events: string, handler: (e: any) => void) => void;

  constructor(parent: Wabun) {
    this.parent = parent;
    this.doc = parent.doc;
  }

  moveUp() {
    const start = this.doc.selStart;
    if (start > 0) {
      this.selStart = start - 1;
      this.selEnd = start - 1;
    } else {
      this.selStart = 0;
      this.selEnd = 0;
    }
    this.emit('moved');
  }

  moveDown() {
    const end = this.doc.selEnd;
    if (end < this.doc.src.length - 1) {
      this.selStart = end + 1;
      this.selEnd = end + 1;
    } else {
      this.selStart = end;
      this.selEnd = end;
    }
    this.emit('moved');
  }

  moveLeft() {
    const nearest = this.parent.sourcePanel.findVisuallyNearestCharInNextLine(
      this.x,
      this.y
    );
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  moveRight() {
    console.log(
      this.parent.sourcePanel.findVisuallyNearestCharInPrevLine(this.x, this.y)
    );
  }
}

applyMixins(CaretPos, [Observable]);
