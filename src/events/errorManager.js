export const Event = {
    name: "errorManager",
    customEvent: true,
    run: () => {
        process.on('unhandledRejection', (error) => {
            client.logger.log(error);
        });
        process.on('uncaughtException', (error) => {
            client.logger.log(error);
        });
    }
}; // Error Handler to avoid the bot from crashing on error.