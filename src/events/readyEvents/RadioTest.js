import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection,
} from '@discordjs/voice';
import { ChannelType, Events } from 'discord.js';
import { t } from "tasai";
import { setTimeout } from 'node:timers/promises';
import axios from 'axios';
import { PassThrough } from 'stream';

const voiceChannelId = '1297483247478902834';
const radioUrl = 'https://boxradio-edge-02.streamafrica.net/lofi';

export const Event = {
    name: 'ready',
    runOnce: false,
    run: async (client) => {
        let player;
        let cacheStream;
        let isPlaying = false;

        const playRadio = async (connection) => {
            if (isPlaying) return;
            isPlaying = true;

            player = createAudioPlayer();
            cacheStream = new PassThrough();

            const fetchStream = async () => {
                try {
                    const response = await axios.get(radioUrl, {
                        responseType: 'stream',
                    });

                    response.data.pipe(cacheStream);

                    response.data.on('end', async () => {
                        cacheStream.end();
                        await handlePlaybackError();
                    });

                    response.data.on('error', async () => {
                        await handlePlaybackError();
                    });

                } catch {
                    await handlePlaybackError();
                }
            };

            const playStream = async () => {
                try {
                    const resource = createAudioResource(cacheStream, {
                        inlineVolume: true,
                    });
                    player.play(resource);

                    await entersState(player, AudioPlayerStatus.Playing, 5000);
                    console.log(t.bold.green.toFunction()("[Player] ") + t.bold.cyan.toFunction()("Streaming..."));

                } catch {
                    await handlePlaybackError();
                }
            };

            const handlePlaybackError = async () => {
                console.log(t.bold.yellow.toFunction()("[Player] ") + "Attempting to restart stream...");
                cacheStream = new PassThrough();
                await setTimeout(1000);  // Shorter delay for quicker recovery
                await fetchStream();
                await playStream();
            };

            player.on(AudioPlayerStatus.Idle, async () => {
                await handlePlaybackError();
            });

            player.on('error', async () => {
                await handlePlaybackError();
            });

            connection.subscribe(player);
            await fetchStream();
            await playStream();
        };

        const startRadio = async () => {
            const voiceChannel = client.channels.cache.get(voiceChannelId);
            if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return;

            let connection = getVoiceConnection(voiceChannel.guild.id);
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
            }

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(t.bold.green.toFunction()("[Connection] ") + t.bold.blue.toFunction()("Connected, starting radio..."));
                playRadio(connection);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                console.log(t.bold.red.toFunction()("[Connection] ") + "Disconnected, attempting to reconnect...");
                try {
                    await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
                } catch {
                    connection.destroy();
                    isPlaying = false;
                    startRadio();
                }
            });

            connection.on('error', () => {
                connection.destroy();
                isPlaying = false;
                startRadio();
            });
        };

        const monitorBots = async () => {
            client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
                const channel = newState.channel;
                if (channel && channel.id === voiceChannelId && newState.member.user.bot && newState.member.id !== client.user.id) {
                    console.log(t.bold.yellow.toFunction()("[Safety] ") + `Bot ${newState.member.user.tag} joined. Disconnecting in 5 seconds...`);
                    await setTimeout(5000); // Wait 5 seconds before disconnecting the bot
                    try {
                        await newState.disconnect();
                    } catch (error) {
                        console.error(t.bold.red.toFunction()("[Error] ") + `Failed to disconnect bot ${newState.member.user.tag}: ${error.message}`);
                    }
                }
            });
        };

        startRadio();
        monitorBots();
    }
};