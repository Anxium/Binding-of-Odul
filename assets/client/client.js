// PHASER
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}
const game = new Phaser.Game(config)

function preload() {

    this.load.image("tiles", "img/tilesets/tiles_ju.png")
    this.load.image("bullet", "img/bullet.png")

    this.load.spritesheet('dude',
        'img/odul.png',
        { frameWidth: 37, frameHeight: 60, }
    )

}

let groundLayer
let stuffLayer
let map = []
let dungeon = []
let self = null
let level = 0

function create() {

    this.socket = io()

    level++

    this.socket.on('map', dungeon => {

        this.dungeon = dungeon

        console.log(this.dungeon)

        // Creating a blank tilemap with dimensions matching the dungeon
        map = this.make.tilemap({
            tileWidth: 78,
            tileHeight: 78,
            width: dungeon.width,
            height: dungeon.height
        })
        const tileset = map.addTilesetImage("tiles", null, 78, 78, 1, 2)
        groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
        stuffLayer = map.createBlankDynamicLayer("Stuff", tileset)

        // const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);
        // this.tilemapVisibility = new TilemapVisibility(shadowLayer);

        // Use the array of rooms generated to place tiles in the map
        // Note: using an arrow function here so that "this" still refers to our scene
        this.dungeon.rooms.forEach(room => {
            const { x, y, width, height, left, right, top, bottom } = room

            // Fill the floor with mostly clean tiles
            groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR)

            // Place the room corners tiles
            groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top)
            groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top)
            groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom)
            groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom)

            // Fill the walls with mostly clean tiles
            groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP)
            groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM)
            groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT)
            groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT)

            // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
            // room's location. Each direction has a different door to tile mapping.
            
            const doors = []

            // find all the doors and add their positions to the list
            for (let y = 0; y < room.height; y++) {
                for (let x = 0; x < room.width; x++) {
                    if (room.tiles[y][x] == 3) {
                        doors.push({ x: x, y: y });
                    }
                }
            }

            console.log(doors)

            for (let i = 0; i < doors.length; i++) {
                if (doors[i].y === 0) {
                    groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y)
                } else if (doors[i].y === room.height - 1) {
                    groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y)
                } else if (doors[i].x === 0) {
                    groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1)
                } else if (doors[i].x === room.width - 1) {
                    groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1)
                }
            }

            

        })

        // Separate out the rooms into:
        //  - The starting room (index = 0)
        //  - A random room to be designated as the end room (with stairs and nothing else)
        //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
        const rooms = this.dungeon.rooms.slice();
        const startRoom = rooms.shift();
        const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
        const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length);

        // Place the stairs
        stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

        // Place stuff in the 90% "otherRooms"
        otherRooms.forEach(room => {

        //    const rand = Math.random();
            const rand = 1
            
            if (rand <= 0.25) {
                // 25% chance of chest
                stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
            } else if (rand <= 0.5) {
                // 50% chance of a pot anywhere in the room... except don't block a door!
                const x = Phaser.Math.Between(room.left + 2, room.right - 2);
                const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
                stuffLayer.weightedRandomize(x, y, 1, 1, TILES.OBSTACLE);
            } else {
                // 25% of either 2 or 4 towers, depending on the room size
                if (room.height >= 9) {
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX - 2, room.centerY + 2);
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX + 2, room.centerY + 2);
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX - 2, room.centerY - 2);
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX + 2, room.centerY - 2);
                } else {
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX - 2, room.centerY - 2);
                    stuffLayer.putTilesAt(TILES.OBSTACLE, room.centerX + 2, room.centerY - 2);
                }
            }

        });

        // Not exactly correct for the tileset since there are more possible floor tiles, but this will
        // do for the example.
        groundLayer.setCollisionByExclusion([-1, 12, 3, 4, 5, 6, 14, 15, 16, 17, 20, 18])
        stuffLayer.setCollisionByExclusion([-1, 12, 3, 4, 5, 6, 14, 15, 16, 17, 20, 18])

    })

    self = this
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', (players) => {
        Object.keys(players).forEach(id => {
            if (players[id].playerId === self.socket.id) {
                // Place the player in the center of the map. This works because the Dungeon generator places the first room in the center of the map.
                self.player = self.physics.add.sprite((map.widthInPixels / 2) + 50, map.heightInPixels / 2, 'dude')

                // Watch the player and layer for collisions, for the duration of the scene:
                self.physics.add.collider(self.player, groundLayer)
                self.physics.add.collider(self.player, stuffLayer)

                // Phaser supports multiple cameras, but you can access the default camera like this:
                const camera = this.cameras.main
                camera.startFollow(self.player)
                camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

            }
            else {
                // Place the player in the center of the map. This works because the Dungeon generator places the first room in the center of the map.
                const otherPlayer = self.physics.add.sprite(map.widthInPixels / 2, map.heightInPixels / 2, 'dude')

                otherPlayer.playerId = players[id].playerId
                self.otherPlayers.add(otherPlayer)

            }
        })
    })

    this.socket.on('newPlayer', (playerInfo) => {
        // Place the player in the center of the map. This works because the Dungeon generator places the first room in the center of the map.
        const otherPlayer = self.physics.add.sprite(map.widthInPixels / 2, map.heightInPixels / 2, 'dude')

        otherPlayer.playerId = playerInfo.playerId;
        self.otherPlayers.add(otherPlayer);

    })

    this.socket.on('disconnect', (playerId) => {
        self.otherPlayers.getChildren().forEach(otherPlayer => {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy()
            }
        })
    })

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    })

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    })

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    })

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('dude', { start: 9, end: 11 }),
        frameRate: 10,
        repeat: -1
    })

    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('dude', { start: 12, end: 13 }),
        frameRate: 10,
        repeat: -1
    })

    this.socket.on('playerMoved', playerInfo => {
        self.otherPlayers.getChildren().forEach(otherPlayer => {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                otherPlayer.anims.play(playerInfo.turn, true)
            }
        });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
}

