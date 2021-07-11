import { Client, Intents, Message } from 'discord.js';

import { getToken } from './token';

import { Command, parse } from './grammar';

import { escape } from './utility';

import * as handleTalk from './handle-talk';
import * as handlePoll from './handle-poll';

async function runCommand(message: Message, command: Command) {
    if (command.talk) {
        await handleTalk.run(message, command.talk);
    }

    if (command.poll) {
        await handlePoll.run(message, command.poll);
    }
}

async function onMessage(message: Message) {
    if (!message.guild || message.author.bot || !message.content || message.channel.type !== 'text') {
        return;
    }

    if (message.guild.id === '632536123838824449') {
        if (message.channel.id !== '636809317969952768') {
            return;
        }
    }

    const command = parse(message.content);

    if (!command) {
        // Speak the message if it's not a command
        handleTalk.say(message);

        return;
    }

    // Run the command and report the error as a message if necessary
    try {
        await runCommand(message, command);
    } catch (error) {
        if (typeof error === 'string') {
            message.channel.send(`:warning: **${escape(error)}**`);
        } else {
            console.error(error);
        }
    }
}

export async function login() {
    const intents = new Intents([
        Intents.NON_PRIVILEGED,
        "GUILD_MEMBERS",
    ]);

    const client = new Client({ ws: { intents } });

    client.on('message', onMessage);
    client.on('voiceStateUpdate', handleTalk.onVoiceStateUpdate);

    client.login(getToken());
}