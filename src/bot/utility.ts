const ZERO_WIDTH_SPACE = '​';

export function escape(text: string) {
    // Escape Discord's special characters
    text = text.replace(/([\*\_\~\`\>\|\:\\\/])/g, '\\$1');
    text = text.replace(/@/g, `@${ZERO_WIDTH_SPACE}`);

    // Escape URLs
    text = text.replace(/http/g, `h${ZERO_WIDTH_SPACE}ttp`);

    return text;
}