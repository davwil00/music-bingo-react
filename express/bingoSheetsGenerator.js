const _ = require('underscore')

const tracksPerSheet = 15

const generateBingoSheets = function(tracks, noOfSheets) {
    console.log('Generating bingo sheets')
    const bingoSheets = new Set()
    for (let i = 0; i < noOfSheets; i++) {
        bingoSheets.add(_.sample(tracks, tracksPerSheet))
    }

    return bingoSheets
}

/**
 * @param bingoSheets Set<Track>
 * @param tracks Array<Track>
 */
const simulatePlay = function(bingoSheets, tracks) {
    const winners = []
    const numberOfTrackMatches = {}

    tracks.forEach(track => {
        const winnersInRounds = []
        bingoSheets.forEach((sheet, sheetNum) => {
            if (sheet.some(sheetTrack => sheetTrack.id === track.id)) {
                numberOfTrackMatches[sheetNum] ? numberOfTrackMatches[sheetNum] += 1 : numberOfTrackMatches[sheetNum] = 1
                if (numberOfTrackMatches[sheetNum] === tracksPerSheet) {
                    winnersInRounds.push(sheetNum)
                }
                winners.push(winnersInRounds)
            }
        })
    })

    return winners
}

const createSheetsForGame = function(playlist, noOfSheets) {
    let success = false
    let attemptNo = 1
    let bingoSheets

    console.log('Creating sheets for game')

    while (!success) {
        console.log(`Attempt #${attemptNo}`)
        bingoSheets = generateBingoSheets(playlist.tracks, noOfSheets)
        const winnersInRounds = simulatePlay(bingoSheets, playlist.tracks)
        const winnersInRoundsWithWins = winnersInRounds.filter(round => round.length > 0)
        success = true
        for (let winners in winnersInRoundsWithWins.slice(0, 3)) {
            if (winners.length > 1) {
                success = false
                break
            }
        }
        attemptNo++
    }

    return bingoSheets
}

module.exports = {createSheetsForGame}
