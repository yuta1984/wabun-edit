import { ActionGroup } from '..';
import Wabun from '../../components/WabunEdit';

function insertSimpleInline(editor: Wabun) {
  const doc = editor.doc;
  const selected = doc.src.slice(doc.selStart, doc.selEnd);
  const markup = `《${name}：${selected}》`;
  editor.textArea.focus();
  document.execCommand('delete');
  document.execCommand('insertText', false, markup);
}

function insertInline(name: string, extra?: string): (editor: Wabun) => void {
  return function(editor: Wabun) {
    const doc = editor.doc;
    const selected = doc.src.slice(doc.selStart, doc.selEnd);
    const markup = `《${name}：${selected} ${extra || ''}》`;
    editor.textArea.focus();
    document.execCommand('delete');
    document.execCommand('insertText', false, markup);
  };
}

const semanticMarkup = '史料 人物 場所 地理 建物 日時 事項 数量'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertInline(name)
    };
  });

const contentMarkup = '差出人 受取人 題 外題 内題 手沢者 序年 跋年'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertInline(name)
    };
  });

const layoutMarkup = '迎え仮名 送り仮名 闕字 小書き 囲い書き'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertInline(name)
    };
  });
layoutMarkup.push({
  name: '見せ消ち',
  action: insertInline('見せ消ち', '｜ここに記号')
});
layoutMarkup.push({
  name: '訂正',
  action: insertInline('訂正', '｜ここに訂正文')
});
layoutMarkup.push({
  name: '傍注',
  action: insertInline('傍注', '｜ここに傍注')
});
layoutMarkup.push({
  name: '勘返',
  action: insertInline('勘返', '｜ここに勘返')
});

const symbolMarkup = '音合符 訓合符 合点 墨格 朱引左単 朱引右単 朱引中単 朱引左複 朱引右複 朱引中複 朱引箱'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertInline(name)
    };
  });
symbolMarkup.push({
  name: '傍点',
  action: insertInline('傍点', '｜・')
});

const graphicMarkup = '花押 印 蔵書印'.split(' ').map(name => {
  return {
    name: name,
    action: insertInline(name)
  };
});

function insertBlock(name: string): (editor: Wabun) => void {
  return function(editor: Wabun) {
    const doc = editor.doc;
    const selected = doc.src.slice(doc.selStart, doc.selEnd);
    const markup = `\n［${name}］\n${selected}\n［／${name}］`;
    editor.textArea.focus();
    document.execCommand('delete');
    document.execCommand('insertText', false, markup);
  };
}

const structureMarkup = '表紙 裏表紙 序文 跋文 章段 奥書 識語 刊記 奥付 裏書き 貼紙 紙背 封面 蔵書票'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertBlock(name)
    };
  });

const poemMarkup = '和歌 俳句 漢文 漢詩'.split(' ').map(name => {
  return {
    name: name,
    action: insertBlock(name)
  };
});

const layoutBlockMarkup = '字下げ一 字下げ二 字下げ三 字下げ四 字下げ五'
  .split(' ')
  .map(name => {
    return {
      name: name,
      action: insertBlock(name)
    };
  });

const graphicBlockMarkup = '表 系図 地図 絵'.split(' ').map(name => {
  return {
    name: name,
    action: insertBlock(name)
  };
});

const markupActions: ActionGroup = {
  name: 'マークアップ',
  children: [
    {
      name: 'ブロック',
      children: [
        { name: '文書構造', children: structureMarkup },
        { name: '位置情報', children: layoutBlockMarkup },
        { name: '詩歌・漢文', children: poemMarkup },
        { name: '図表', children: graphicBlockMarkup }
      ]
    },
    {
      name: 'インライン',
      children: [
        { name: '事物', children: semanticMarkup },
        { name: '内容情報', children: contentMarkup },
        { name: '位置情報', children: layoutMarkup },
        { name: '記号', children: symbolMarkup },
        { name: '図表・印', children: graphicMarkup }
      ]
    }
  ]
};

const elementActions: ActionGroup = {
  name: '要素',
  children: [
    { name: 'マークアップを解除', action: editor => {} },
    { name: 'IDを付与', action: editor => {} }
  ]
};

function actions(editor: Wabun): ActionGroup {
  if (editor.doc.errors.length > 0) return;
  let tok = editor.doc.getCurrentToken();
  if (editor.doc.hasSelection()) {
    return markupActions;
  } /* else if (tok && tok.type === 'INLINE_NAME') {
    const name = tok.value;
    elementActions.name = 'タグ: ' + name;
    return elementActions; */
}

export default actions;
