const ZERO_WIDTH_SPACE = '​';

export function escape(text: string) {
    // Escape Discord's special characters
    text = text.replace(/([\*\_\~\`\>\|\:\\\/])/g, '\\$1');
    text = text.replace(/@/g, `@${ZERO_WIDTH_SPACE}`);

    // Escape URLs
    text = text.replace(/http/g, `h${ZERO_WIDTH_SPACE}ttp`);

    return text;
}

const MONOSPACE_NUMBERS = [...'𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿'];
const MONOSPACE_CHARS_UPPER = [...'𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'];
const MONOSPACE_CHARS_LOWER = [...'𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'];

export function toMonospace(text: string) {
    const chars = new Array<string>();

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);

        if (0x30 <= code && code <= 0x39) {
            chars.push(MONOSPACE_NUMBERS[code - 0x30]);
        } else if (0x41 <= code && code <= 0x5a) {
            chars.push(MONOSPACE_CHARS_UPPER[code - 0x41]);
        } else if (0x61 <= code && code <= 0x7a) {
            chars.push(MONOSPACE_CHARS_LOWER[code - 0x61]);
        }
    }

    return chars.join('');
}

export function fromMonospace(text: string) {
    const chars = [...text];

    const codes = new Array<number>();

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        const number = MONOSPACE_NUMBERS.findIndex(e => e === char);

        if (number >= 0) {
            codes.push(number + 0x30);
            continue;
        }

        const upper = MONOSPACE_CHARS_UPPER.findIndex(e => e === char);

        if (upper >= 0) {
            codes.push(upper + 0x41);
            continue;
        }

        const lower = MONOSPACE_CHARS_LOWER.findIndex(e => e === char);

        if (lower >= 0) {
            codes.push(lower + 0x61);
            continue;
        }

        // Keep the character if it's not monospace
        codes.push(char.charCodeAt(0));
    }

    let result = '';

    for (const code of codes) {
        result += String.fromCharCode(code);
    }

    return result;
}