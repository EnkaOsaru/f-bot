export function replace(source: string, pattern: string, replacement: string, limit = Infinity) {
    for (let i = 0; i < limit; i++) {
        const result = source.replace(pattern, replacement);

        if (source === result) {
            break;
        }

        source = result;
    }

    return source;
}

export function getMonospace(string: string) {
    const chars = [...string];
    let result = '';

    for (const char of chars) {
        let charCode = char.codePointAt(0);

        if (!charCode) {
            break;
        }

        if (0x30 <= charCode && charCode <= 0x39) {
            // Monospace zero is at 0x1d7f6
            charCode = 0x1d7f6 + charCode - 0x30;
        } else if (0x41 <= charCode && charCode <= 0x5a) {
            // Monospace uppercase A is at 0x1d670
            charCode = 0x1d670 + charCode - 0x41;
        } else if (0x61 <= charCode && charCode <= 0x7a) {
            // Monospace lowercase a is at 0x1d68a
            charCode = 0x1d68a + charCode - 0x61;
        }

        result += String.fromCodePoint(charCode);
    }

    return result;
}

export function getPolyspace(string: string) {
    const chars = [...string];
    let result = '';

    for (const char of chars) {
        let charCode = char.codePointAt(0);

        if (!charCode) {
            break;
        }

        if (0x1d7f6 <= charCode && charCode <= 0x1d7ff) {
            // Monospace zero is at 0x1d7f6
            charCode = 0x30 + charCode - 0x1d7f6;
        } else if (0x1d670 <= charCode && charCode <= 0x1d689) {
            // Monospace uppercase A is at 0x1d670
            charCode = 0x41 + charCode - 0x1d670;
        } else if (0x1d68a <= charCode && charCode <= 0x1d6a3) {
            // Monospace lowercase a is at 0x1d68a
            charCode = 0x61 + charCode - 0x1d68a;
        }

        result += String.fromCodePoint(charCode);
    }

    return result;
}

export function getRegionalIndicator(index: number): string | null;
export function getRegionalIndicator(char: string): string | null;
export function getRegionalIndicator(indexOrChar: number | string) {
    let index: number;

    if (typeof indexOrChar === 'number') {
        index = indexOrChar;
    } else {
        index = indexOrChar.toUpperCase().charCodeAt(0) - 0x41;
    }

    if (index < 0 || 25 < index || !Number.isInteger(index)) {
        return null;
    }

    // Regional indicator A is at 0x1f1e6
    return String.fromCodePoint(0x1f1e6 + index);
}

export function getNumberEmoji(number: number) {
    if (number < 0 || 10 < number || !Number.isInteger(number)) {
        return null;
    }

    // 10 is the special case
    if (number === 10) {
        return String.fromCodePoint(0x1f51f);
    }

    return String.fromCodePoint(0x30 + number, 0xfe0f, 0x20e3);
}