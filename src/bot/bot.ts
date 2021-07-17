import { Client, Intents, Message } from 'discord.js';

import { getToken } from './token';

import { Command, parse } from './grammar';

import { escape } from './utility';

import * as handleTalk from './handle-talk';
import * as handlePoll from './handle-poll';
import * as handleHelp from './handle-help';

async function runCommand(message: Message, command: Command) {
    if (message.content.length > 1000) {
        throw `The command is too long. It can only have 1000 characters or fewer.`;
    }

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

    const root = parse(message.content);

    if (!root.help && !root.command) {
        if (message.guild.id !== '632536123838824449') {
            return;
        }

        // Speak the message if it's not a command
        handleTalk.say(message);

        return;
    }

    try {
        if (root.command) {
            // Run the command
            await runCommand(message, root.command);
        } else if (root.help) {
            // Send a help message
            await handleHelp.run(message, root.help);
        }
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