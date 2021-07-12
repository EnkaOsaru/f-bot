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

const parser = token('root', /^!f$/).thenBranch(
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
);

export function parse(text: string): Command | undefined {
    return (parser.parse(text) as { root?: Command })?.root;
}