require('@electron/remote/main').initialize()

// Requirements
const {app, BrowserWindow, ipcMain, Menu, dialog, shell} = require('electron')
const autoUpdater = require('electron-updater').autoUpdater
const ejse = require('ejs-electron')
const fs = require('fs')
const isDev = require('./app/template/default/assets/js/isdev')
const path = require('path')
const semver = require('semver')
const {pathToFileURL} = require('url')
const launcherDir = process.env.CONFIG_DIRECT_PATH || app.getPath('userData')
const EAU = require('electron-asar-hot-updater')
let toQuit = true

//AVAILABLES THEMES ARE : default, modern
let themeFile = path.join(launcherDir, 'theme.txt')
let theme
try {
    if (fs.existsSync(themeFile)) {
        try {
            let data = fs.readFileSync(themeFile, 'utf8')
            theme = data
        } catch (err) {
            theme = 'default'
        }
    } else {
        //on le crée ici
        try {
            fs.writeFileSync(themeFile, 'default')
            theme = 'default'
        } catch (err) {
            theme = 'default'
        }
    }
} catch (e) {
    theme = 'default'
}


// Setup auto updater.
function initAutoUpdater(event, data) {

    if (data) {
        autoUpdater.allowPrerelease = true
    } else {
        // Defaults to true if application version contains prerelease components (e.g. 0.12.1-alpha.1)
        // autoUpdater.allowPrerelease = true
    }

    if (isDev) {
        autoUpdater.autoInstallOnAppQuit = false
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
    }
    if (process.platform === 'darwin') {
        autoUpdater.autoDownload = false
    }
    autoUpdater.on('update-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-available', info)
    })
    autoUpdater.on('update-downloaded', (info) => {
        event.sender.send('autoUpdateNotification', 'update-downloaded', info)
    })
    autoUpdater.on('update-not-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-not-available', info)
    })
    autoUpdater.on('checking-for-update', () => {
        event.sender.send('autoUpdateNotification', 'checking-for-update')
    })
    autoUpdater.on('error', (err) => {
        event.sender.send('autoUpdateNotification', 'realerror', err)
    })
}

// Open channel to listen for update actions.
ipcMain.on('autoUpdateAction', (event, arg, data) => {
    switch (arg) {
        case 'initAutoUpdater':
            console.log('Initializing auto updater.')
            initAutoUpdater(event, data)
            event.sender.send('autoUpdateNotification', 'ready')
            break
        case 'checkForUpdate':
            autoUpdater.checkForUpdates()
                .catch(err => {
                    event.sender.send('autoUpdateNotification', 'realerror', err)
                })
            break
        case 'allowPrereleaseChange':
            if (!data) {
                const preRelComp = semver.prerelease(app.getVersion())
                if (preRelComp != null && preRelComp.length > 0) {
                    autoUpdater.allowPrerelease = true
                } else {
                    autoUpdater.allowPrerelease = data
                }
            } else {
                autoUpdater.allowPrerelease = data
            }
            break
        case 'installUpdateNow':
            autoUpdater.quitAndInstall()
            break
        default:
            console.log('Unknown argument', arg)
            break
    }
})
// Redirect distribution index event from preloader to renderer.
ipcMain.on('distributionIndexDone', (event, res) => {
    event.sender.send('distributionIndexDone', res)
})

// Disable hardware acceleration.
// https://electronjs.org/docs/tutorial/offscreen-rendering
app.disableHardwareAcceleration()

// https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow(isUpdate) {

    if (!isUpdate) {
        win = new BrowserWindow({
            width: 1280,
            height: 720,
            minWidth: 980,
            minHeight: 552,
            icon: getPlatformIcon('logo'),
            frame: false,
            resizable: true,
            webPreferences: {
                preload: path.join(__dirname, 'app', 'template', theme, 'assets', 'js', 'preloader.js'),
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            backgroundColor: '#171614'
        })

        ejse.data('bkid', Math.floor((Math.random() * fs.readdirSync(path.join(__dirname, 'app', 'template', theme, 'assets', 'images', 'backgrounds')).length)))
        win.webContents.session.clearCache(function () {
        })
        win.loadURL(pathToFileURL(path.join(__dirname, 'app', 'template', theme, 'app.ejs')).toString())
        //win.webContents.openDevTools()
    } else {
        win = new BrowserWindow({
            width: 500,
            height: 200,
            icon: getPlatformIcon('logo'),
            frame: false,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            backgroundColor: '#171614'
        })
        ejse.data('bkid', Math.floor((Math.random() * fs.readdirSync(path.join(__dirname, 'app', 'template', theme, 'assets', 'images', 'backgrounds')).length)))
        win.loadURL(pathToFileURL(path.join(__dirname, 'app', 'update.ejs')).toString())
    }
    /*win.once('ready-to-show', () => {
        win.show()
    })*/

    win.removeMenu()

    win.on('closed', () => {
        win = null
    })
}

