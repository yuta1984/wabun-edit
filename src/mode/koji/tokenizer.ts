import Tokenizer, { Token, InputStream } from '../Tokenizer';

export type TOKEN_TYPE =
  | 'ID'
  | 'CLASS'
  | 'INLINE_START'
  | 'INLINE_NAME'
  | 'INLINE_SEP'
  | 'COLON'
  | 'INLINE_END'
  | 'FURIGANA_START'
  | 'FURIGANA_END'
  | 'KAERI_START'
  | 'KAERI_END'
  | 'FURIGANA'
  | 'FURIGANA_SEP'
  | 'KAERITEN'
  | 'OKURIGANA'
  | 'OKURIGANA_START'
  | 'OKURIGANA_END'
  | 'ANNOTATION'
  | 'BLOCK_START'
  | 'BLOCK_NAME'
  | 'BLOCK_CLOSING_START'
  | 'BLOCK_END'
  | 'ANNO_START'
  | 'ANNO_END'
  | 'TEXT_SEGMENT'
  | 'LB'
  | 'UNKNOWN';

interface State {
  brackets: Array<Token>;
  errors: Array<number>;
  inInlinePre: boolean;
  inInlineBody: boolean;
  inBlockTag: boolean;
  inFurigana: boolean;
  inKaeriten: boolean;
  inOkurigana: boolean;
  inAnno: boolean;
}

export default class KojiTokenizer extends Tokenizer {
  tokenIndex = 0;
  is: InputStream;
  state: State;
  current: any;
  brackets: { [s: string]: TOKEN_TYPE } = {
    '（': 'FURIGANA_START',
    '）': 'FURIGANA_END',
    '｛': 'KAERI_START',
    '｝': 'KAERI_END',
    '〔': 'OKURIGANA_START',
    '〕': 'OKURIGANA_END',
    '【': 'ANNO_START',
    '】': 'ANNO_END'
  };

  constructor(src: string) {
    super(src);
    this.state = {
      brackets: [],
      errors: [],
      inInlinePre: false,
      inInlineBody: false,
      inBlockTag: false,
      inFurigana: false,
      inKaeriten: false,
      inOkurigana: false,
      inAnno: false
    };
  }

  isBracket(ch: string): boolean {
    return '（）｛｝【】〔〕'.indexOf(ch) > -1;
  }

  isColon(ch: string): boolean {
    return ch === '：';
  }

  isLetter(ch: string): boolean {
    let regex = [
      /[\u0020-\u007E]/,
      /[\u2000-\u206F]/,
      /[\u4E00-\u9FEA\u3400-\u4DFF]/,
      /[\u3040-\u309F]/,
      /[\u30A0-\u30FF\u31F0-\u31FF]/,
      /[\u1B000-\u1B000\u1B100-\u1B12F]/,
      /[\u3190-\u319F]/,
      /[\u3000-\u3007\u300C-\u300F\u3012-\u3013\u3016-\u303F]/,
      /[\uFF00-\uFF02\uFF04-\uFF07\uFF0B-\uFF0E\uFF10-\uFF19\uFF1B-\uFF3A\uFF3E-\uFF5A\uFF5E-\uFFEF]/
    ];
    return regex.some(r => ch.match(r) != null);
  }

  isMatchingPair(ch1: string, ch2: string): boolean {
    return (
      (ch1 === '《' && ch2 === '》') ||
      (ch1 === '（' && ch2 === '）') ||
      (ch1 === '｛' && ch2 === '｝') ||
      (ch1 === '〔' && ch2 === '〕') ||
      (ch1 === '［' && ch2 === '］') ||
      (ch1 === '［／' && ch2 === '］') ||
      (ch1 === '【' && ch2 === '】')
    );
  }
  readWhile(predicate: (ch: string) => boolean) {
    let buf = '';
    while (!this.is.eof() && predicate(this.is.peek())) buf += this.is.next();
    return buf;
  }

  readTextSegment(): Token {
    const seg = this.readWhile(this.isLetter);
    if (this.state.inInlinePre) {
      return { type: 'INLINE_NAME', value: name };
    } else if (this.state.inBlockTag) {
      return { type: 'BLOCK_NAME', value: name };
    } else if (this.state.inFurigana) {
      return { type: 'FURIGANA', value: seg };
    } else if (this.state.inKaeriten) {
      return { type: 'KAERITEN', value: seg };
    } else if (this.state.inOkurigana) {
      return { type: 'OKURIGANA', value: seg };
    } else if (this.state.inAnno) {
      return { type: 'ANNOTATION', value: seg };
    } else {
      return { type: 'TEXT_SEGMENT', value: seg };
    }
  }

