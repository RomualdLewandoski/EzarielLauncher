/**
 * Core UI functions are initialized in this file. This prevents
 * unexpected errors from breaking the core features. Specifically,
 * actions in this file should not require the usage of any internal
 * modules, excluding dependencies.
 */
// Requirements
const $ = require('jquery')
const {ipcRenderer, shell, webFrame} = require('electron')
const remote = require('@electron/remote')
const isDev = require('./assets/js/isdev')
const LoggerUtil = require('./assets/js/loggerutil')

const loggerUICore = LoggerUtil('%c[UICore]', 'color: #000668; font-weight: bold')
const loggerAutoUpdater = LoggerUtil('%c[AutoUpdater]', 'color: #000668; font-weight: bold')
const loggerAutoUpdaterSuccess = LoggerUtil('%c[AutoUpdater]', 'color: #209b07; font-weight: bold')
const fetch = require('node-fetch')
let launcherConfigs
const times = []
let fps
let meter
// Log deprecation and process warnings.
process.traceProcessWarnings = true
process.traceDeprecation = true

// Disable eval function.
// eslint-disable-next-line
window.eval = global.eval = function () {
    throw new Error('Sorry, this app does not support window.eval().')
}

// Display warning when devtools window is opened.
remote.getCurrentWebContents().on('devtools-opened', () => {
    console.log('%cThe console is dark and full of terrors.', 'color: white; -webkit-text-stroke: 4px #a02d2a; font-size: 60px; font-weight: bold')
    console.log('%cIf you\'ve been told to paste something here, you\'re being scammed.', 'font-size: 16px')
    console.log('%cUnless you know exactly what you\'re doing, close this window.', 'font-size: 16px')
})

// Disable zoom, needed for darwin.
webFrame.setZoomLevel(0)
webFrame.setVisualZoomLevelLimits(1, 1)

function meterShow() {
    meter.show()
}

function meterHide() {
    meter.hide()
}

function showUpdateUI(info) {
    //TODO Make this message a bit more informative `${info.version}`
    document.getElementById('image_seal_container').setAttribute('update', true)
    document.getElementById('image_seal_container').onclick = () => {
        switchView(getCurrentView(), VIEWS.settings, 500, 500, () => {
            settingsNavItemListener(document.getElementById('settingsNavUpdate'), false)
        })
    }
}

/*document.addEventListener('readystatechange', async function () {
    if (document.readyState === 'interactive') {
        loggerUICore.log('UICore Initializing..')

        // Bind close button.
        /*Array.from(document.getElementsByClassName('fCb')).map((val) => {
            val.addEventListener('click', e => {
                const window = remote.getCurrentWindow()
                window.close()
            })
        })*/

        // Bind restore down button.
        /*Array.from(document.getElementsByClassName('fRb')).map((val) => {
            val.addEventListener('click', e => {
                const window = remote.getCurrentWindow()
                if (window.isMaximized()) {
                    window.unmaximize()
                } else {
                    window.maximize()
                }
                document.activeElement.blur()
            })
        })*/

        // Bind minimize button.
        /*Array.from(document.getElementsByClassName('fMb')).map((val) => {
            val.addEventListener('click', e => {
                const window = remote.getCurrentWindow()
                window.minimize()
                document.activeElement.blur()
            })
        })*/

        // Remove focus from social media buttons once they're clicked.


        //ici
        /*let fallbackJson
        await fetch('https://launcher.ezariel.eu/launcher')
            .then(res => res.json())
            .then(json => fallbackJson = json)
        launcherConfigs = fallbackJson

        console.log(launcherConfigs)
        $('#frameTitleText').text(launcherConfigs.siteName)
        $('title').text(launcherConfigs.siteName)
        $('#myVideoSrc').attr('src', launcherConfigs.fallbackVideo)
        $('#myVideo').get(0).load()
        document.getElementById('myVideo').play()

        $('#myAudio').attr('src', launcherConfigs.fallbackAudio)
        $('#myAudio').prop('volume', 0.1)


        if (localStorage.getItem('audio') == null) {
            localStorage.setItem('audio', 'on')
        }

        if (localStorage.getItem('audio') == 'on') {
            document.getElementById('myAudio').play()
        } else {
            $('#audioIcon').removeClass('fa-volume-up')
            $('#audioIcon').addClass('fa-volume-mute')
        }

        $('#audioControll').click(toogleAudio)

        initNews()
        refreshServerStatus()
        /**
         * FPS DEBUG
         */

       /* meter = new FPSMeter()
        meter.hide()

        refreshLoop(meter)*/

/*
    } else if (document.readyState === 'complete') {


        //document.getElementById('launch_details').style.maxWidth = 266.01
        /*document.getElementById('launch_progress').style.width = "90%"
        document.getElementById('launch_details_right').style.width = "90%"
        document.getElementById('launch_progress_label').style.width = 53.21*/

  /*  }

}, false)*/

function toogleAudio(){
    if(localStorage.getItem('audio') == 'on'){
        $('#audioIcon').removeClass('fa-volume-up')
        $('#audioIcon').addClass('fa-volume-mute')
        document.getElementById('myAudio').pause()
        localStorage.setItem('audio', 'off')
    }else{
        $('#audioIcon').removeClass('fa-volume-mute')
        $('#audioIcon').addClass('fa-volume-up')
        document.getElementById('myAudio').play()
        localStorage.setItem('audio', 'on')
    }
}

function refreshLoop(meter) {
    window.requestAnimationFrame(() => {
        meter.tickStart()

        const now = performance.now()
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift()
        }
        times.push(now)
        fps = times.length
        meter.tick()
        refreshLoop(meter)
    })
}


/**
 * Open web links in the user's default browser.
 */
$(document).on('click', 'a[href^="http"]', function (event) {
    event.preventDefault()
    shell.openExternal(this.href)
})

/**
 * Opens DevTools window if you hold (ctrl + shift + i).
 * This will crash the program if you are using multiple
 * DevTools, for example the chrome debugger in VS Code.
 */
document.addEventListener('keydown', function (e) {
    if ((e.key === 'I' || e.key === 'i') && e.ctrlKey && e.shiftKey) {
        let window = remote.getCurrentWindow()
        window.toggleDevTools()
    }
})



