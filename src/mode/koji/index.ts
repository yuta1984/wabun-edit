import KojiTokenizer from './tokenizer';
import { parse } from './parser';
import { Mode } from '..';
import listAction from './actions';
import { convertToHTML } from './converter';

const mode: Mode = {
  name: 'koji',
  parse: parse,
  tokenizer: KojiTokenizer,
  tokenClassMap: {
    INLINE_START: 'inline',
    INLINE_NAME: 'inline-name',
    INLINE_SEP: 'inline',
    COLON: 'inline',
    INLINE_END: 'inline',
    FURIGANA_START: 'furigana',
    FURIGANA_END: 'furigana',
    FURIGANA_SEP: 'furigana',
    KAERI_START: 'kaeri',
    KAERI_END: 'kaeri',
    FURIGANA: 'furigana',
    KAERITEN: 'kaeri',
    OKURIGANA: 'okuri',
    OKURIGANA_START: 'okuri',
    OKURIGANA_END: 'okuri',
    ANNOTATION: 'annotation',
    BLOCK_START: 'block',
    BLOCK_NAME: 'block-name',
    BLOCK_CLOSING_START: 'block',
    BLOCK_END: 'block',
    ANNO_START: 'annotation',
    ANNO_END: 'annotation',
    TEXT_SEGMENT: null,
    UNKNOWN: null
  },
  actions: listAction,
  converters: {
    html: convertToHTML
  }
};

export default mode;
