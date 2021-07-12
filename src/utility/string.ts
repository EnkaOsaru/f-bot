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