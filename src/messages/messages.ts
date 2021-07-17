import { readFileSync } from 'fs';
import { join } from 'path';

export function getMessage(path: string, replacements: string[] = []) {
    path = join(process.cwd(), 'messages', path) + '.txt';

    let message: string;

    try {
        message = readFileSync(path).toString();
    } catch {
        return;
    }

    for (const replacement of replacements) {
        message = message.replace('{}', replacement);
    }

    return message;
}