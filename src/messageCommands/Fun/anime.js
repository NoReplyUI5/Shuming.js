import axios from 'axios';

export const MsgCommand = {
    name: "anime",
    aliases: ["ani", "anilist"],
    run: async (client, message, args) => {
        const animeName = args.join(" ");
        if (!animeName) {
            return message.channel.send({
                content: "Please provide the name of the anime you want to search for."
            });
        }

        try {
            const response = await axios.post('https://graphql.anilist.co', {
                query: `
                    query ($search: String) {
                        Media(search: $search, type: ANIME) {
                            id
                            title {
                                english
                                native
                            }
                            type
                            status
                            episodes
                            duration
                            season
                            startDate { year month day }
                            endDate { year month day }
                            genres
                            coverImage { large extraLarge }
                            description(asHtml: false)
                            studios { nodes { name } }
                            rankings { rank }
                            isAdult
                        }
                    }
                `,
                variables: { search: animeName }
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });

            const anime = response.data.data.Media;

            const embed = {
                color: 0x2F3136,
                title: `${anime.title.english || anime.title.native}`,
                description: `**Genre:** ${anime.genres.join(", ")}\n` +
                             `**Status:** ${anime.status}\n` +
                             `**Episodes:** ${anime.episodes || "N/A"} (${anime.duration || "N/A"} min each)\n` +
                             `**Season:** ${anime.season || "N/A"}\n` +
                             `**Start Date:** ${anime.startDate.day}-${anime.startDate.month}-${anime.startDate.year}\n` +
                             `**End Date:** ${anime.endDate.day}-${anime.endDate.month}-${anime.endDate.year}\n` +
                             `**Studios:** ${anime.studios.nodes.map(studio => studio.name).join(", ")}\n` +
                             `**Rank:** ${anime.rankings.length ? anime.rankings[0].rank : "N/A"}`,
//                thumbnail: { url: anime.coverImage.large },
                image: { url: `https://img.anili.st/media/${anime.id}` },
                footer: {
                    text: `Requested by ${message.author.username}`,
                    icon_url: message.author.displayAvatarURL()
                },
                timestamp: new Date()
            };

            
            message.channel.send({ embeds: [embed] });

        } catch (error) {
            client.logger.error(error);
            message.channel.send({
                content: "Couldn't retrieve the anime details at this time. Please try again later."
            });
        }
    }
};