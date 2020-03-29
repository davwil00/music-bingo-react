const fs = require('fs')
const axios = require('axios')
const audioconcat = require('audioconcat')
const path = require('path')

exports.downloadTrack = function(url, location) {
    if (fs.existsSync(location)) {
        return Promise.resolve
    }

    const writer = fs.createWriteStream(location)

    return axios({
        url,
        method: 'GET',
        responseType: 'stream'
    }).then(response => {
        response.data.pipe(writer)
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    })
}

exports.createSingleTrack = function(tracks, gameId) {
    return new Promise((resolve, reject) => {
        const targetFile = path.join(fs.realpathSync('./public'), `${gameId}.mp3`)
        if (fs.existsSync(targetFile)) {
            fs.unlinkSync(targetFile)
        }
        audioconcat(tracks).concat(targetFile)
            .on('start', () => console.log('starting to create single track'))
            .on('error', (err, stdout, stderr) => {
                console.error('Error:', err)
                console.error('ffmpeg stderr:', stderr)
                reject('unable to create single track')
            })
            .on('end', resolve)
    })
}
