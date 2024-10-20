import { BOT_GUILD_ID, USER_ROLE_ID } from '../../../../config.js';

const checkRoles = async (guild) => {
    try {
        const members = await guild.members.fetch();
        const nonBotMembers = members.filter(member => !member.user.bot);

        for (const member of nonBotMembers.values()) {
            const rolesToAdd = USER_ROLE_ID.filter(roleId => !member.roles.cache.has(roleId));
            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
            }
        }
    } catch (error) {
        client.logger.error(`Failed during role check: ${error.message}`);
    }
};

export const Event = {
    name: 'ready',
    runOnce: false,
    run: async (client) => {
        const guild = client.guilds.cache.get(BOT_GUILD_ID);
        if (!guild) {
            client.logger.error('Guild not found!');
            return;
        }

        await checkRoles(guild);

        setInterval(() => checkRoles(guild), 3600000); // 3600000 ms = 1 hour
    }
};