interface Node {
  type: string;
  typeJP: string;
  content?: Array<Node>;
  kana?: Array<Node>;
  mark?: Array<Node>;
  left?: Array<Node>;
  right?: Array<Node>;
  correction?: Array<Node>;
  position?: string;
  style?: string;
  size?: number;
}

interface TextNode extends Node {
  type: 'text';
  value: string;
}

export function convertToHTML(ast: any) {
  return convert(ast);
}

const semantic = 'document person location geography building datetime seg measure sender recipient'.split(
  ' '
);
const character = 'sanskrit ketsuji sidenote kanhen'.split(' ');
const kanbun = 'okoto okurigana on-gofu kun-gohu shubiki small sideline box written-seal seal gaiji'.split(
  ' '
);
const block =
  'front back introduction afterword section headnote colophon reverse-side shikigo kanki bookplate sticker fumen endorsement reverse-side table map graphic family-tree waka haiku chinese-writing chinese-poem';

function processSimpleInline(node: Node): string {
  let children = node.content.map(convert).join('');
  return `<span class="${
    node.type
  } inline" data-tippy-arrow="true" data-tippy-placement="right" data-tippy-content="${
    node.typeJP
  }">${children}</span>`;
}

function processBlock(node: Node): string {
  let children = node.content.map(convert).join('');
  return `<div class="${node.type} block">${children}</div>`;
}

function isTextNode(node: Node): node is TextNode {
  return node.type === 'text';
}

function convert(node: Node) {
  if (node.type === 'root') {
    let children: string = node.content.map(convert).join('');
    return `<div class="koji root">${children}</div>`;
  } else if (semantic.indexOf(node.type) > -1) {
    return processSimpleInline(node);
  } else if (character.indexOf(node.type) > -1) {
    return processSimpleInline(node);
  } else if (kanbun.indexOf(node.type) > -1) {
    return processSimpleInline(node);
  } else if (isTextNode(node)) {
    return node.value;
  } else if (node.type === 'comment') {
    return processSimpleInline(node);
  } else if (node.type === 'line-break') {
    return '<br/>';
  } else if (node.type === 'title') {
    let children: string = node.content.map(convert).join('');
    return `<h2 class="${node.type}">${children}</h2>`;
  } else if (node.type === 'furigana') {
    let children: string = node.content.map(convert).join('');
    let kana: string = node.kana.map(convert).join('');
    return `<ruby class="${node.type}">${children}<rt>${kana}</rt></ruby>`;
  } else if (node.type === 'mukaegana') {
    let children: string = node.content.map(convert).join('');
    let kana: string = node.kana.map(convert).join('');
    return `<ruby class="${node.type}">${children}<rt>${kana}</rt></ruby>`;
  } else if (node.type === 'kaeriten') {
    let mark = node.mark; // fix this
    return `<span class="${node.type} inline" >${mark}</span>`;
  } else if (node.type === 'misekechi') {
    let children: string = node.content.map(convert).join('');
    let mark: string = node.mark.map(convert).join('');
    let correction: string = node.correction.map(convert).join('');
    return `<span class="${node.type}">
                <ruby>${children}
                    <rt>${correction}</rt>
                    <rtc>${mark}</rtc>
                </ruby>
            </span>`;
  } else if (node.type === 'correction') {
    let children: string = node.content.map(convert).join('');
    let correction: string = node.correction.map(convert).join('');
    return `<ruby class="${
      node.type
    }">${children}<rt>${correction}</rt></ruby>`;
  } else if (node.type === 'warigaki') {
    let left: string = node.left.map(convert).join('');
    let right: string = node.right.map(convert).join('');
    return `<span class="${node.type}">
                <span class="warigaki-left">${left}</span>
                <span class="warigaki-right">${right}</span>                
            </span>`;
  } else if (node.type === 'tsunogaki') {
    let left: string = node.left.map(convert).join('');
    let right: string = node.right.map(convert).join('');
    return `<span class="${node.type}">
                <span class="right">${right}</span>
                <span class="left">${left}</span>
            </span>`;
  } else if (node.type === 'okoto') {
    return processSimpleInline(node);
  } else if (node.type === 'shubiki') {
    let children: string = node.content.map(convert).join('');
    return `<span class="${node.type} ${node.position} ${
      node.style
    }">${children}</span>`;
  } else if (node.type === 'gatten') {
    let mark: string = node.mark.map(convert).join('');
    return `<span class="${node.type}">${mark}</span>`;
  } else if (node.type === 'emphasis') {
    let children: string = node.content.map(convert).join('');
    let mark: string = node.mark.map(convert).join('');
    return `<span class="${
      node.type
    }" style="text-emphasis-style:'${mark}'">${children}</span>`;
  } else if (block.indexOf(node.type) > -1) {
    return processBlock(node);
  } else if (node.type === 'indent') {
    let children: string = node.content.map(convert).join('');
    let size = node.size;
    return `<div class="${
      node.type
    }" style="margin-top: ${size}em">${children}</div>`;
  } else {
    throw Error('unknown type: ' + JSON.stringify(node));
  }
}
