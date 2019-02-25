import Random from "./random.js";
import Room from "./Room.js";
import TILES from "./tiles.js";
import { debugMap, debugHtmlMap } from "./debug.js";

const defaultConfig = {
  width: 50,
  height: 50,
  randomSeed: undefined,
  doorPadding: 1, // Experimental, minimum number of tiles between a door and a room corner (>= 1)
  rooms: {
    width: { min: 5, max: 15, onlyOdd: false, onlyEven: false },
    height: { min: 5, max: 15, onlyOdd: false, onlyEven: false },
    maxArea: 150,
    maxRooms: 50
  }
};

export default class Dungeon {
  constructor(config = {}) {
    const rooms = config.rooms || {};
    rooms.width = Object.assign({}, defaultConfig.rooms.width, rooms.width);
    rooms.height = Object.assign({}, defaultConfig.rooms.height, rooms.height);
    rooms.maxArea = rooms.maxArea || defaultConfig.rooms.maxArea;
    rooms.maxRooms = rooms.maxRooms || defaultConfig.rooms.maxRooms;

    // Validate room size
    if (rooms.width.min < 3) rooms.width.min = 3;
    if (rooms.height.min < 3) rooms.height.min = 3;
    if (rooms.width.max < rooms.width.min) rooms.width.max = rooms.width.min;
    if (rooms.height.max < rooms.height.min) rooms.height.max = rooms.height.min;

    // Avoid an impossibly small maxArea
    const minArea = rooms.width.min * rooms.height.min;
    if (rooms.maxArea < minArea) rooms.maxArea = minArea;

    this.doorPadding = config.doorPadding || defaultConfig.doorPadding;
    this.width = config.width || defaultConfig.width;
    this.height = config.height || defaultConfig.height;
    this.roomConfig = rooms;
    this.rooms = [];
    this.r = new Random(config.randomSeed);

    // 2D grid matching map dimensions where every element contains an array of all the rooms in
    // that location
    this.roomGrid = [];

    this.generate();
    this.tiles = this.getTiles();
  }

  drawToConsole(config) {
    debugMap(this, config);
  }

  drawToHtml(config) {
    return debugHtmlMap(this, config);
  }

  generate() {
    this.rooms = [];
    this.roomGrid = [];

    for (let y = 0; y < this.height; y++) {
      this.roomGrid.push([]);
      for (let x = 0; x < this.width; x++) {
        this.roomGrid[y].push([]);
      }
    }

    // Seed the map with a starting randomly sized room in the center of the map
    const room = this.createRandomRoom();
    room.setPosition(
      Math.floor(this.width / 2) - Math.floor(room.width / 2),
      Math.floor(this.height / 2) - Math.floor(room.height / 2)
    );
    this.addRoom(room);

    // Continue generating rooms until we hit our cap or have hit our maximum iterations (generally
    // due to not being able to fit any more rooms in the map)
    let i = this.roomConfig.maxRooms * 5;
    while (this.rooms.length < this.roomConfig.maxRooms && i > 0) {
      this.generateRoom();
      i -= 1;
    }

    // // Now we want to randomly add doors between some of the rooms and other rooms they touch
    // for (let i = 0; i < this.rooms.length; i++) {
    //   // Find all rooms that we could connect with this one
    //   const targets = this.getPotentiallyTouchingRooms(this.rooms[i]);
    //   for (let j = 0; j < targets.length; j++) {
    //     // Make sure the rooms aren't already connected with a door
    //     if (!this.rooms[i].isConnectedTo(targets[j])) {
    //       // 20% chance we add a door connecting the rooms
    //       if (Math.random() < 0.2) {
    //         const [door1, door2] = this.findNewDoorLocation(this.rooms[i], targets[j]);
    //         this.addDoor(door1);
    //         this.addDoor(door2);
    //       }
    //     }
    //   }
    // }
  }

  getRoomAt(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    else return this.roomGrid[y][x][0]; // Assumes 1 room per tile, which is valid for now
  }

  getMappedTiles(tileMapping = {}) {
    tileMapping = Object.assign({}, { empty: 0, wall: 1, floor: 2, door: 3 }, tileMapping);
    return this.tiles.map(row =>
      row.map(tile => {
        if (tile === TILES.EMPTY) return tileMapping.empty;
        else if (tile === TILES.WALL) return tileMapping.wall;
        else if (tile === TILES.FLOOR) return tileMapping.floor;
        else if (tile === TILES.DOOR) return tileMapping.door;
      })
    );
  }

  addRoom(room) {
    // if the room won't fit, we don't add it
    if (!this.canFitRoom(room)) return false;

    this.rooms.push(room);

    // Update all tiles in the roomGrid to indicate that this room is sitting on them
    for (let y = room.top; y <= room.bottom; y++) {
      for (let x = room.left; x <= room.right; x++) {
        this.roomGrid[y][x].push(room);
      }
    }

    return true;
  }

  canFitRoom(room) {
    // Make sure the room fits inside the dungeon
    if (room.x < 0 || room.x + room.width > this.width - 1) return false;
    if (room.y < 0 || room.y + room.height > this.height - 1) return false;

    // Make sure this room doesn't intersect any existing rooms
    for (let i = 0; i < this.rooms.length; i++) {
      if (room.overlaps(this.rooms[i])) return false;
    }

    return true;
  }

  createRandomRoom() {
    let width = 0;
    let height = 0;
    let area = 0;

    // Find width and height using min/max sizes while keeping under the maximum area
    const config = this.roomConfig;
    do {
      width = this.r.randomInteger(config.width.min, config.width.max, {
        onlyEven: config.width.onlyEven,
        onlyOdd: config.width.onlyOdd
      });
      height = this.r.randomInteger(config.height.min, config.height.max, {
        onlyEven: config.height.onlyEven,
        onlyOdd: config.height.onlyOdd
      });
      area = width * height;
    } while (area > config.maxArea);

    return new Room(width, height);
  }