function update(time, delta) {

    if (self.player) {

        const player = self.player
        let turn = 'turn'

        player.update();

        let left = self.cursors.left.isDown
        let right = self.cursors.right.isDown
        let up = self.cursors.up.isDown
        let down = self.cursors.down.isDown

        if (up && left) {
            player.setVelocityY(-150)
            player.setVelocityX(-150)
            player.anims.play('left', true)
            turn = 'left'
        } else if (up && right) {
            player.setVelocityY(-150)
            player.setVelocityX(150)
            player.anims.play('right', true)
            turn = 'right'
        } else if (up) {
            player.setVelocityY(-150)
            player.setVelocityX(0)
            player.anims.play('up', true)
            turn = 'up'
        } else if (down && left) {
            player.setVelocityY(150)
            player.setVelocityX(-150)
            player.anims.play('left', true)
            turn = 'left'
        } else if (down && right) {
            player.setVelocityY(150)
            player.setVelocityX(150)
            player.anims.play('right', true)
            turn = 'right'
        } else if (down) {
            player.setVelocityY(150)
            player.setVelocityX(0)
            player.anims.play('down', true)
            turn = 'down'
        } else if (left) {
            player.setVelocityY(0)
            player.setVelocityX(-150)
            player.anims.play('left', true)
            turn = 'left'
        } else if (right) {
            player.setVelocityY(0)
            player.setVelocityX(150)
            player.anims.play('right', true)
            turn = 'right'
        } else {
            player.setVelocity(0)
            player.anims.play('turn', true)
            turn = 'turn'
        }

        // // Find the player's room using another helper method from the dungeon that converts from
        // // dungeon XY (in grid units) to the corresponding room instance
        // const playerTileX = groundLayer.worldToTileX(player.x);
        // const playerTileY = groundLayer.worldToTileY(player.y);
        // const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);
        // this.tilemapVisibility.setActiveRoom(playerRoom);

        // emit player movement
        const x = player.x;
        const y = player.y;
        if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y)) {
            this.socket.emit('playerMovement', { x: player.x, y: player.y, turn: turn });
        }

        // save old position data
        player.oldPosition = {
            x: player.x,
            y: player.y,
            turn: turn
        };

    }

}
