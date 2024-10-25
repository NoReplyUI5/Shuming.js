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
import { setTimeout } from 'node:timers/promises';
import axios from 'axios';
import { PassThrough } from 'stream';
import { RADIO_CHANNEL, RADIO_URL, RADIO_ENABLED } from '../../config.js';

const voiceChannelId = RADIO_CHANNEL;
const radioUrl = RADIO_URL;

export const Event = {
    name: 'ready',
    runOnce: false,
    run: async (client) => {
        if (!RADIO_ENABLED) {
            client.logger.warn('[Module] Radio Disabled');
            return; // Exit if radio is disabled
        }
        client.logger.success('[Module] Radio Enabled');

        let player;
        let cacheRadio;
        let radioPlaying = false;

        const playRadio = async (connection) => {
            if (radioPlaying) return;
            radioPlaying = true;

            player = createAudioPlayer();
            cacheRadio = new PassThrough();

            const fetchStream = async () => {
                try {
                    const response = await axios.get(radioUrl, { responseType: 'stream' });
                    response.data.pipe(cacheRadio);

                    response.data.on('end', async () => {
                        client.logger.warn('[Radio] Stream ended unexpectedly. Re-fetching stream.');
                        cacheRadio.end();
                        await handlePlaybackError();
                    });

                    response.data.on('error', async (error) => {
                        client.logger.error('[Radio] Stream error:', error);
                        await handlePlaybackError();
                    });
                } catch (error) {
                    client.logger.error('[Radio] Failed to fetch stream:', error);
                    await handlePlaybackError();
                }
            };

            const playStream = async () => {
                try {
                    const resource = createAudioResource(cacheRadio, { inlineVolume: true });
                    player.play(resource);
                    await entersState(player, AudioPlayerStatus.Playing, 5000);
                } catch (error) {
                    client.logger.error('[Radio] Error playing stream:', error);
                    await handlePlaybackError();
                }
            };

            const handlePlaybackError = async () => {
                cacheRadio = new PassThrough();
                await setTimeout(5000);
                await fetchStream();
                await playStream();
            };

            player.on(AudioPlayerStatus.Idle, async () => { await handlePlaybackError(); });

            player.on('error', async (error) => {
                client.logger.error('[Radio] Player error:', error);
                await handlePlaybackError();
            });

            connection.subscribe(player);
            await fetchStream();
            await playStream();
        };

        const startRadio = async () => {
            const voiceChannel = client.channels.cache.get(voiceChannelId);
            if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
                client.logger.warn('[Bot] Voice channel not found or invalid type');
                return;
            }

            let connection = getVoiceConnection(voiceChannel.guild.id);
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                client.logger.log('[Bot] Joined voice channel');
            }

            connection.on(VoiceConnectionStatus.Ready, () => {
                client.logger.log('[Radio] Connection ready');
                playRadio(connection);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                client.logger.warn('[Radio] Disconnected');
                try {
                    await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
                    client.logger.success('[Radio] Reconnected');
                } catch {
                    client.logger.error('[Radio] Failed to reconnect');
                    connection.destroy();
                    radioPlaying = false;
                    startRadio();
                }
            });

            connection.on('error', (error) => {
                client.logger.error('[Radio] Connection error:', error);
                connection.destroy();
                radioPlaying = false;
                startRadio();
            });
        };

        const monitorBots = async () => {
            client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
                const channel = newState.channel;
                if (channel && channel.id === voiceChannelId && newState.member.user.bot && newState.member.id !== client.user.id) {
                    client.logger.info(`[Monitor] Disconnecting bot ${newState.member.user.tag}`);
                    await setTimeout(5000);
                    try {
                        await newState.disconnect();
                    } catch (error) {
                        client.logger.error('[Monitor] Error disconnecting bot:', error);
                    }
                }
            });
        };

        startRadio();
        monitorBots();
    }
};
