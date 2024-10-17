import { PermissionFlagsBits } from "discord.js";
import { Warning } from "../../mongoose/Moderation/WarningDB.js"; // Import the warning model

export const MsgCommand = {
    name: "unwarn",
    aliases: [],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.ManageMessages],
    anyClientPermissions: [PermissionFlagsBits.ManageMessages],
    run: async (client, message, args) => {
        // Get the user from a mention or ID
        const targetUser = message.mentions.members.first() 
                          || message.guild.members.cache.get(args[0]);

        if (!targetUser) {
            return message.channel.send({
                content: "Please mention a valid user or provide a valid user ID.\nUsage: `+unwarn [userID, Mention] (optional: warning index)`",
                allowedMentions: { repliedUser: false }
            });
        }

        // Prevent unwarning the bot or the message author
        if (targetUser.id === message.author.id) {
            return message.channel.send({
                content: "You cannot unwarn yourself.",
                allowedMentions: { repliedUser: false }
            });
        }

        if (targetUser.id === client.user.id) {
            return message.channel.send({
                content: "You cannot unwarn me.",
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            // Find the user's warnings in the database
            const warningDoc = await Warning.findOne({ guildId: message.guild.id, userId: targetUser.id });

            if (!warningDoc || warningDoc.warnings.length === 0) {
                return message.channel.send({
                    content: `${targetUser.user.tag} has no warnings.`,
                    allowedMentions: { repliedUser: false }
                });
            }

            const warningIndex = parseInt(args[1]) - 1; // Optional index for unwarn (1-based index)

            if (isNaN(warningIndex)) {
                // If no index is provided, clear all warnings for the user
                await Warning.findOneAndDelete({ guildId: message.guild.id, userId: targetUser.id });
                return message.channel.send({
                    content: `All warnings for ${targetUser.user.tag} have been cleared.`,
                    allowedMentions: { repliedUser: false }
                });
            }

            // If a valid index is provided, remove the specific warning
            if (warningIndex >= 0 && warningIndex < warningDoc.warnings.length) {
                warningDoc.warnings.splice(warningIndex, 1);
                await warningDoc.save();

                // If no warnings remain, delete the document
                if (warningDoc.warnings.length === 0) {
                    await Warning.findOneAndDelete({ guildId: message.guild.id, userId: targetUser.id });
                }

                return message.channel.send({
                    content: `Warning #${warningIndex + 1} for ${targetUser.user.tag} has been removed.`,
                    allowedMentions: { repliedUser: false }
                });
            } else {
                return message.channel.send({
                    content: `Invalid warning index. This user has ${warningDoc.warnings.length} warnings.`,
                    allowedMentions: { repliedUser: false }
                });
            }

        } catch (error) {
            client.logger.error(error); // Changed to client.logger to match the previous command
            message.channel.send({
                content: "An error occurred while removing the warning. Please try again later.",
                allowedMentions: { repliedUser: false }
            });
        }
    }
};