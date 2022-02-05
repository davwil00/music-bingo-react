const fs = require('fs')
const axios = require('axios')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

exports.downloadTrack = function(url, trackPath) {
    const mp3Location = trackPath + '.mp3'
    if (fs.existsSync(mp3Location)) {
        return Promise.resolve
    }

    return axios({
        url,
        method: 'GET',
        responseType: 'stream'
    }).then(response => {
        const writer = fs.createWriteStream(mp3Location)
        console.log(`downloading track ${mp3Location}`)
        response.data.pipe(writer)
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    }).catch(err => {
      console.error(err)
    })
}

exports.createSingleTrack = function(tracks, gameId) {
    return new Promise((resolve, reject) => {
        const targetFile = path.join(fs.realpathSync('./public'), `${gameId}.mp3`)
        if (fs.existsSync(targetFile)) {
            fs.unlinkSync(targetFile)
        }
        const concatFile = ffmpeg()
        tracks.forEach(track => concatFile.input(`${track}.mp3`))
        concatFile.mergeToFile(targetFile)
            .on('start', (cmd) => {
                console.log('starting to create single track')
                console.log(cmd)
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error:', err)
                console.error('ffmpeg stderr:', stderr)
                reject('unable to create single track')
            })
            .on('end', () => {
                console.log('Track generated')
                resolve()
            })
    })
}
