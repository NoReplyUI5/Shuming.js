import { PermissionFlagsBits } from "discord.js"
import ms from "ms";

export const MsgCommand = {
    name: "timeout",
    aliases: ["mute","to","shutup"],
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
                content: "Please mention a valid user, provide a valid user ID, or reply to a user's message.\nUsage: \`+to [userID or Mention or Reply] (7d) (reason)\`"
            });
        }

        let duration = args[1] ? ms(args[1]) : ms("7d"); // Default to 30 days if no duration provided
        const reason = args.slice(2).join(" ") || "No reason given";

        if (!duration || duration > ms("7d")) {
            return message.channel.send({
                content: "Please provide a valid duration (1s to 7d)."
            });
        }

        if (!targetUser.manageable) {
            return message.channel.send({
                content: "I cannot timeout this user."
            });
        }

        try {
            await targetUser.timeout(duration, reason);

            let replyContent = `${targetUser.user.tag} has been timed out for **${ms(duration, { long: true })}**.`;
            replyContent += `\n**Reason:** ${reason}`;

            message.channel.send({
                content: replyContent
            });

        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "I was unable to timeout this user. Please check my permissions and try again."
            });
        }
    }
};
