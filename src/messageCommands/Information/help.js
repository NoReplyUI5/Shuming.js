import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MsgCommand = {
    name: "help",
    aliases: ["h", "commands"],
    run: async (client, message) => {
        const commandsDir = path.join(__dirname, './'); // Assuming the help command is inside a subfolder of the commands directory
        const commandFiles = [];
        const categories = {};

        const readCommands = (dir, category = '') => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    const subCategory = category ? `${category}/${file}` : file;
                    readCommands(filePath, subCategory);
                } else if (file.endsWith('.js')) {
                    if (category) {
                        if (!categories[category]) categories[category] = [];
                        categories[category].push(file.replace('.js', ''));
                    } else {
                        commandFiles.push(file.replace('.js', ''));
                    }
                }
            }
        };

        readCommands(commandsDir);

        const embed = {
            color: 0x2F3136,
            title: "Help Menu",
            description: "Here are the available commands:",
            fields: []
        };

        if (commandFiles.length > 0) {
            embed.fields.push({
                name: "Basic Commands",
                value: commandFiles.join(", "),
                inline: false
            });
        }

        for (const category in categories) {
            embed.fields.push({
                name: category,
                value: categories[category].join(", "),
                inline: false
            });
        }

        message.channel.send({ embeds: [embed] });
    }
};