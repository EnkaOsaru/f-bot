import { Snowflake, User } from 'discord.js';

import { JSONStorage } from '../json-storage';

interface Username {
    id: Snowflake;
    name: string;
}

interface UsernameStorage {
    usernames: Username[];
}

const storage = new JSONStorage<UsernameStorage>('username');

export function getUsername(user: User) {
    const { usernames } = storage.read();

    for (const { id, name } of usernames) {
        if (user.id === id) {
            return name;
        }
    }

    return user.username;
}