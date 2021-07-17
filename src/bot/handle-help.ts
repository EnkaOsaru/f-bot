import { join } from 'path';

import { Message } from 'discord.js';

import { Command } from './grammar';

import { getMessage } from '../messages';

const MESSAGE_PREFIX = ':information_source: **ƒBot help message**';

function getKeys(object: any, array: string[] = []) {
    if (typeof object !== 'object') {
        return array;
    }

    for (const key in object) {
        array.push(key);
        getKeys(object[key], array);
    }

    return array;
}

function findMessage(command: Command) {
    const keys = getKeys(command);
    let message: string | undefined;

    while (true) {
        message = getMessage(join(...keys, 'help'));

        if (message) {
            break;
        }

        keys.pop();

        if (keys.length === 0) {
            return;
        }
    }

    const lines = message.split('\n');

    for (let i = 0; i < lines.length; i++) {
        lines[i] = '    ' + lines[i];
    }

    lines.unshift(MESSAGE_PREFIX);

    return lines.join('\n');
}

export async function run(message: Message, command: Command) {
    const content = findMessage(command);

    if (!content) {
        throw `No help message was found.`;
    }

    await message.channel.send(content);
}