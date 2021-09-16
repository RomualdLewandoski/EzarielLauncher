const fetch = require('node-fetch')
const logger = require('./loggerutil')('%c[LauncherCFG]', 'color: #a02d2a; font-weight: bold')

let launcherConfigs = null


exports.loadLauncherSettings = async function () {
    logger.log('Collecting launcher config file')

    //step1 getJson from github
    let fallbackJson
    await fetch('https://raw.githubusercontent.com/RomualdLewandoski/ezarielLauncherConfig/main/config.json')
        .then(res => res.json())
        .then(json => fallbackJson = json)
    //step2 we need to check if we can reach the siteConfig link
    await fetch(fallbackJson.siteConfig)
        .then(checkStatus)

    function checkStatus(res) {
        if (res.ok) {
            launcherConfigs = res.json()
        } else {
            launcherConfigs = fallbackJson
        }
    }
}

exports.getConfig = function () {
    return launcherConfigs
}