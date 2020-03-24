const ObjectId = require('mongodb').ObjectId

module.exports = class Db {
    constructor(client) {
        this.users = client.db("bingo").collection("users")
        this.games = client.db('bingo').collection('games')
    }

    createUser(username, refreshToken, accessToken) {
        return this.users.insertOne({username, refreshToken, accessToken})
    }

    getUser(username) {
        return this.users.findOne({username})
    }

    createGame(name, playlistId) {
        return this.games.insertOne({name, playlistId, players: []})
    }

    getGames() {
        const games = this.games
        return games.find().toArray()
    }

    getGame(gameId) {
        return this.games.findOne({_id: new ObjectId(gameId)})
    }

    addPlayerToGame(gameId, playerId, playerName) {
        return this.games.updateOne({_id: new ObjectId(gameId)}, {
            $push: {
                players: {
                    _id: playerId,
                    name: playerName
                }
            }
        })
    }

    getPlayers(gameId) {
        return this.games.findOne({_id: new ObjectId(gameId)}, {projection: {"players.name": 1}})
    }

    addBingoSheetsToPlayers(assignedBingoSheets) {
        const updates = assignedBingoSheets.map(assignedBingoSheet => {
            return {
                filter: {"players._id": assignedBingoSheet._id},
                update: {
                    $set: {
                        tracks: assignedBingoSheet.bingoSheet
                    }
                }
            }
        })
        return this.games.bulkWrite(updates)
    }

    getTicket(gameId, playerId) {
        return this.games.findOne({"players._id": playerId}, {projection: {"players.tracks": 1}})
    }
}
