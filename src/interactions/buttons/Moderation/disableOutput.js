export const Button = {
    name: "disableOutput",
    run: async (interaction) => {
        await interaction.message.delete();
    }
};