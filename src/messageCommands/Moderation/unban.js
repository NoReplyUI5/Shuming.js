import { PermissionFlagsBits } from "discord.js";

export const MsgCommand = {
    name: "unban",
    aliases: [],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.BanMembers],
    anyClientPermissions: [PermissionFlagsBits.BanMembers],
    run: async (client, message, args) => {
        // Check if a user ID is provided
        const userId = args[0];

        if (!userId) {
            return message.channel.send({
                content: "Please provide a valid user ID to unban.\nUsage: `+unban [userID]`",
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            // Fetch the ban list to check if the user is banned
            const banInfo = await message.guild.bans.fetch(userId);

            if (!banInfo) {
                return message.channel.send({
                    content: "This user is not banned or cannot be found in the ban list.",
                    allowedMentions: { repliedUser: false }
                });
            }

            // Attempt to unban the user
            await message.guild.members.unban(userId);

            message.channel.send({
                content: `User ${banInfo.user.tag} (ID: ${banInfo.user.id}) has been unbanned.`,
                allowedMentions: { repliedUser: false }
            });

        } catch (error) {
            if (error.code === 10026) {  // Error code for "Unknown Ban"
                return message.channel.send({
                    content: "This user is not banned or cannot be found in the ban list.",
                    allowedMentions: { repliedUser: false }
                });
            }
            client.logger.error(error);
            message.channel.send({
                content: "I was unable to unban this user. Please check if the user ID is valid and try again.",
                allowedMentions: { repliedUser: false }
            });
        }
    }
};