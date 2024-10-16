import os from 'os';
import fs from 'fs';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

// Read package.json in an ESM environment
const packageJSON = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));

export const MsgCommand = {
    name: "stats",
    aliases: [], // No aliases
    run: async (client, message) => {
        const deleteMessageComponent = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId("deleteOutput")
            .setLabel("Delete Output")
            .setStyle(ButtonStyle.Danger));
        
        const djsversion = packageJSON.dependencies["discord.js"];
        let totalUsers = 0;

        // Calculate total users across guilds
        client.guilds.cache.forEach((guild) => {
            totalUsers += guild.available ? guild.memberCount : 0;
        });
        const cachedUser = client.users.cache.size;

        // Calculate uptime in months, days, hours, and minutes
        const uptimeInSeconds = process.uptime();
        const months = Math.floor(uptimeInSeconds / (30 * 24 * 3600)); // Approximate month as 30 days
        const days = Math.floor((uptimeInSeconds % (30 * 24 * 3600)) / (24 * 3600));
        const hours = Math.floor((uptimeInSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeInSeconds % 3600) / 60);

        // Create the embed with bot information
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
> Uptime: ${months} months, ${days} days, ${hours} hours, ${minutes} minutes

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
            .setFooter({ text: "Bot Stats Information", iconURL: client.user.displayAvatarURL() });

        return message.reply({ embeds: [infoEmbed], components: [deleteMessageComponent] });
    },
};
