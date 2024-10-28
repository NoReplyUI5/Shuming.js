import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import archiver from 'archiver';
import { BACKUP_ENABLED, BACKUP_TIMES, BACKUP_PASSWORD, BACKUP_TIME_ZONE, BACKUP_USER_IDS } from '../../config.js';
import { fileURLToPath } from 'url';
import registerFormat from 'archiver-zip-encrypted';

archiver.registerFormat('zip-encrypted', registerFormat);

// Set __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Decode the binary password
const decodedPassword = Buffer.from(BACKUP_PASSWORD, 'base64').toString();

export const Event = {
  name: 'ready',
  runOnce: false,
  run: async (client) => {
    if (!BACKUP_ENABLED) {
      client.logger.log('Backup system is disabled in the config.');
      return;
    }

    const scheduleBackups = () => {
      const times = Array.isArray(BACKUP_TIMES) ? BACKUP_TIMES : [BACKUP_TIMES];
      times.forEach(time => {
        const [hour, minute] = time.split(':').map(Number);
        const now = moment.tz(BACKUP_TIME_ZONE);
        const target = moment.tz(BACKUP_TIME_ZONE).set({ hour, minute, second: 0, millisecond: 0 });

        if (target.isBefore(now)) target.add(1, 'day');
        const delay = target.diff(now);

        setTimeout(() => {
          createBackup(client);
          setInterval(() => createBackup(client), 24 * 60 * 60 * 1000);
        }, delay);
      });
    };

    const createBackup = async (client) => {
      try {
        const timestamp = moment().tz(BACKUP_TIME_ZONE).format('MMDD_HHmmss');
        const zipFileName = `backup-${timestamp}-is-a.zip`;
        const outputPath = path.resolve(__dirname, '../../../', zipFileName);

        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip-encrypted', {
          zlib: { level: 9 },
          encryptionMethod: 'aes256',
          password: decodedPassword
        });

        output.on('close', async () => {
          client.logger.log(`Backup created: ${zipFileName} (${archive.pointer()} total bytes)`);
          await sendBackup(client, outputPath);
          fs.unlinkSync(outputPath); // Automatically delete ZIP after sending
        });

        archive.on('error', error => client.logger.error(`Archiving error: ${error.message}`));

        archive.pipe(output);

        archive.glob('**/*', {
          cwd: path.resolve(__dirname, '../../../'),
          dot: true,
          ignore: ['node_modules/**', '.npm/**', '.cache/**', '.config/**']
        });

        await archive.finalize();
      } catch (error) {
        client.logger.error(`Backup creation failed: ${error.message}`);
      }
    };

    const sendBackup = async (client, filePath) => {
      const sendToUsers = BACKUP_USER_IDS && BACKUP_USER_IDS.length;

      const messageOptions = {
        files: [{ attachment: filePath, name: path.basename(filePath) }]
      };

      if (sendToUsers) {
        for (const userId of BACKUP_USER_IDS) {
          try {
            const user = await client.users.fetch(userId);
            await user.send(messageOptions);
            client.logger.log(`Backup sent to user ${userId}`);
          } catch (error) {
            client.logger.error(`Failed to send backup to user ${userId}: ${error.message}`);
          }
        }
      }
    };

    scheduleBackups();
  }
};