  generateRoom() {
    const room = this.createRandomRoom();

    // Only allow 150 tries at placing the room
    let i = 150;
    while (i > 0) {
      // Attempt to find another room to attach this one to
      const result = this.findRoomAttachment(room);

      room.setPosition(result.x, result.y);
      // Try to add it. If successful, add the door between the rooms and break the loop.
      if (this.addRoom(room)) {
        const [door1, door2] = this.findNewDoorLocation(room, result.target);
        this.addDoor(door1);
        this.addDoor(door2);
        break;
      }

      i -= 1;
    }
  }

  getTiles() {
    // Create the full map for the whole dungeon
    const tiles = Array(this.height);
    for (let y = 0; y < this.height; y++) {
      tiles[y] = Array(this.width);
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = TILES.EMPTY;
      }
    }

    // Fill in the map with details from each room
    for (let i = 0; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      for (let y = 0; y < r.height; y++) {
        for (let x = 0; x < r.width; x++) {
          tiles[y + r.y][x + r.x] = r.tiles[y][x];
        }
      }
    }

    return tiles;
  }

  getPotentiallyTouchingRooms(room) {
    const touchingRooms = [];

    // function that checks the list of rooms at a point in our grid for any potential touching
    // rooms
    const checkRoomList = function(x, y, rg) {
      const r = rg[y][x];
      for (let i = 0; i < r.length; i++) {
        // make sure this room isn't the one we're searching around and that it isn't already in the
        // list
        if (r[i] != room && touchingRooms.indexOf(r[i]) < 0) {
          // make sure this isn't a corner of the room (doors can't go into corners)
          const lx = x - r[i].x;
          const ly = y - r[i].y;
          if ((lx > 0 && lx < r[i].width - 1) || (ly > 0 && ly < r[i].height - 1)) {
            touchingRooms.push(r[i]);
          }
        }
      }
    };

    // iterate the north and south walls, looking for other rooms in those tile locations
    for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
      checkRoomList(x, room.y, this.roomGrid);
      checkRoomList(x, room.y + room.height - 1, this.roomGrid);
    }

    // iterate the west and east walls, looking for other rooms in those tile locations
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
      checkRoomList(room.x, y, this.roomGrid);
      checkRoomList(room.x + room.width - 1, y, this.roomGrid);
    }

    return touchingRooms;
  }

  findNewDoorLocation(room1, room2) {
    const door1 = { x: -1, y: -1 };
    const door2 = { x: -1, y: -1 };

    if (room1.y === room2.y - room1.height) {
      // North
      door1.x = door2.x = this.r.randomInteger(
        Math.floor(Math.max(room2.left, room1.left) + this.doorPadding),
        Math.floor(Math.min(room2.right, room1.right) - this.doorPadding)
      );
      door1.y = room1.y + room1.height - 1;
      door2.y = room2.y;
    } else if (room1.x == room2.x - room1.width) {
      // West
      door1.x = room1.x + room1.width - 1;
      door2.x = room2.x;
      door1.y = door2.y = this.r.randomInteger(
        Math.floor(Math.max(room2.top, room1.top) + this.doorPadding),
        Math.floor(Math.min(room2.bottom, room1.bottom) - this.doorPadding)
      );
    } else if (room1.x == room2.x + room2.width) {
      // East
      door1.x = room1.x;
      door2.x = room2.x + room2.width - 1;
      door1.y = door2.y = this.r.randomInteger(
        Math.floor(Math.max(room2.top, room1.top) + this.doorPadding),
        Math.floor(Math.min(room2.bottom, room1.bottom) - this.doorPadding)
      );
    } else if (room1.y == room2.y + room2.height) {
      // South
      door1.x = door2.x = this.r.randomInteger(
        Math.floor(Math.max(room2.left, room1.left) + this.doorPadding),
        Math.floor(Math.min(room2.right, room1.right) - this.doorPadding)
      );
      door1.y = room1.y;
      door2.y = room2.y + room2.height - 1;
    }

    return [door1, door2];
  }

  findRoomAttachment(room) {
    const r = this.r.randomPick(this.rooms);

    let x = 0;
    let y = 0;
    let pad = 2 * this.doorPadding; // 2x padding to account for the padding both rooms need

    // Randomly position this room on one of the sides of the random room.
    switch (this.r.randomInteger(0, 3)) {
      // north
      case 0:
        // x = r.left - (room.width - 1) would have rooms sharing exactly 1x tile
        x = this.r.randomInteger(r.left - (room.width - 1) + pad, r.right - pad);
        y = r.top - room.height;
        break;
      // west
      case 1:
        x = r.left - room.width;
        y = this.r.randomInteger(r.top - (room.height - 1) + pad, r.bottom - pad);
        break;
      // east
      case 2:
        x = r.right + 1;
        y = this.r.randomInteger(r.top - (room.height - 1) + pad, r.bottom - pad);
        break;
      // south
      case 3:
        x = this.r.randomInteger(r.left - (room.width - 1) + pad, r.right - pad);
        y = r.bottom + 1;
        break;
    }

    // Return the position for this new room and the target room
    return {
      x: x,
      y: y,
      target: r
    };
  }

  addDoor(doorPos) {
    // Get all the rooms at the location of the door
    const rooms = this.roomGrid[doorPos.y][doorPos.x];
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];

      // convert the door position from world space to room space
      const x = doorPos.x - r.x;
      const y = doorPos.y - r.y;

      // set the tile to be a door
      r.tiles[y][x] = TILES.DOOR;
    }
  }
}
