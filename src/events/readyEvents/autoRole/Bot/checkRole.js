import { BOT_GUILD_ID, BOT_ROLE_ID } from '../../../../config.js';

const checkRolesForBots = async (guild) => {
    try {
        const members = await guild.members.fetch();
        const botMembers = members.filter(member => member.user.bot);

        for (const member of botMembers.values()) {
            const rolesToAdd = BOT_ROLE_ID.filter(roleId => !member.roles.cache.has(roleId));
            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
            }
        }
    } catch (error) {
        console.error(`Failed during bot role check: ${error.message}`);
    }
};

export const Event = {
    name: 'ready',
    runOnce: false,
    run: async (client) => {
        const guild = client.guilds.cache.get(BOT_GUILD_ID);
        if (!guild) {
            console.error('Guild not found!');
            return;
        }

        // Initial check for bots
        await checkRolesForBots(guild);

        // Check every 1 hour
        setInterval(() => checkRolesForBots(guild), 3600000); // 3600000 ms = 1 hour
    }
};