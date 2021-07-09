import { readFileSync } from 'fs';

import { join } from 'path';

export function getToken() {
    const path = join(process.cwd(), 'private', 'token');

    const buffer = readFileSync(path);

    return buffer.toString();
}