function createMenu() {

    if (process.platform === 'darwin') {

        // Extend default included application menu to continue support for quit keyboard shortcut
        let applicationSubMenu = {
            label: 'Application',
            submenu: [{
                label: 'About Application',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => {
                    app.quit()
                }
            }]
        }

        // New edit menu adds support for text-editing keyboard shortcuts
        let editSubMenu = {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }]
        }

        // Bundle submenus into a single template and build a menu object with it
        let menuTemplate = [applicationSubMenu, editSubMenu]
        let menuObject = Menu.buildFromTemplate(menuTemplate)

        // Assign it to the application
        Menu.setApplicationMenu(menuObject)

    }

}

function getPlatformIcon(filename) {
    let ext
    switch (process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'app', 'template', theme, 'assets', 'images', `${filename}.${ext}`)
}

//here we need to save a default distro file:
const distro = {
    version: '0.0.1',
    discord: {
        clientId: '884772723274948628',
        smallImageText: 'Ezariel Network',
        smallImageKey: 'logo_1024'
    },
    java: {
        oracle: 'http://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html'
    },
    servers: []
}
let distribution = path.join(launcherDir, 'distribution.json')

try {
    if (!fs.existsSync(distribution)) {
        fs.writeFileSync(distribution, JSON.stringify(distro, null, 4), 'UTF-8')
    }
} catch (err) {
    console.log(err)
}


app.on('ready', function () {
    EAU.init({
        'api': 'https://launcher.ezariel.eu/launcherData/api.json',
        'server': true,
        'debug': false,
        'headers': {},
        'body': {
            name: app.name,
            current: app.getVersion()
        },
        'formatRes': function (res) {
            return res
        }
    })
    EAU.check(function (error, last, body) {
        if (error) {
            createMenu()
            createWindow(false)
        } else {
            if (semver.lt(app.getVersion(), last)) {
                if (process.platform === 'darwin') {
                    dialog.showErrorBox('Mise à jour', 'Une mise a jour est disponnible, merci de la telecharger ')
                    shell.openExternal('https://launcher.ezariel.eu/download/mac')
                    app.quit()
                } else if (process.platform === 'linux') {
                    dialog.showErrorBox('Mise à jour', 'Une mise a jour est disponnible, merci de la telecharger ')
                    shell.openExternal('https://launcher.ezariel.eu/download/linux')
                    app.quit()
                } else {
                    dialog.showErrorBox('Mise a jour', 'Une nouvelle version est disponnible, le launcher va se mettre à jour')
                    createMenu()
                    createWindow(true)
                    //here we need to create our download
                    EAU.progress(function (state) {

                    })
                    EAU.download(function (error) {
                        if (error) {
                            dialog.showErrorBox('info', error)
                            app.quit()
                        }
                        dialog.showErrorBox('Mise à jour', 'La mise à jour a été téléchargée, le launcher va redémarer.')
                        if (process.platform === 'darwin') {
                            app.relaunch()
                            app.quit()
                        } else {
                            app.quit()
                        }
                    })
                }
            } else {
                createMenu()
                createWindow(false)
            }
        }
    })
})
//app.on('ready', createWindow)
//app.on('ready', createMenu)

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        if (toQuit) {
            app.quit()
        } else {
            toQuit = true
        }
    }
})


app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow(false)
    }
})

ipcMain.on('openConsole', () => {
    win.webContents.openDevTools()
})

ipcMain.on('delete-action', (event) => {
    const sysRoot = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME)
    const dataPath = path.join(sysRoot, '.ezariel')

    fs.rmdir(dataPath, {recursive: true}, (err) => {
        if (err) {
            throw err
        }
    })

    event.reply('delete-ok')

})

ipcMain.on('switch-theme', (event, args) => {
    console.log('recieve', args)
    if (theme != args) {
        try {
            fs.writeFileSync(themeFile, args)
            theme = args
        } catch (err) {
            theme = args
        }

        toQuit = false
        win.close()
        createWindow(false)

    }

})

ipcMain.on('close-launcher', () => {
    win.close()
    app.quit()
})