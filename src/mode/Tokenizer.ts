export class InputStream {
  pos = 0;
  line = 0;
  col = 0;
  input: string;

  constructor(input: string) {
    this.input = input;
  }

  next() {
    let ch = this.input.charAt(this.pos++);
    if (ch === '\n') this.line++, (this.col = 0);
    else this.col++;
    return ch;
  }

  peek() {
    return this.input[this.pos];
  }

  eof() {
    return this.peek() === undefined;
  }

  croak(msg: string) {
    throw new Error(msg + ' (' + this.line + ':' + this.col + ')');
  }
}

export interface Token {
  type: string;
  value: string;
  start?: number;
  end?: number;
  tokenIndex?: number;
  pairIndex?: number;
  error?: boolean;
  errorMsg?: string;
}

export default abstract class Tokenizer {
  is: InputStream;
  current: Token;

  peek() {
    return this.current || (this.current = this.readNext());
  }

  next(): Token {
    let tok = this.current;
    this.current = null;
    return tok || this.readNext();
  }

  eof() {
    return this.peek() == null;
  }

  constructor(src: string) {
    this.is = new InputStream(src);
  }

  abstract readNext(): Token;

  abstract tokenize(): Array<Token>;
}
