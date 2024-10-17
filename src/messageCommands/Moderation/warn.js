import { PermissionFlagsBits } from "discord.js";
import { Warning } from "../../mongoose/Moderation/WarningDB.js"; // Import the warning model

export const MsgCommand = {
    name: "warn",
    aliases: [],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.ManageMessages],
    anyClientPermissions: [PermissionFlagsBits.ManageMessages],
    run: async (client, message, args) => {
        // Get the user from a reply, mention, or ID
        const targetUser = message.mentions.members.first() 
                          || message.guild.members.cache.get(args[0]) 
                          || (message.mentions.repliedUser && message.guild.members.cache.get(message.mentions.repliedUser.id));

        if (!targetUser) {
            return message.channel.send({
                content: "Please mention a valid user, provide a valid user ID, or reply to a user's message.\nUsage: `+warn [userID, Mention, or Reply] (reason)`",
                allowedMentions: { repliedUser: false }
            });
        }

        // Prevent warning the bot or the message author
        if (targetUser.id === message.author.id) {
            return message.channel.send({
                content: "You cannot warn yourself.",
                allowedMentions: { repliedUser: false }
            });
        }

        if (targetUser.id === client.user.id) {
            return message.channel.send({
                content: "You cannot warn me.",
                allowedMentions: { repliedUser: false }
            });
        }

        const reason = args.slice(1).join(" ") || "No reason given";

        try {
            // Save the warning to the database
            let warning = await Warning.findOne({ guildId: message.guild.id, userId: targetUser.id });

            if (warning) {
                // If the user already has warnings, add to the existing list
                warning.warnings.push({
                    moderatorId: message.author.id,
                    reason: reason
                });
                await warning.save();
            } else {
                // If no warnings exist for the user, create a new entry
                warning = new Warning({
                    guildId: message.guild.id,
                    userId: targetUser.id,
                    warnings: [
                        {
                            moderatorId: message.author.id,
                            reason: reason
                        }
                    ]
                });
                await warning.save();
            }

            message.channel.send({
                content: `${targetUser.user.tag} has been warned for: ${reason}`,
                allowedMentions: { repliedUser: false }
            });

        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "An error occurred while issuing the warning. Please try again later.",
                allowedMentions: { repliedUser: false }
            });
        }
    }
};