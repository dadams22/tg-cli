import { app } from 'electron';
import { AppImageUpdater, MacUpdater, NsisUpdater } from "electron-updater";

export function configureAutoUpdate() {
    const options = {
        autoDownload: false,
        autoInstallOnAppQuit: true,
        currentVersion: app.getVersion(),
    }
    let autoUpdater;
    if (process.platform === "win32") {
        // @ts-ignore
        autoUpdater = new NsisUpdater(options)
    } else if (process.platform === "darwin") {
        // @ts-ignore
        autoUpdater = new MacUpdater(options)
    } else {
        // @ts-ignore
        autoUpdater = new AppImageUpdater(options)
    }

    const url = 'https://github.com/dadams22/tg-cli';
    autoUpdater.setFeedURL({ url })

    setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 10)

    autoUpdater.on('update-available', (info) => {
        console.log('Newer version of Testgram CLI found');

        autoUpdater.downloadUpdate().then(
            () => console.log('Downloading update')
        )
    })

    autoUpdater.on('download-progress', (progress, bytesPerSecond, percent, total, transferred) => {
        // log progress here
    })

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded')
        console.log('Installing update')
        autoUpdater.quitAndInstall();
    })
}