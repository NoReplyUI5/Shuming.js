import { PermissionFlagsBits } from "discord.js";

export const MsgCommand = {
    name: "kick",
    aliases: [],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.KickMembers],
    anyClientPermissions: [PermissionFlagsBits.KickMembers],
    run: async (client, message, args) => {
        // Check if the argument is a mention, user ID, or a reply
        const targetUser = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])
            || (message.reference && message.guild.members.cache.get((await message.fetchReference()).author.id));

        // If the user is not found in the guild
        if (!targetUser) {
            return message.channel.send({
                content: "Please mention a valid user, provide a valid user ID, or reply to a user's message.\nUsage: `+kick [userID, Mention, or Reply] (reason)`",
                allowedMentions: { repliedUser: false }
            });
        }

        const reason = args.slice(1).join(" ") || "No reason given";

        // Prevent kicking the message author or the bot
        if (targetUser.id === message.author.id) {
            return message.channel.send({
                content: "You cannot kick yourself.",
                allowedMentions: { repliedUser: false }
            });
        }

        if (targetUser.id === client.user.id) {
            return message.channel.send({
                content: "You cannot kick me.",
                allowedMentions: { repliedUser: false }
            });
        }

        // Check if the user is kickable
        if (!targetUser.kickable) {
            return message.channel.send({
                content: "I cannot kick this user due to role hierarchy or permissions.",
                allowedMentions: { repliedUser: false }
            });
        }

        // Attempt to kick the user
        try {
            await targetUser.kick(reason);
            message.channel.send({
                content: `${targetUser.user.tag} has been kicked from the guild. **Reason:** ${reason}`,
                allowedMentions: { repliedUser: false }
            });
        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "I was unable to kick this user. Please check my permissions and try again.",
                allowedMentions: { repliedUser: false }
            });
        }
    }
};