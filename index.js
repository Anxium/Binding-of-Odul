const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const pug = require('pug')
const Dungeon = require('@mikewesthad/dungeon')

// AUTRE
app.set('view engine', 'pug')

// STATIC
app.use(express.static('./assets'))
app.use(express.static('./node_modules/phaser/dist'))
app.use(express.static('./node_modules/socket.io-client'))
app.use(express.static('./node_modules/@mikewesthad/dungeon/dist'))

// ROUTES
app.get('/', (req, res) => res.render('index'))

// MAP
const dungeon = new Dungeon({
    width: 80,
    height: 80,
    doorPadding: 4,
    rooms: {
        width: { min: 8, max: 22, onlyOdd: true },
        height: { min: 8, max: 14, onlyOdd: true },
        maxRooms: 2
    }
})

// EVENTS
const players = {}

io.on('connection', (socket) => {
    socket.emit('map', dungeon)
    // create a new player and add it to our players object
    players[socket.id] = {
        playerId: socket.id,
    }
    socket.emit('currentPlayers', players) // send the players object to the new player
    socket.broadcast.emit('newPlayer', players[socket.id]) // update all other players of the new player
    console.log('INFO: a player connected')

    socket.on('disconnect', () => {
        delete players[socket.id] // remove this player from our players object
        io.emit('disconnect', socket.id) // emit a message to all players to remove this player
        console.log('INFO: a player disconnected')
    })

    // when a player moves, update the player data
    socket.on('playerMovement', movementData => {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].turn = movementData.turn;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

})

// Propulse le serveur sur le port choisi
const port = 3000
http.listen(process.env.PORT || port, () => console.log(`Serveur propulsé sur le port ${port}`))