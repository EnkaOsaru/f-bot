type TokenParseData = { object: any, success: boolean };

interface TokenStoreData {
    tree: object;
    word: string;
}

type TokenChainFunction = (words: string[], result: any) => void;
type TokenStoreFunction = (result: any, data: TokenStoreData) => void;

class Token {
    readonly name: string;
    private readonly pattern: RegExp;
    private children: Token[] = [];

    private chain: TokenChainFunction = this.chainBranch;
    private store: TokenStoreFunction = this.storeTree;

    constructor(name: string, pattern?: RegExp) {
        this.name = name;
        this.pattern = pattern ?? new RegExp(`^${name}$`);
    }

    thenBranch(...children: Token[]) {
        this.children = children;
        this.chain = this.chainBranch;
        return this;
    }

    thenList(...children: Token[]) {
        this.children = children;
        this.chain = this.chainList;
        return this;
    }

    thenSet(...children: Token[]) {
        this.children = children;
        this.chain = this.chainSet;
        return this;
    }

    thenSingle(child: Token) {
        this.children = [child];
        this.chain = this.chainSingle;
        return this;
    }

    asTree() {
        this.store = this.storeTree;
        return this;
    }

    asValue() {
        this.store = this.storeValue;
        return this;
    }

    asVarArg() {
        this.store = this.storeVarArg;
        return this;
    }

    parse<T = any>(text: string): T {
        return this._parse(split(text)).object;
    }

    private chainBranch(words: string[], result: any) {
        for (const child of this.children) {
            const data = child._parse(words, result);

            if (data.success) {
                return;
            }
        }
    }

    private chainList(words: string[], result: any) {
        for (const child of this.children) {
            if (child.store === child.storeVarArg) {
                while (child._parse(words, result).success);
            } else {
                child._parse(words, result);
            }
        }
    }

    private chainSet(words: string[], result: any) {
        let isParseSuccess = true;

        while (isParseSuccess) {
            isParseSuccess = false;

            for (const child of this.children) {
                const data = child._parse(words, result);

                if (data.success) {
                    isParseSuccess = true;
                }
            }
        }
    }

    private chainSingle(words: string[], result: any) {
        this.children[0]._parse(words, result);
    }

    private storeTree(result: any, data: TokenStoreData) {
        // Store the tree structure with the given name
        result[this.name] = data.tree;
    }

    private storeValue(result: any, data: TokenStoreData) {
        // Store the matched word with the given name
        result[this.name] = data.word;
    }

    private storeVarArg(result: any, data: TokenStoreData) {
        // Store as many words as there are
        const words: string[] | undefined = result[this.name];

        if (!words) {
            result[this.name] = [data.word];
        } else {
            words.push(data.word);
        }
    }

    private _parse(words: string[], result: any = {}): TokenParseData {
        if (words.length === 0) {
            return { object: result, success: false };
        }

        const head = words[0];

        // If this token can parse the word
        if (this.pattern.test(head)) {
            const chainResult = {};

            // Consume a word
            words.shift();

            // Recursively parse and get the result
            this.chain(words, chainResult);

            // Store the data
            this.store(result, {
                tree: chainResult,
                word: head
            });

            // Return as a success
            return { object: result, success: true };
        }

        // This token can't parse the word
        return { object: result, success: false };
    }
}

function split(text: string) {
    text = text.replace(/\s+/g, ' ');
    text = text.trim();

    const result: string[] = [''];

    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (escape) {
            result[result.length - 1] += char;

            escape = false;
        } else {
            if (char === '\\') {
                escape = true;
            } else if (char === ' ') {
                result.push('');
            } else {
                result[result.length - 1] += char;
            }
        }
    }

    if (result[result.length - 1] === '') {
        result.pop();
    }

    return result;
}

export function token(name: string, pattern?: RegExp) {
    return new Token(name, pattern);
}

export function tokenInteger(name: string) {
    return token(name, /^-?\d+$/).asValue();
}

export function tokenString(name: string) {
    return token(name, /^.+$/).asValue();
}
