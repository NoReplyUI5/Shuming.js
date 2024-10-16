import { PermissionFlagsBits } from "discord.js";

export const MsgCommand = {
    name: "ban",
    aliases: [],
    guildCooldown: 4000,
    anyUserPermissions: [PermissionFlagsBits.BanMembers],
    anyClientPermissions: [PermissionFlagsBits.BanMembers],
    run: async (client, message, args) => {
        if (!args[0]) {
            return message.channel.send({
                content: "Please mention a valid user, provide a valid user ID, or reply to a user's message.\nUsage: `+ban [userID, Mention, or Reply] (reason)`",
                allowedMentions: { repliedUser: false }
            });
        }

        let targetUser;

        // Check if the argument is a mention, user ID, or a reply
        targetUser = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])
            || (message.mentions.repliedUser && message.guild.members.cache.get(message.mentions.repliedUser.id));

        // If not found in the guild, attempt global fetch by ID
        if (!targetUser && args[0]) {
            try {
                // Fetch globally by ID
                targetUser = await client.users.fetch(args[0]);

                if (targetUser) {
                    // Before banning, check if the user is already banned in the guild
                    const bannedUsers = await message.guild.bans.fetch();
                    const isAlreadyBanned = bannedUsers.has(targetUser.id);

                    if (isAlreadyBanned) {
                        return message.channel.send({
                            content: "This user is already banned in the guild.",
                            allowedMentions: { repliedUser: false }
                        });
                    }

                    // Proceed to ban globally fetched user
                    return message.guild.members.ban(targetUser.id, { reason: args.slice(1).join(" ") || "No reason given" })
                        .then(() => {
                            message.channel.send({
                                content: `${targetUser.tag} has been banned from the guild.`,
                                allowedMentions: { repliedUser: false }
                            });
                        })
                        .catch(err => {
                            console.error(err);
                            message.channel.send({
                                content: "I was unable to ban this user. Please check my permissions and try again.",
                                allowedMentions: { repliedUser: false }
                            });
                        });
                } else {
                    return message.channel.send({
                        content: "User not found globally or in the guild.",
                        allowedMentions: { repliedUser: false }
                    });
                }
            } catch (err) {
                console.error(err);
                return message.channel.send({
                    content: "An error occurred while fetching the user globally.",
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        // If user is found in the guild, check if already banned
        try {
            const bannedUsers = await message.guild.bans.fetch();
            const isAlreadyBanned = bannedUsers.has(targetUser?.id || args[0]);

            if (isAlreadyBanned) {
                return message.channel.send({
                    content: "This user is already banned in the guild.",
                    allowedMentions: { repliedUser: false }
                });
            }
        } catch (error) {
            console.error(error);
            return message.channel.send({
                content: "There was an error fetching the ban list. Please try again.",
                allowedMentions: { repliedUser: false }
            });
        }

        if (!targetUser) {
            return message.channel.send({
                content: "Could not find the user in the guild or globally.",
                allowedMentions: { repliedUser: false }
            });
        }

        const reason = args.slice(1).join(" ") || "No reason given";

        // Check if the user is bannable
        if (!targetUser.bannable) {
            return message.channel.send({
                content: "I cannot ban this user.",
                allowedMentions: { repliedUser: false }
            });
        }

        // Attempt to ban the user
        try {
            await targetUser.ban({ reason });
            message.channel.send({
                content: `${targetUser.user.tag} has been banned.`,
                allowedMentions: { repliedUser: false }
            });
        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "I was unable to ban this user. Please check my permissions and try again.",
                allowedMentions: { repliedUser: false }
            });
        }
    }
};