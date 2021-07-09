import { readdirSync } from "fs";
import { join } from "path";

import { User } from "discord.js";

import { JSONStorage } from "../json-storage";

const VOICE_FALLBACK = 'man';

interface UserVoice {
    id: string;
    name: string;
    voice: string;
}

interface UserVoiceStorage {
    userVoices: UserVoice[];
}

const userVoiceStorage = new JSONStorage<UserVoiceStorage>('user-voice');

export function getVoices() {
    const directory = join(process.cwd(), 'htsvoices');
    const files = readdirSync(directory);

    return files.map(file => file.replace(/\..+$/, ''));
}

export function setUserVoice(user: User, voice: string) {
    if (!getVoices().includes(voice)) {
        return false;
    }

    userVoiceStorage.modify(data => {
        const { userVoices } = data;

        const userVoice = userVoices.find(e => e.id === user.id);

        if (userVoice) {
            userVoice.name = user.username;
            userVoice.voice = voice;
        } else {
            userVoices.push({ id: user.id, name: user.username, voice });
        }

        return data;
    });

    return true;
}

export function getUserVoice(user: string) {
    return userVoiceStorage.read().userVoices.find(e => e.id === user)?.voice ?? VOICE_FALLBACK;
}