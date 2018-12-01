import KojiMode from './koji/';
import Tokenizer from './Tokenizer';
import Wabun from '../components/WabunEdit';

export interface Action {
  name: string;
  action: (editor: Wabun) => void;
}

export interface ActionGroup {
  name: string;
  children: Array<Action | ActionGroup>;
}

export interface Mode {
  name: string;
  tokenizer: new (src: string) => Tokenizer;
  tokenClassMap: {
    [tokenType: string]: string;
  };
  parse?: any;
  actions?: (editor: Wabun) => ActionGroup;
  converters?: any;
}

interface ModeList {
  [name: string]: Mode;
}

const modeList: ModeList = {
  koji: KojiMode
};

export default modeList;
