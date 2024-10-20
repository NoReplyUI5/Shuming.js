import { Client } from 'undici-types';
import { BOT_GUILD_ID, USER_ROLE_ID } from '../../../../config.js';

export const Event = {
    name: 'guildMemberAdd',
    runOnce: false,
    run: async (member) => {
        if (member.user.bot) return; // Ignore bots

        try {
            const guild = member.guild;
            if (guild.id !== BOT_GUILD_ID) return; // Ensure the event is for the correct guild

            const rolesToAdd = USER_ROLE_ID.filter(roleId => !member.roles.cache.has(roleId));

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
                // Optional: Log role addition or notify somewhere
            }
        } catch (error) {
            // Handle errors silently, e.g., log to file or external service
            client.logger.error(`Failed to add roles for ${member.displayName}: ${error.message}`);
        }
    }
};
