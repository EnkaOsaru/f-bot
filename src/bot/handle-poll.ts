import { Message } from 'discord.js';

import { Poll, PollOpen } from './grammar';

import { escape } from './utility';

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

async function runOpen(message: Message, open: PollOpen) {
    const title = open.title;

    if (!title) {
        throw `You need to specify the title first.`;
    }

    const options = [open.optionA, open.optionB, open.optionC, open.optionD]
        .filter(option => option)
        .map(option => option!);

    if (options.length < 2) {
        throw `You need at least 2 options to start a poll.`;
    }

    const username = message.member?.user?.username ?? 'someone';

    let response = `:bar_chart: **Poll started by ${escape(username)}: ${escape(title)}**\n`;

    for (let i = 0; i < options.length; i++) {
        const option = escape(options[i]);
        const emoji = NUMBER_EMOJIS[i];

        response += `  - ${emoji} **${option}**\n`;
    }

    response = response.trimRight();

    const pollMessage = await message.channel.send(response);

    for (let i = 0; i < options.length; i++) {
        await pollMessage.react(NUMBER_EMOJIS[i]);
    }
}

export async function run(message: Message, poll: Poll) {
    if (poll.open) {
        await runOpen(message, poll.open);
    }
}