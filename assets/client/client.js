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

function preload ()
{

    this.load.spritesheet('dude',
        'img/dude.png',
        { frameWidth: 60, frameHeight: 74 }
    )

}

let player;

function create ()
{

    player = this.physics.add.sprite(100, 450, 'dude')

    player.setCollideWorldBounds(true) 

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    }) 

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    }) 

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    }) 

}

function update ()
{

    // Mouvement effectué grâce au clavier
    cursors = this.input.keyboard.createCursorKeys() 

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160) 

        player.anims.play('left', true) 
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160) 

        player.anims.play('right', true) 
    }
    else 
    {
        player.setVelocityX(0)

        player.anims.play('turn') 
    }

    if (cursors.up.isDown)
    {
        player.setVelocityY(-160) 
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(160)
    }
    else 
    {
        player.setVelocityY(0)
    }

}