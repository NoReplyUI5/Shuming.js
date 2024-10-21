import { EmbedBuilder } from 'discord.js';
import request from 'request';

const config = {
  host: 'play.biltusmp.xyz',
  port: 25565,
  version: '1.20.1',
  motd: '',
  motd2: '',
  icon: 'https://cdn.discordapp.com/attachments/1073089280672542720/1101682698059260004/GrassBlock_HighRes.png',
  footerr: 'Monitoring BiltuSmp',
};

const channelId = '1152913478521208833';
const thumbnail = config.icon;

// Function to get server status
async function getServerStatus() {
  return new Promise((resolve, reject) => {
    const url = `https://api.mcsrvstat.us/2/${config.host}:${config.port}`;
    request(url, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        reject(new Error(`Status code: ${response.statusCode}`));
      } else {
        const data = JSON.parse(body);
        resolve(data);
      }
    });
  });
}

// Function to format the embed
function formatEmbed(data) {
  const online = data.online ? 'Online' : 'Offline';
  const playerCount = data.players ? `${data.players.online} / ${data.players.max}` : 'N/A';
  const version = data.version || config.version;
  const description = data.motd ? data.motd.clean[0] : config.motd;
  const footer = config.footerr;

  return new EmbedBuilder()
    .setTitle(`<a:status:1152902432695779368> Server Status: ${online}`)
    .setDescription(description)
    .setFooter({ text: `Last updated: ${new Date(Date.now())}` })
    .addFields(
      {
        name: "**<:World:1152899511195271238>** Ip Address",
        value: `**\`\`\`${config.host}\`\`\`**`,
        inline: true,
      },
      {
        name: "**<a:Portal:1152894434564907018>** Bedrock Port",
        value: `**\`\`\`25582\`\`\`**`,
        inline: true,
      },
      {
        name: "**<:version:1152893564431388772>** Version",
        value: `\`\`\`Minecraft 1.7.x-1.20.x | Bedrock 1.20.x\`\`\``,
        inline: true,
      },
      {
        name: "**<:user:1152893268967829544>** Online",
        value: `\`\`\`${playerCount} Player's\`\`\``,
        inline: true,
      },
      {
        name: "**<:server:1152906265383673936>** Game Mode",
        value: `\`\`\`Survival, Lifesteal, PvP Arena\`\`\``,
        inline: true,
      },
      {
        name: "**<:warning:1152892754045714432>** Warning",
        value: `\`\`\`Xray, Hack, PvP Mods, Abusing, Advertising, Spamming NOT ALLOWED\`\`\``,
        inline: true,
      },
      {
        name: "**Live Stats:**",
        value: "[Click Here](https://aboutyash.vercel.app/biltusmp)",
        inline: true,
      }
    )
    .setThumbnail(thumbnail);
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
    console.error(error);
  }
}

// Event to handle when the bot is ready
export const Event = {
  name: 'ready',
  runOnce: false,
  run: async (client) => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`);
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
    }, 120000); // Update every 2 minutes
  }
};