  readBracket(): Token {
    const ch = this.is.next();
    let tok: Token;
    if ('｛（【〔'.indexOf(ch) > -1) {
      tok = { type: this.brackets[ch], value: ch };
      this.state.brackets.push(tok);
      if (ch === '（') this.state.inFurigana = true;
      if (ch === '｛') this.state.inKaeriten = true;
      if (ch === '〔') this.state.inOkurigana = true;
      if (ch === '【') this.state.inAnno = true;
    } else {
      tok = { type: this.brackets[ch], value: ch };
      const pair = this.state.brackets[this.state.brackets.length - 1];
      if (pair && this.isMatchingPair(pair.value, ch)) {
        this.state.brackets.pop();
        pair.pairIndex = this.tokenIndex;
        tok.pairIndex = pair.tokenIndex;
      } else {
        this.state.brackets.push(tok);
        tok.error = true;
        tok.errorMsg = '対応する括弧がありません．';
      }
      if (ch === '）') this.state.inFurigana = false;
      if (ch === '｝') this.state.inKaeriten = false;
      if (ch === '〕') this.state.inOkurigana = false;
      if (ch === '】') this.state.inAnno = false;
    }
    return tok;
  }

  readInlineStart(): Token {
    let ch = this.is.next();
    this.state.inInlinePre = true;
    let tok: Token = { type: 'INLINE_START', value: ch };
    this.state.brackets.push(tok);
    return tok;
  }

  readInlineEnd(): Token {
    let ch = this.is.next();
    let tok: Token = { type: 'INLINE_END', value: ch };
    this.state.inInlinePre = false;
    this.state.inInlineBody = false;
    const last = this.state.brackets[this.state.brackets.length - 1];
    if (last && last.type === 'INLINE_START') {
      this.state.brackets.pop();
      last.pairIndex = this.tokenIndex;
      tok.pairIndex = last.tokenIndex;
    } else {
      tok.error = true;
      tok.errorMsg = '対応する括弧がありません．';
    }
    return tok;
  }

  readBlockStart(): Token {
    let ch = this.is.next();
    let tok: Token;
    this.state.inBlockTag = true;
    if (this.is.peek() === '／') {
      tok = { type: 'BLOCK_CLOSING_START', value: ch + this.is.next() };
    } else {
      tok = { type: 'BLOCK_START', value: ch };
    }
    this.state.brackets.push(tok);
    return tok;
  }

  readBlockEnd(): Token {
    let ch = this.is.next();
    this.state.inBlockTag = false;
    let tok: Token = { type: 'BLOCK_END', value: ch };
    const last = this.state.brackets[this.state.brackets.length - 1];
    if (
      last &&
      (last.type === 'BLOCK_START' || last.type === 'BLOCK_CLOSING_START')
    ) {
      this.state.brackets.pop();
      last.pairIndex = this.tokenIndex;
      tok.pairIndex = last.tokenIndex;
    } else {
      tok.error = true;
      tok.errorMsg = '対応する括弧がありません．';
    }
    return tok;
  }

  readColon(): Token {
    if (this.state.inInlinePre) {
      this.state.inInlinePre = false;
      this.state.inInlineBody = true;
    }
    return { type: 'COLON', value: this.is.next() };
  }

  readSep(): Token {
    if (this.state.inInlineBody) {
      return { type: 'INLINE_SEP', value: this.is.next() };
    } else {
      return { type: 'FURIGANA_SEP', value: this.is.next() };
    }
  }

  readLineBreak(): Token {
    const ch = this.is.next();
    if (
      this.state.inInlinePre ||
      this.state.inBlockTag ||
      this.state.inKaeriten ||
      this.state.inOkurigana
    ) {
      return {
        type: 'LB',
        value: ch,
        error: true,
        errorMsg: 'ここに改行を含めることはできません。'
      };
    } else {
      return { type: 'LB', value: ch, error: false };
    }
  }

  readNext(): Token {
    if (this.is.eof()) return null;
    let ch = this.is.peek();
    let startPos = this.is.pos;
    let tok: Token;
    if (ch === '《') tok = this.readInlineStart();
    if (ch === '》') tok = this.readInlineEnd();
    if (ch === '［') tok = this.readBlockStart();
    if (ch === '］') tok = this.readBlockEnd();
    if (ch === '｜') tok = this.readSep();
    if (this.isLetter(ch)) tok = this.readTextSegment();
    if (this.isBracket(ch)) tok = this.readBracket();
    if (this.isColon(ch)) tok = this.readColon();
    if (ch === '\n') tok = this.readLineBreak();
    if (!tok) {
      // handle unknown characters
      ch = this.is.next();
      tok = {
        type: 'UNKNOWN',
        value: ch,
        error: true,
        errorMsg: `不正な文字：${ch}`
      };
    }
    tok.start = startPos;
    tok.end = this.is.pos;
    tok.tokenIndex = this.tokenIndex++;
    return tok;
  }

  tokenize(): Array<Token> {
    const buf: Array<Token> = [];
    while (this.peek()) {
      buf.push(<Token>this.next());
    }
    // mark pair errors
    this.state.brackets.forEach(p => {
      p.error = true;
      p.errorMsg = '対応する括弧がありません．';
    });
    return buf;
  }
}
