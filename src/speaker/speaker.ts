import { execSync } from 'child_process';
import { rmSync, writeFileSync } from 'fs';
import { join } from 'path';

import { VoiceConnection } from 'discord.js';

const PATH_DIC = join(process.cwd(), 'open_jtalk_dic');

const PATH_ERROR = join(process.cwd(), 'audios', 'error.mp3');
const PATH_JOIN = join(process.cwd(), 'audios', 'join.mp3');
const PATH_LEAVE = join(process.cwd(), 'audios', 'leave.mp3');
const PATH_SILENCE = join(process.cwd(), 'audios', 'silence.mp3');

function createTmpPath() {
    let name = 'f-bot.';

    for (let i = 0; i < 128; i++) {
        name += String.fromCharCode(97 + 26 * Math.random() | 0);
    }

    return join('/tmp', name);
}

function createTextFile(text: string) {
    const path = createTmpPath();

    writeFileSync(path, text);

    return path;
}

function getVoicePath(voiceName: string) {
    return join(process.cwd(), 'htsvoices', `${voiceName}.htsvoice`);
}

function createAudioFile(textFilePath: string, voiceName: string) {
    const voicePath = getVoicePath(voiceName);
    const audioFilePath = createTmpPath();

    try {
        execSync(`open_jtalk -x ${PATH_DIC} -m ${voicePath} -ow ${audioFilePath} ${textFilePath}`);
    } catch { }

    return audioFilePath;
}

interface Speech {
    textFilePath: string;
    audioFilePath: string;

    close(): void;
}

class UserSpeech implements Speech {
    textFilePath: string;
    audioFilePath: string;

    constructor(text: string, voiceName: string) {
        this.textFilePath = createTextFile(text);
        this.audioFilePath = createAudioFile(this.textFilePath, voiceName);
    }

    close() {
        rmSync(this.textFilePath);
        rmSync(this.audioFilePath);
    }
}

class TemplateSpeech implements Speech {
    textFilePath = '';
    audioFilePath: string;

    onFinish: () => void;

    constructor(audioFilePath: string, onFinish: () => void) {
        this.audioFilePath = audioFilePath;
        this.onFinish = onFinish;
    }

    close() {
        this.onFinish();
    }
}

export class Speaker {
    private readonly speeches: Speech[] = [];

    private readonly voiceConnection: VoiceConnection;
    private resolveCurrentAudio?: () => void;

    isSpeaking = false;

    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
    }

    say(text: string, voiceName: string) {
        this.speak(new UserSpeech(text, voiceName));
    }

    skip() {
        this.resolveCurrentAudio?.();
    }

    reset() {
        for (const speech of this.speeches) {
            speech.close();
        }

        this.speeches.splice(0, this.speeches.length);

        this.resolveCurrentAudio?.();
    }

    async notifyError() {
        await this.notify(PATH_ERROR);
    }

    async notifyJoin() {
        await this.notify(PATH_JOIN)
    }

    async notifyLeave() {
        await this.notify(PATH_LEAVE);
    }

    get channelName() {
        return this.voiceConnection.channel.name;
    }

    private async speak(speech: Speech) {
        this.speeches.push(speech);

        if (!this.isSpeaking) {
            this.play();
        }
    }

    private async notify(audioFilePath: string) {
        await new Promise<void>(resolve => {
            this.speak(new TemplateSpeech(audioFilePath, resolve));
        });
    }

    private async play() {
        if (this.speeches.length === 0) {
            return;
        }

        this.isSpeaking = true;

        const speech = this.speeches.shift()!;

        const dispatcher = this.voiceConnection.play(speech.audioFilePath);

        await new Promise<void>(resolve => {
            this.resolveCurrentAudio = async () => {
                // Interrupt the current playback
                this.voiceConnection.play(PATH_SILENCE);

                // Manually resolve because the dispatcher doesn't handle interruption
                resolve();
            };

            // Just in case
            setTimeout(resolve, 30 * 1000);

            // Resolve when the playback ends
            dispatcher.on('speaking', speaking => {
                if (!speaking) {
                    resolve();
                }
            });
        });

        // No interruption can take place because the playback ended properly
        this.resolveCurrentAudio = undefined;

        speech.close();

        this.isSpeaking = false;

        this.play();
    }
}