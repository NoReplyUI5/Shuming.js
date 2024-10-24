import { MC_STATS_CHANNEL_ID, MC_STATS_IP, MC_STATS_PORT, MC_STATS_ICON, MC_STATS_ENABLED, MC_STATS_REFRESH } from '../../config.js';
import { EmbedBuilder } from 'discord.js';
import axios from 'axios';

const config = {
  host: MC_STATS_IP,
  port: MC_STATS_PORT || "25565",
  icon: MC_STATS_ICON || "https://cdn.discordapp.com/attachments/1073089280672542720/1101682698059260004/GrassBlock_HighRes.png",
};

const channelId = MC_STATS_CHANNEL_ID;
const thumbnail = config.icon;

// Function to get server status using axios
async function getServerStatus() {
  try {
    const url = `https://api.mcsrvstat.us/3/${config.host}:${config.port}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response ? `Status code: ${error.response.status}` : error.message);
  }
}

// Function to format the embed
function formatEmbed(data) {
  const online = data.online ? 'Online' : 'Offline';
  const playerCount = data.online ? `${data.players.online} / ${data.players.max}` : 'N/A';
  const version = data.protocol ? `${data.protocol.name} (${data.protocol.version})` : "N/A";
  const description = data.motd ? `${data.motd.clean[0]}\n${data.motd.clean[1]}` : "N/A";

  const embed = new EmbedBuilder()
    .setTitle(`**Server Status:** ${online}`)
    .setDescription(online === 'Online' ? description : 'The server is currently offline.')
    .setFooter({ text: `Last updated: ${new Date(Date.now())}` })
    .setThumbnail(thumbnail)
    .addFields(
      {
        name: "**Ip Address**",
        value: `**\`\`\`${config.host}\`\`\`**`,
        inline: true,
      },
      {
        name: "**Version**",
        value: `\`\`\`Minecraft ${version}\`\`\``,
        inline: true,
      }
    );

  if (online === 'Online') {
    embed.addFields(
      {
        name: "**Online**",
        value: `\`\`\`${playerCount} Player(s)\`\`\``,
        inline: true,
      }
    );
  } else {
    embed.addFields({
      name: "**Status**",
      value: `\`\`\`The server is offline\`\`\``,
      inline: true,
    });
  }

  return embed;
}

// Function to send the embed
async function sendEmbed(channel, lastMessageId) {
  try {
    const data = await getServerStatus();
    const embed = formatEmbed(data);
    
    if (lastMessageId) {
      const lastMessage = await channel.messages.fetch(lastMessageId);
      lastMessage.edit({ embeds: [embed] });
    } else {
      const message = await channel.send({ embeds: [embed] });
      return message.id; // Return the message ID for tracking
    }
  } catch (error) {
    client.logger.error(error);
  }
}

// Event to handle when the bot is ready
export const Event = {
  name: 'ready',
  runOnce: false,
  run: async (client) => {
    // Check if the event is enabled
    if (!MC_STATS_ENABLED) {
      client.logger.log('MC Stats event is disabled from config.');
      return;
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      client.logger.error(`Channel with ID ${channelId} not found`);
      return;
    }
    
    let lastMessageId = null;
    const fetched = await channel.messages.fetch({ limit: 100 });
    await channel.bulkDelete(fetched);

    // Send the initial embed message and save the last message ID
    lastMessageId = await sendEmbed(channel, lastMessageId);
    
    // Update the embed message every 2 minutes
    setInterval(() => {
      sendEmbed(channel, lastMessageId);
    }, MC_STATS_REFRESH * 1000); // Update every 2 minutes
  }
};