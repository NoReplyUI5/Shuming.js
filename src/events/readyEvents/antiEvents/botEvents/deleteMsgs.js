import { ANTI_BOT_MSG, MSG_DEL_TIME } from '../../../../config.js';

export const Event = {
    name: 'messageCreate',
    runOnce: false,
    run: async (message) => {
        const channelIds = ANTI_BOT_MSG;

        if (!channelIds.includes(message.channel.id) || !message.author.bot) return; // Ignore messages not in the specified channels or not from bots

        try {
            setTimeout(async () => {
                await message.delete();
            }, MSG_DEL_TIME*1000); // Deletes the message after # seconds
        } catch (error) {
            client.logger.error(`Failed to delete bot message from ${message.author.tag}: ${error.message}`);
        }
    }
};