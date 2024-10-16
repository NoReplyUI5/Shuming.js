import os from 'os';
import fs from 'fs';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import util from 'util';

// Read package.json in an ESM environment
const packageJSON = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));

export const MsgCommand = {
    name: "eval+",
    aliases: [], // No aliases
    ownerOnly: true, // Owner-only command
    run: async (client, message) => {
        const deleteMessageComponent = new ActionRowBuilder().addComponents(new ButtonBuilder()
          .setCustomId("deleteOutput")
          .setLabel("Delete Output")
          .setStyle(ButtonStyle.Danger));
        const content = message.content.split(" ").slice(1).join(" ");
        const djsversion = packageJSON.dependencies["discord.js"];
        let totalUsers = 0;

        // Calculate total users across guilds
        client.guilds.cache.forEach((guild) => {
            totalUsers += guild.available ? guild.memberCount : 0;
        });
        const cachedUser = client.users.cache.size;

        // If no code is provided, display bot information
        if (!content) {
            const infoEmbed = new EmbedBuilder()
                .setColor("#7289DA")
                .setTitle("Bot Information")
                .setDescription(`
**Bot Information**

> Eval Version: \`v1.0.4\`
> Node.js Version: \`${process.version}\`
> Platform: \`${os.platform()}\`
> Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
> Process ID: ${process.pid}
> Sharded: ${client.shard ? 'Yes' : 'No'}
> Average WebSocket Latency: ${client.ws.ping} ms
> Uptime: ${Math.floor(process.uptime() / 60)} minutes

**Bot Stats**

> Discord.js Version: \`${djsversion}\`
> Guilds: ${client.guilds.cache.size}
> Users: ${totalUsers} (Cached: ${cachedUser})
> Channels: ${client.channels.cache.size}
> Events: ${client.events.size}
> prefixCmds: ${client.messageCommands.size}
> slashCmds: ${client.slashCommands.size}

**Intents**

> GuildPresences: ${client.options.intents.has('GuildPresences') ? 'Enabled' : 'Disabled'}
> GuildMembers: ${client.options.intents.has('GuildMembers') ? 'Enabled' : 'Disabled'}
> MessageContent: ${client.options.intents.has('MessageContent') ? 'Enabled' : 'Disabled'}

> Process Started: <t:${Math.floor(client.readyTimestamp / 1000)}:R>
> Bot Ready At: <t:${Math.floor(client.readyAt / 1000)}:R>`)
                .setFooter({ text: "Bot Eval Information", iconURL: client.user.displayAvatarURL() });

            return message.reply({ embeds: [infoEmbed] });
        }

        // Prevent access to sensitive information like the bot token
        if (content.includes('token')) {
            return message.reply("Access to the token is restricted.");
        }

        try {
            let result = eval(content); // Evaluate the input code
            let output = typeof result !== "string" ? util.inspect(result, { depth: 0 }) : result;

            if (output.includes(client.token)) {
                output = output.replace(client.token, "[TOKEN REDACTED]");
            }

            return message.reply({
                content: `\`\`\`js\n${output}\n\`\`\``,
                components: [deleteMessageComponent],
                allowedMentions: {
                    repliedUser: false
                }
            });
        } catch (err) {
            let error = err.toString();

            if (error.includes(client.token)) {
                error = error.replace(client.token, "[TOKEN REDACTED]");
            }

            return message.reply({
                content: `\`\`\`js\n${error}\n\`\`\``,
                components: [deleteMessageComponent]
            });
        }
    },
};