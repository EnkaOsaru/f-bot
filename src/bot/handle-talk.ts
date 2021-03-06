import { Collection, Message, Snowflake, User, VoiceState } from 'discord.js';

import { Speaker } from '../speaker';

import { JSONStorage } from '../json-storage';

import { Talk, TalkMap, TalkSkip, TalkVoice } from './grammar';

import { getVoices, getUserVoice, setUserVoice } from '../voice';

import { sanitize, addMap, removeMap, getMaps, findMap } from '../sanitize';

import { escape } from './utility';
import { getMonospace, getPolyspace } from '../utility';

let speaker: Speaker | undefined;

async function leaveVoiceChannel(message?: Message) {
    speaker?.reset();

    if (message) {
        await message.channel.send(`:wave: **Goodbye!**`);
        await speaker?.notifyLeave();
    }

    speaker?.voiceConnection.channel.leave();

    speaker = undefined;
}

async function runJoin(message: Message) {
    if (speaker) {
        throw `I'm already in ${speaker.channelName}.`;
    }

    const voiceChannel = message.member?.voice.channel;

    if (!voiceChannel) {
        throw `You have to be in a voice channel first.`;
    }

    const connection = await voiceChannel.join();

    speaker = new Speaker(connection);

    speaker.notifyJoin();

    await message.channel.send(`:hand_splayed: **Hello!**`);
}

async function runLeave(message: Message) {
    if (!speaker) {
        throw `I'm not in a voice channel.`;
    }

    const voiceChannel = message.member?.voice.channel;

    if (!voiceChannel) {
        throw `You have to be in a voice channel.`;
    }

    leaveVoiceChannel(message);
}

function runSkip(message: Message, skip: TalkSkip) {
    if (!speaker) {
        throw `I'm not in a voice channel.`
    }

    if (!speaker.isSpeaking) {
        throw `There's nothing to skip right now.`
    }

    if (skip.all) {
        speaker.reset();
        message.channel.send(`:track_next: **Skipping all the speeches.**`);
    } else {
        speaker.skip();
        message.channel.send(`:track_next: **Skipping the current speech.**`);
    }
}

function runVoice(message: Message, voice: TalkVoice) {
    // List up all the voices available
    if (voice.list) {
        let response = ':microphone2: **You can use these voices: ';

        const voices = getVoices();

        for (let i = 0; i < voices.length; i++) {
            response += voices[i];

            if (i === voices.length - 1) {
                response += '.';
            } else if (i === voices.length - 2) {
                response += ', and ';
            } else {
                response += ', ';
            }
        }

        response += '**';

        message.channel.send(response);
    }

    if (voice.set) {
        const voiceName = voice.set.value;

        if (!voiceName) {
            throw `You must specify what voice to set.`;
        }

        if (!setUserVoice(message.author, voiceName)) {
            throw `Unknown voice: "${voiceName}". You can see available options with "!f talk voice list".`;
        }

        message.channel.send(`:microphone2: **Your voice is set to "${voiceName}".**`);
    }
}

async function runMap(message: Message, map: TalkMap) {
    if (map.add) {
        const { from, to } = map.add;

        if (!from || !to) {
            throw `Not enough arguments. Usage: "!f talk map add [from_word] [to_word]".`;
        }

        addMap(from, to, message.author.id);

        message.channel.send(`:pencil: **Added a new map: "${from}" maps to "${to}".**`);
    }

    if (map.remove) {
        const remove = map.remove;

        if (!remove.value) {
            throw `You must specify the id of the map you want to remove. Use "!f talk map list" to see the list of the ids.`;
        }

        const id = getPolyspace(remove.value);
        const mapToRemove = findMap(id);

        if (!mapToRemove) {
            throw `There's no map with the id "${id}". Try "!f talk map list".`;
        }

        removeMap(id);

        const { from, to, author } = mapToRemove;

        if (message.author.id !== '685106322395365378' && message.author.id !== author) {
            throw `You can remove only the maps you added.`;
        }

        message.channel.send(`:wastebasket: **The map from "${from}" to "${to}" is removed.**`);
    }

    if (map.list) {
        const members = await message.guild!.members.fetch();
        const collection = new Collection<string, string[]>();

        for (const map of getMaps()) {
            const lines = collection.get(map.author);
            const line = `    ${getMonospace(map.id)}  ${map.from} → ${map.to}`;

            if (lines) {
                lines.push(line);
            } if (!lines) {
                const username = members.get(map.author)?.user?.username ?? '';
                collection.set(map.author, [username, line]);
            }
        }

        collection.sort((_v1, _v2, k1, k2) => parseInt(k1, 16) - parseInt(k2, 16));

        let response = '';

        for (const [, lines] of collection) {
            for (const line of lines) {
                response += line + '\n';
            }
        }

        message.channel.send(`**${escape(response.trim())}**`)
    }
}

export async function run(message: Message, talk: Talk) {
    if (talk.join) {
        await runJoin(message);
    }

    if (talk.leave) {
        await runLeave(message);
    }

    if (talk.skip) {
        runSkip(message, talk.skip);
    }

    if (talk.voice) {
        runVoice(message, talk.voice);
    }

    if (talk.map) {
        await runMap(message, talk.map);
    }
}

export function say(message: Message) {
    if (!speaker) {
        return;
    }

    const content = sanitize(message.content);

    if (content.length === 0) {
        return;
    }

    speaker.say(content, getUserVoice(message.author.id));
}

interface Username {
    id: Snowflake;
    name: string;
}

interface UsernameStorage {
    usernames: Username[];
}

const usernameStorage = new JSONStorage<UsernameStorage>('username');

function getUsername(user: User) {
    const { usernames } = usernameStorage.read();

    for (const { id, name } of usernames) {
        if (user.id === id) {
            return name;
        }
    }

    return sanitize(user.username);
}

function notifyUserPresence(newState: VoiceState) {
    const user = newState.member?.user;

    if (!user) {
        return;
    }

    const username = getUsername(user);

    if (newState.channel) {
        // If someone joined
        speaker?.say(`${username}が入室しました`, 'man');
    } else {
        // If someone left
        speaker?.say(`${username}が退室しました`, 'man');
    }
}

export function onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    if (!speaker) {
        return;
    }

    const currentChannel = speaker.voiceConnection.channel;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // If someone joined
    if (oldChannel?.id !== currentChannel.id && newChannel?.id === currentChannel.id) {
        notifyUserPresence(newState);
        return;
    }

    // If someone left
    if (oldChannel?.id === currentChannel.id && newChannel?.id !== currentChannel.id) {
        // Leave the voice chat after everyone left
        if (oldChannel.members.size === 1) {
            leaveVoiceChannel();
            return;
        }

        notifyUserPresence(newState);
    }
}