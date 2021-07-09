import hash from 'object-hash';

import { JSONStorage } from '../json-storage';

interface MapStorage {
    maps: Map[];
}

interface Map {
    author: string;
    from: string;
    to: string;
    id: string;
}

const storage = new JSONStorage<MapStorage>('map');

export function addMap(from: string, to: string, author: string) {
    const id = hash([from, to]).substring(0, 8);
    const map = { author, from, to, id };

    storage.modify(data => (data.maps.push(map), data));
}

export function removeMap(id: string): Map | undefined {
    const data = storage.read();

    const { maps } = data;

    for (let i = 0; i < maps.length; i++) {
        const map = maps[i];

        if (map.id === id) {
            maps.splice(i, 1);

            storage.write(data);

            return map;
        }
    }
}

export function getMaps() {
    return storage.read().maps;
}

export function findMap(id: string) {
    return getMaps().find(map => map.id === id);
}

export function applyMap(text: string, map: Map) {
    const from = map.from.toLowerCase();
    const to = map.to;

    const buffer = new Array<string>();

    for (let i = 0, j = 0; i < text.length; i++) {
        const char = text[i];

        buffer.push(char);

        if (char.toLowerCase() === from[j]) {
            j++;

            if (j === from.length) {
                buffer.splice(buffer.length - from.length, from.length, to);

                j = 0;
            }
        } else {
            j = 0;
        }
    }

    return buffer.join('');
}

export function applyMaps(text: string, maps: Map[]) {
    for (const map of maps) {
        text = applyMap(text, map);
    }

    return text;
}