import { Message } from 'discord.js';

import { Poll, PollOpen } from './grammar';

import { escape } from './utility';
import { getMonospace, getNumberEmoji, getRegionalIndicator, replace } from '../utility';

const EMOJI_COUNT = 20;
const EMOJI_RANKS = [':first_place:', ':second_place:', ':third_place:'];
const POLL_PREFIX_RUNNING = ':green_circle: :ballot_box: **[Running]**';
const POLL_PREFIX_CLOSED = ':red_circle: :ballot_box: **[Closed]**';

function getOptionEmoji(index: number) {
    let emoji: string | null;

    if (index < 9) {
        emoji = getNumberEmoji(index + 1);
    } else {
        emoji = getRegionalIndicator(index - 9);
    }

    return emoji ?? '';
}

function getRunningPollContent(username: string, title: string, options: string[]) {
    const lines = new Array<string>(options.length + 2);

    // Write the header and the title
    lines[0] = `${POLL_PREFIX_RUNNING} **Poll started by ${escape(username)}.**`;
    lines[1] = `**${escape(title)}**`;

    for (let i = 0; i < options.length; i++) {
        const index = getMonospace((i + 1).toString(36).toUpperCase());
        const option = escape(options[i]);
        lines[i + 2] = `    ${index}. **${option}**`;
    }

    return lines.join('\n');
}

async function runOpen(message: Message, open: PollOpen) {
    const title = open?.title;
    const options = open?.options;

    if (!title || !options || options.length < 2) {
        throw `Not enough arguments. Usage: "!f poll open [title] [option1] [option2] ...".`;
    }

    if (options.length > EMOJI_COUNT) {
        throw `You can't specify more than ${EMOJI_COUNT} options.`;
    }

    const pollContent = getRunningPollContent(message.author.username, title, options);
    const pollMessage = await message.channel.send(pollContent);

    // Add reaction buttons
    for (let i = 0; i < options.length; i++) {
        await pollMessage.react(getOptionEmoji(i));
    }
}

function getVoteCountsAndSum(pollMessage: Message): [number[], number] {
    // Content line count - 2 is the number of options
    let optionCount = -1;

    for (const char of pollMessage.content) {
        if (char === '\n') {
            optionCount++;
        }
    }

    // Count the number of votes for each reaction
    let sum = 0;
    const counts = new Array<number>(optionCount);

    for (let i = 0; i < optionCount; i++) {
        const emoji = getOptionEmoji(i);
        const reaction = pollMessage.reactions.resolve(emoji);
        const count = (reaction?.count ?? 1) - 1;

        sum += count;
        counts[i] = count;
    }

    return [counts, sum];
}

function getVoteRankEmojis(voteCounts: number[]) {
    const counts = [...voteCounts];
    const emojis = new Array<string>(counts.length);

    for (let i = 0; i < emojis.length; i++) {
        const max = Math.max(0, ...counts);

        for (let j = 0; j < counts.length; j++) {
            if (counts[j] === max) {
                counts[j] = -1;
                emojis[j] = EMOJI_RANKS[i] ?? '';
            }
        }
    }

    return emojis;
}

function getClosedPollContent(pollMessage: Message) {
    const [counts, sum] = getVoteCountsAndSum(pollMessage);
    const emojis = getVoteRankEmojis(counts);

    const lines = pollMessage.content.split('\n');

    let header = lines[0];
    header = replace(header, POLL_PREFIX_RUNNING, POLL_PREFIX_CLOSED, 1);
    header = replace(header, 'Running', 'Closed', 1);
    lines[0] = header;

    let title = lines[1];
    title += ` (${sum} `;
    title += sum === 1 ? 'vote' : 'votes';
    title += ' in total)';
    lines[1] = title;

    if (sum > 0) {
        for (let i = 0; i < counts.length; i++) {
            const count = counts[i];
            const emoji = emojis[i];
            const percentage = Math.round(100 * count / sum);

            let line = lines[i + 2];
            line += ` ${emoji} (${count} `;
            line += count === 1 ? 'vote' : 'votes';
            line += `, ${percentage}%)`;
            lines[i + 2] = line;
        }
    }

    return lines.join('\n');
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

    if (pollMessage.content.startsWith(POLL_PREFIX_CLOSED)) {
        throw `This poll has already been closed.`;
    }

    if (!pollMessage.content.startsWith(POLL_PREFIX_RUNNING)) {
        throw `You need to reference a poll message.`;
    }

    // Edit the poll message and notify
    await pollMessage.edit(getClosedPollContent(pollMessage));
    await message.channel.send(':bar_chart: **Poll closed, check out the original message to see the result.**');
}

export async function run(message: Message, poll: Poll) {
    if (poll.open) {
        await runOpen(message, poll.open);
    }

    if (poll.close) {
        await runClose(message);
    }
}