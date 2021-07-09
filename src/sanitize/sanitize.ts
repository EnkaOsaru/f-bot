import emojiRegex from 'emoji-regex';
import { applyMaps, getMaps } from './map';

function evaluate(message: string) {
    const simplicity = Math.max(0, 1 - message.length / 8);

    // Prepare to evaluate
    message = message.replace(/\s+/g, '');
    message = message.toLowerCase();

    // Collect the charset
    const charset: string[] = [];

    for (const char of message) {
        if (!charset.includes(char)) {
            charset.push(char);
        }
    }

    // Measure the overall repetitiveness
    const repetitiveness = charset.length / message.length;

    return repetitiveness * (1 - simplicity) + simplicity;
}

export function sanitize(message: string) {
    message = message.trim();

    // Make line breaks readable
    message = message.replace(/\n/gs, '。');

    // Replace consecutive whitespace with a space
    message = message.replace(/\s+/g, ' ');

    // Remove emojis
    message = message.replace(emojiRegex(), '');

    // Remove custom emojis, mentions, and other discord stuff
    message = message.replace(/<.*?>/g, '');

    // Make URLs readable
    message = message.replace(/https?:\/\/\S+/g, ' URL ');

    // Apply the maps
    message = applyMaps(message, getMaps());

    message = message.trim();

    const score = evaluate(message);

    if (score < 0.5) {
        return '';
    }

    return message;
}