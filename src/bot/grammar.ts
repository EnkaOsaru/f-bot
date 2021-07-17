import { token, tokenInteger, tokenString } from '../parse';

export interface Value {
    value: string;
}

export interface TalkSkip {
    all?: {};
}

export interface TalkVoice {
    list?: {};
    set?: Value;
}

export interface TalkMapAdd {
    from?: string;
    to?: string;
}

export interface TalkMap {
    list?: {};
    add?: TalkMapAdd;
    remove?: Value;
}

export interface Talk {
    join?: {};
    leave?: {};
    skip?: TalkSkip;
    voice?: TalkVoice;
    map?: TalkMap;
}

export interface PollOpen {
    title?: string;
    options?: string[];
}

export interface Poll {
    open?: PollOpen;
    close?: {};
}

export interface Command {
    talk?: Talk;
    poll?: Poll;
}

export interface Root {
    command?: Command;
    help?: Command;
}

const commandTokens = [
    token('talk').thenBranch(
        token('join'),
        token('leave'),
        token('skip').thenSingle(token('all')),
        token('voice').thenBranch(
            token('list'),
            token('set').thenSingle(tokenString('value')),
        ),
        token('map').thenBranch(
            token('list'),
            token('add').thenList(tokenString('from'), tokenString('to')),
            token('remove').thenSingle(tokenString('value'))
        )
    ),
    token('poll').thenBranch(
        token('open').thenList(
            tokenString('title'),
            tokenString('options').asVarArg()
        ),
        token('close')
    )
];

const runToken = token('command', /^!f$/).thenBranch(...commandTokens);
const helpToken = token('help', /^\?f$/).thenBranch(...commandTokens);

export function parse(text: string): Root {
    const command = runToken.parse<Root>(text).command;
    const help = helpToken.parse<Root>(text).help;
    return { command, help };
}