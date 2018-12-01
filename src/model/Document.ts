import { Observable, applyMixins } from '../utils/Observable';
import { Mode } from '../mode';
import { Token } from '../mode/Tokenizer';

export interface Character {
  index: number;
  linenum: number;
  char: string;
  classList: Array<string>;
  pairStart?: number;
  pairEnd?: number;
}

export interface Error {
  start: number;
  end: number;
  message: string;
}

export interface Line extends Array<Character> {}

// singleton
export default class Document implements Observable {
  src: string;
  chars: Array<Character>;
  tokens: Array<Token>;
  selStart: number = 0;
  selEnd: number = 0;
  ast: any;
  errors: Array<Error> = [];
  handlers: { [s: string]: Array<(d: any) => void> } = {};
  mode: Mode;

  constructor(mode: Mode) {
    this.chars = [];
    this.tokens = [];
    this.mode = mode;
    this.on('selection-changed', () => {
      this.highlightPair();
      this.highlightToken();
    });
  }

  updateSource(src: string): void {
    let start = Date.now();
    if (this.src !== src) {
      this.src = src;
      let linenum = 0;
      this.chars = src.split('').map((c, i) => {
        let char: Character = {
          index: i,
          char: c,
          linenum: linenum,
          classList: []
        };
        if (c === '\n') {
          linenum++;
          char.classList.push('lb');
        }
        if (c === '　') {
          char.char = '□';
          char.classList.push('zenkaku-space');
        }
        return char;
      });
      this.errors = [];
      this.tokens = this.tokenize();
      this.ast = this.parse();
      this.applySyntaxHighlight();
      this.emit('updated');
    }
  }

  highlightPair() {
    this.removeClass('outline', 0, this.chars.length - 1);
    if (this.selStart !== this.selEnd) return;
    const next = this.chars[this.selStart];
    const prev = this.chars[this.selStart - 1];
    const nextTok = this.getTokenOf(next);
    const prevTok = this.getTokenOf(prev);
    let target: Token;
    if (nextTok && nextTok.pairIndex !== undefined) {
      target = nextTok;
    } else if (prevTok && prevTok.pairIndex !== undefined) {
      target = prevTok;
    }
    if (target) {
      let pair = this.tokens[target.pairIndex];
      this.addClass('outline', target.start, target.end);
      this.addClass('outline', pair.start, pair.end);
    }
  }

  highlightToken() {
    this.removeClass('focus', 0, this.chars.length - 1);
    if (this.selStart !== this.selEnd) return;
    const next = this.chars[this.selStart];
    const prev = this.chars[this.selStart - 1];
    const nextTok = this.getTokenOf(next);
    const prevTok = this.getTokenOf(prev);
    let target: Token;
    if (nextTok && nextTok.type === 'INLINE_NAME') {
      target = nextTok;
    } else if (prevTok && prevTok.type === 'INLINE_NAME') {
      target = prevTok;
    }
    if (target) {
      this.addClass('focus', target.start, target.end);
    }
  }

  tokenize(): Array<Token> {
    let tokenizer = new this.mode.tokenizer(this.src);
    let tokens = tokenizer.tokenize();
    tokens.forEach(t => {
      if (t.error) {
        this.errors.push({ start: t.start, end: t.end, message: t.errorMsg });
      }
    });
    return tokens;
  }

  parse() {
    try {
      const ast = this.mode.parse(this.src);
      return ast;
    } catch (e) {
      console.error(e.message);
      let start = e.location.start.offset;
      let end = e.location.end.offset;
      console.error(start, end);
      this.errors.push({ start: start, end: end, message: e.message });
      this.addClass('error', start, end);
    }
    let timeout = setTimeout(() => {}, 1000);
  }

  applySyntaxHighlight() {
    let map = this.mode.tokenClassMap;
    this.tokens.forEach(token => {
      let className = map[token.type];
      for (let i = token.start; i < token.end; i++) {
        let ch = this.chars[i];
        ch.classList.push(className);
      }
      if (token.error) this.addClass('error', token.start, token.end);
    });
  }

  getTokenOf(char: Character): Token {
    if (!char) return null;
    let res: Token;
    this.tokens.forEach(t => {
      if (char.index >= t.start && char.index <= t.end) return (res = t);
    });
    return res;
  }

  getCurrentToken(): Token {
    if (this.hasSelection()) return null;
    return this.getTokenOf(this.chars[this.selStart]);
  }

  getErrorAt(index: number): Error {
    let error: Error;
    this.errors.forEach(e => {
      if (index >= e.start && index < e.end) error = e;
    });
    return error;
  }

  getLines(): Array<Line> {
    const lines: Array<Line> = [];
    // make sure there is at least one line in the doc
    lines.push([]);
    this.chars.forEach(c => {
      lines[lines.length - 1].push(c);
      if (c.char === '\n') lines.push([]);
    });
    return lines;
  }

  getCurrentLineNum(): number {
    if (this.chars.length === 0) return 0;
    const nextChar = this.chars[this.selStart];
    if (nextChar) {
      return nextChar.linenum;
    } else {
      const prevChar = this.chars[this.selStart - 1];
      return prevChar.linenum;
    }
  }

  addClass(className: string, start: number, end: number): void {
    // console.log(start, end);
    for (let i = start; i < end; i++) {
      if (this.chars[i]) this.chars[i].classList.push(className);
    }
    this.emit('updated');
    this.emit('class-changed');
  }

  removeClass(className: string, start: number, end: number): void {
    for (let i = start; i <= end; i++) {
      let index = this.chars[i].classList.indexOf(className);
      if (index !== -1) this.chars[i].classList.splice(index, 1);
    }
    this.emit('class-changed');
  }

  removeAllClass(start: number, end: number): void {
    for (let i = start; i < end; i++) {
      this.chars[i].classList = [];
    }
    this.emit('class-changed');
  }

  resetClass() {
    this.chars.forEach(c => (c.classList = []));
    this.emit('class-changed');
  }

  setCaretPosition(start: number): void {
    this.setSelection(start, start);
  }

  setSelection(start: number, end: number): void {
    if (this.selStart !== start || this.selEnd !== end) {
      this.selStart = start;
      this.selEnd = end;
      this.clearSelection();
      if (this.selStart !== this.selEnd) {
        this.addClass('selected', this.selStart, this.selEnd);
      }
      this.emit('selection-changed');
    }
  }

  clearSelection() {
    this.removeClass('selected', 0, this.chars.length - 1);
  }

  hasSelection() {
    return this.selEnd !== this.selStart;
  }

  emit: (event: string) => void;
  on: (events: string, handler: (e: any) => void) => void;
}

applyMixins(Document, [Observable]);
