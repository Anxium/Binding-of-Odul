const express = require('express')
const app = express()
const http = require('http').Server(app)
const pug = require('pug')

// AUTRE
app.set('view engine', 'pug')

// STATIC
app.use(express.static('./assets'))
app.use(express.static('./node_modules/phaser/dist'))
app.use(express.static('./node_modules/@mikewesthad/dungeon/dist'))

// ROUTES
app.get('/', (req, res) => res.render('index'))

// Propulse le serveur sur le port choisi
const port = 3000
http.listen(process.env.PORT || port, () => console.log(`Serveur propulsé sur le port ${port}`))