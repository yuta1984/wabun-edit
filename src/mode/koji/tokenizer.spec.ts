import KojiTokenizer from './tokenizer';

describe('tokenizer', () => {
  it('should parse text with inline element', () => {
    const src = `あああああ《人物：ほげ》あああ`;
    const tokenizer = new KojiTokenizer(src);
    expect(tokenizer.next().type).toBe('TEXT_SEGMENT');
    expect(tokenizer.next().type).toBe('INLINE_START');
    expect(tokenizer.next().type).toBe('INLINE_NAME');
    expect(tokenizer.next().type).toBe('COLON');
    expect(tokenizer.next().type).toBe('TEXT_SEGMENT');
    expect(tokenizer.next().type).toBe('INLINE_END');
    expect(tokenizer.next().type).toBe('TEXT_SEGMENT');
    expect(tokenizer.next()).toBe(null);
  });

  it('should parse block element', () => {
    const src = `［表紙］あああ［／表紙］`;
    const tokenizer = new KojiTokenizer(src);
    expect(tokenizer.next().type).toBe('BLOCK_START');
    expect(tokenizer.next().type).toBe('BLOCK_NAME');
    expect(tokenizer.next().type).toBe('BLOCK_END');
    expect(tokenizer.next().type).toBe('TEXT_SEGMENT');
    expect(tokenizer.next().type).toBe('BLOCK_CLOSING_START');
    expect(tokenizer.next().type).toBe('BLOCK_NAME');
    expect(tokenizer.next().type).toBe('BLOCK_END');
    expect(tokenizer.next()).toBe(null);
  });

  it('should output token array', () => {
    const src = '橋本（はしもと）［表紙］あああ［／表紙］【】';
    const tokenizer = new KojiTokenizer(src);
    const res = tokenizer.tokenize();
    res.forEach((r, i) => {
      // console.log(r, i)
      // xpect(r.value).toBe(values[i])
    });
  });

  it('should creare token with index', () => {
    const src = `橋本（はしもと）`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].tokenIndex).toBe(0);
    expect(tokens[1].tokenIndex).toBe(1);
    expect(tokens[2].tokenIndex).toBe(2);
  });

  it('should tokenize furigana', () => {
    const src = `橋本（はしもと）`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].type).toBe('TEXT_SEGMENT');
    expect(tokens[0].error).toBeUndefined();
    expect(tokens[1].type).toBe('FURIGANA_START');
    expect(tokens[2].type).toBe('FURIGANA');
    expect(tokens[3].type).toBe('FURIGANA_END');
    expect(tokens[3].error).toBeUndefined();
  });

  it('should recognize kaeriten and okurigana', () => {
    const src = `天下〔ニ〕有〔ラバ〕一人〔ノ〕知己｛一｝`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].type).toBe('OKURIGANA_START');
    expect(tokens[2].type).toBe('OKURIGANA');
    expect(tokens[3].type).toBe('OKURIGANA_END');
  });

  it('should recognize inline tag pair', () => {
    const src = `《人名：橋本》`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].pairIndex).toBe(4);
    expect(tokens[4].pairIndex).toBe(0);
  });

  it('should reject line break inside elem name', () => {
    const src = `《人\n名：橋本》`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[2].error).toBe(true);
  });

  it('should recognize inline sepalator', () => {
    const src = `《ふりがな：橋本｜ゆうた》`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[4].type).toBe('INLINE_SEP');
  });

  it('should recognize furigana sepalator', () => {
    const src = `十月二日｜人定（にんてい）`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].type).toBe('FURIGANA_SEP');
  });

  it('should recognize block tag pair', () => {
    const src = '［表紙］\n';
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].pairIndex).toBe(2);
    expect(tokens[2].pairIndex).toBe(0);
  });

  it('should mark an unmatched pair', () => {
    const src = `橋本（はしもと`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].type).toBe('TEXT_SEGMENT');
    expect(tokens[1].type).toBe('FURIGANA_START');
    expect(tokens[1].error).toBe(true);
  });

  it('should mark an unmatched pair', () => {
    const src = `橋本はしもと）`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[0].type).toBe('TEXT_SEGMENT');
    expect(tokens[1].type).toBe('FURIGANA_END');
    expect(tokens[1].error).toBe(true);
  });

  it('should mark an unmatched pair', () => {
    const src = '表紙］';
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].error).toBeTruthy();
  });

  it('sould create an error message for an unmatched pair', () => {
    const src = '表紙］';
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].error).toBeTruthy();
    expect(tokens[1].errorMsg).toBe('対応する括弧がありません．');
  });

  it('should mark an unmatched pair', () => {
    const src = `橋本（はし【もと）】`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].error).toBeTruthy();
    expect(tokens[3].error).toBeTruthy();
    expect(tokens[5].error).toBeTruthy();
    expect(tokens[6].error).toBeTruthy();
  });

  it('should mark illegal use of character', () => {
    const src = `橋本／雄太`;
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].type).toBe('UNKNOWN');
    expect(tokens[1].error).toBeTruthy();
  });

  it('should recognize line break', () => {
    const src = '橋本\n雄太';
    const tokenizer = new KojiTokenizer(src);
    const tokens = tokenizer.tokenize();
    expect(tokens[1].type).toBe('LB');
    expect(tokens[1].value).toBe('\n');
  });
});
