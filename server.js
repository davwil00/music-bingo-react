const express = require('express')
const path = require('path')
const app = express()
const MongoClient = require('mongodb').MongoClient
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const Db = require('./express/db')
const Spotify = require('./express/Spotify')
const ws = require('./express/websockets')

const db_uri = `mongodb+srv://bingo:${process.env.DB_PASSWORD}@bingo-oga25.mongodb.net/test?retryWrites=true&w=majority`
const port = process.env.PORT || 8001

app.use(express.static(path.join(__dirname, 'build')))
app.use(cookieParser())
app.use(bodyParser.json());

app.get('/ping', function (req, res) {
    return res.send('pong')
})

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

function getConnection() {
    return new MongoClient(db_uri, {useNewUrlParser: true, useUnifiedTopology: true})
}

getConnection().connect((err, client) => {
    const db = new Db(client)
    app.locals.db = db
    app.locals.spotify = new Spotify(db)
    app.locals.ws = ws

    const apiRoutes = require('./express/apiRoutes')
    const loginRoutes = require('./express/loginRoutes')

    app.use('/api', apiRoutes)
    app.use('/api/login', loginRoutes)

    app.listen(port)
    console.log(`App started on port ${port}`)
}) //).finally(() => client.close())
