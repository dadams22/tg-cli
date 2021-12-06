import { app } from 'electron';
import { autoUpdater } from "electron-updater";

export function configureAutoUpdate() {
    const url = 'https://github.com/dadams22/tg-cli';
    autoUpdater.setFeedURL({ url, provider: 'github' });

    setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 10);

    autoUpdater.on('update-available', (info) => {
        console.log('A newer version of Testgram CLI is available');

        autoUpdater.downloadUpdate()
        console.log('Downloading update');
    });

    autoUpdater.on('download-progress', (progress, bytesPerSecond, percent, total, transferred) => {
        // log progress here
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded')
        console.log(info);
        console.log('Installing update')
        autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', (err) => console.error(`Error updating: ${err.message}`));
}