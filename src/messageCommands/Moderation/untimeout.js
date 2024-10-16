import { PermissionFlagsBits } from "discord.js";

export const MsgCommand = {
    name: "untimeout",
    aliases: ["unmute", "uto", "letgo"],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.ModerateMembers],
    anyClientPermissions: [PermissionFlagsBits.ModerateMembers],
    run: async (client, message, args) => {
        // Get the user from a reply, mention, or ID
        const targetUser = message.mentions.members.first() 
                          || message.guild.members.cache.get(args[0]) 
                          || message.mentions.repliedUser && message.guild.members.cache.get(message.mentions.repliedUser.id);

        if (!targetUser) {
            return message.channel.send({
                content: "Please mention a valid user, provide a valid user ID, or reply to a user's message.\nUsage: \`+uto [userID or Mention or Reply]\`"
            });
        }

        // Check if the user is currently timed out
        if (!targetUser.isCommunicationDisabled()) {
            return message.channel.send({
                content: "This user is not currently timed out."
            });
        }

        if (!targetUser.manageable) {
            return message.channel.send({
                content: "I cannot untimeout this user."
            });
        }

        try {
            await targetUser.timeout(null); // Remove the timeout

            message.channel.send({
                content: `${targetUser.user.tag} has been untimed out.`
            });

        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "I was unable to untimeout this user. Please check my permissions and try again."
            });
        }
    }
};
