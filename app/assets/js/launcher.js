$(document).on('readystatechange', async () => {
    if (document.readyState === 'interactive') {
        loggerUICore.log('UICore Initializing')

        //bind frame buttons here
        $('.fCb').click(() => {
            const window = remote.getCurrentWindow()
            ipcRenderer.sendSync('close-launcher')
        })

        $('.fRb').click(() => {
            const window = remote.getCurrentWindow()
            if (window.isMaximized()) {
                window.unmaximize()
            } else {
                window.maximize()
            }
            document.activeElement.blur()
        })

        $('.fMb').click(() => {
            const window = remote.getCurrentWindow()
            window.minimize()
            document.activeElement.blur()
        })
        loggerUICore.log('Nav buttons initialized')

        Array.from(document.getElementsByClassName('mediaURL')).map(val => {
            val.addEventListener('click', e => {
                document.activeElement.blur()
            })
        })
    } else if (document.readyState === 'complete') {
        loggerUICore.log('Completely Initialized')

        let fallbackJson
        await fetch('https://launcher.ezariel.eu/launcher')
            .then(res => res.json())
            .then((json) => {
                fallbackJson = json

                launcherConfigs = fallbackJson

                loggerUICore.log('Successfully loaded launcher configurations')
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

                //initNews()
                //refreshServerStatus()
                /**
                 * FPS DEBUG
                 */

                meter = new FPSMeter()
                meter.hide()

                refreshLoop(meter)

                document.getElementById('launch_progress').style.width = '90%'
                document.getElementById('launch_details_right').style.width = '90%'
                document.getElementById('launch_progress_label').style.width = 53.21

                startUI()
            })

    }
})