import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function getDataPath(path: string) {
    return join(process.cwd(), 'json-storage', `${path}.json`);
}

export class JSONStorage<T> {
    private readonly path: string;

    constructor(path: string) {
        this.path = getDataPath(path);

        if (!this.exists()) {
            writeFileSync(this.path, '{}');
        }
    }

    exists(): boolean {
        return existsSync(this.path);
    }

    read(): T {
        return JSON.parse(readFileSync(this.path).toString());
    }

    write(data: T) {
        writeFileSync(this.path, JSON.stringify(data, null, 4));
    }

    modify(modifier: (data: T) => T) {
        this.write(modifier(this.read()));
    }
}