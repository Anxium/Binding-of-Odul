// PHASER
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
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
        'img/spiderbot.png',
        { frameWidth: 50, frameHeight: 68 }
    )

}

let player 

const TILES = {
    WALL: {
        TOP_LEFT: 0,
        TOP_RIGHT: 2,
        BOTTOM_RIGHT: 24,
        BOTTOM_LEFT: 22,
        TOP: [{ index: 1, weight: 4 }, { index: [25], weight: 1 }],
        LEFT: [{ index: 11, weight: 4 }, { index: [26], weight: 1 }],
        RIGHT: [{ index: 13, weight: 4 }, { index: [27], weight: 1 }],
        BOTTOM: [{ index: 23, weight: 4 }, { index: [28], weight: 1 }]
    },
    FLOOR: [{ index: 12, weight: 6 }, { index: [3, 4, 5, 6, 14, 15, 16, 17], weight: 1 }],
    DOOR: {
        TOP: [1, 12, 1],
        LEFT: [
            [11],
            [12],
            [11]
        ],
        BOTTOM: [23, 12, 23],
        RIGHT: [
            [13],
            [12],
            [13]
        ]
    }
}

function create() {

    const Bullet = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:

        function Bullet (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

            this.speed = Phaser.Math.GetSpeed(400, 1);
        },

        fire: function (x, y)
        {
            this.setPosition(x, y - 50);

            this.setActive(true);
            this.setVisible(true);
        },

        update: function (time, delta)
        {
            this.y -= this.speed * delta;

            if (this.y < -50)
            {
                this.setActive(false);
                this.setVisible(false);
            }
        }

    });

    bullets = this.add.group({
        classType: Bullet,
        maxSize: 10,
        runChildUpdate: true
    });

    this.dungeon = new Dungeon({
        width: 50,
        height: 50,
        doorPadding: 5,
        rooms: {
            width: { min: 12, max: 24 },
            height: { min: 10, max: 16 },
            maxRooms: 8
        }
    }) 

    // Creating a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
        tileWidth: 70,
        tileHeight: 70,
        width: this.dungeon.width,
        height: this.dungeon.height
    })
    const tileset = map.addTilesetImage("tiles", null, 70, 70, 1, 2)
    const groundLayer = map.createBlankDynamicLayer("Ground", tileset)
    const stuffLayer = map.createBlankDynamicLayer("Stuff", tileset)

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
        const doors = room.getDoorLocations()  // → Returns an array of {x, y} objects
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

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    groundLayer.setCollisionByExclusion([12, 3, 4, 5, 6, 14, 15, 16, 17, 20, 18]) 

    // Place the player in the center of the map. This works because the Dungeon generator places the first room in the center of the map.
    // 
    player = this.physics.add.sprite(map.widthInPixels / 2, map.heightInPixels / 2, 'dude')

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 20,
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
        frameRate: 20,
        repeat: -1
    })

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('dude', { start: 9, end: 12 }),
        frameRate: 20,
        repeat: -1
    })

    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('dude', { start: 14, end: 17 }),
        frameRate: 20,
        repeat: -1
    })

    // Watch the player and layer for collisions, for the duration of the scene:
    this.physics.add.collider(player, groundLayer) 

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main 
    camera.startFollow(player) 
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

}

function update() {

    // Mouvement effectué grâce au clavier
    cursors = this.input.keyboard.createCursorKeys()

    if (cursors.left.isDown) {
        player.setVelocityX(-160)

        player.anims.play('left', true)
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160)

        player.anims.play('right', true)
    }
    else if (cursors.up.isDown) {
        player.setVelocityY(-160)

        player.anims.play('up', true)
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(160)

        player.anims.play('down', true)
    }
    else {
        player.setVelocity(0)

        player.anims.play('turn')
    }

    if (cursors.space.isDown)
    {
        const bullet = bullets.get();

        if (bullet)
        {
            bullet.fire(player.x, player.y);
        }
    }
}