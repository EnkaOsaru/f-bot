import { Message, MessageReaction } from 'discord.js';

import { Poll, PollOpen } from './grammar';

import { base64ToInteger, escape, integerToBase64 } from './utility';

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

async function runOpen(message: Message, open: PollOpen) {
    const title = open.title;

    if (!title) {
        throw `You need to specify the title first.`;
    }

    // Get options in order as an array
    const options = [open.optionA, open.optionB, open.optionC, open.optionD]
        .filter(option => option)
        .map(option => option!);

    if (options.length < 2) {
        throw `You need at least 2 options to start a poll.`;
    }

    const username = message.member?.user?.username ?? 'someone';

    let response = `:ballot_box: **Poll started by ${escape(username)}: ${escape(title)}**\n`;

    // List up the options
    for (let i = 0; i < options.length; i++) {
        const option = escape(options[i]);
        const emoji = NUMBER_EMOJIS[i];

        response += `    ${i + 1}. **${option}**\n`;
    }

    response = response.trimRight();

    // Send the response and add reaction buttons to it
    let pollMessage = await message.channel.send(response);

    for (let i = 0; i < options.length; i++) {
        await pollMessage.react(NUMBER_EMOJIS[i]);
    }
}

async function runClose(message: Message) {
    const reference = message.reference;

    if (!reference) {
        throw `You need to reference the poll message that you want to close.`;
    }

    const { messageID } = reference;

    if (!messageID) {
        throw `You need to reference a poll message.`;
    }

    let pollMessage: Message;

    try {
        pollMessage = await message.channel.messages.fetch(messageID);
    } catch {
        throw `Unexpected error ocurred.`;
    }

    if (pollMessage.author.id !== '850651864470519828') {
        throw `You need to reference a poll message from ƒBot.`;
    }

    if (!pollMessage.content.startsWith(':ballot_box:')) {
        throw `You need to reference a poll message.`;
    }

    const [, ...optionLines] = pollMessage.content.split('\n');
    const options = new Array<string>();

    for (const optionLine of optionLines) {
        const match = optionLine.match(/\d\. \*\*(.+)\*\*$/);

        if (match) {
            options.push(match[1]);
        }
    }

    const voteCounts = new Array<number>();

    for (let i = 0; i < options.length; i++) {
        const reaction = pollMessage.reactions.resolve(NUMBER_EMOJIS[i]);

        if (reaction?.count) {
            voteCounts.push(reaction.count - 1);
        }
    }

    message.channel.send(`:bar_chart: **The poll is closed. ${voteCounts.join(', ')}.**`);
}

export async function run(message: Message, poll: Poll) {
    if (poll.open) {
        await runOpen(message, poll.open);
    }

    if (poll.close) {
        await runClose(message);
    }
}