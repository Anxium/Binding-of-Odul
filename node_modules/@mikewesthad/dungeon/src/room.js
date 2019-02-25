import TILES from "./tiles.js";

export default class Room {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.setPosition(0, 0);

    this.doors = [];
    this.tiles = [];

    // Surround the room with walls, and fill the rest with floors.
    for (var y = 0; y < this.height; y++) {
      var row = [];
      for (var x = 0; x < this.width; x++) {
        if (y == 0 || y == this.height - 1 || x == 0 || x == this.width - 1) {
          row.push(TILES.WALL);
        } else {
          row.push(TILES.FLOOR);
        }
      }
      this.tiles.push(row);
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.left = x;
    this.right = x + (this.width - 1);
    this.top = y;
    this.bottom = y + (this.height - 1);
    this.centerX = x + Math.floor(this.width / 2);
    this.centerY = y + Math.floor(this.height / 2);
  }

  getDoorLocations() {
    var doors = [];

    // find all the doors and add their positions to the list
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        if (this.tiles[y][x] == TILES.DOOR) {
          doors.push({ x: x, y: y });
        }
      }
    }

    return doors;
  }

  overlaps(otherRoom) {
    if (this.right < otherRoom.left) return false;
    else if (this.left > otherRoom.right) return false;
    else if (this.bottom < otherRoom.top) return false;
    else if (this.top > otherRoom.bottom) return false;
    else return true;
  }

  isConnectedTo(otherRoom) {
    // iterate the doors in room1 and see if any are also a door in room2
    var doors = this.getDoorLocations();
    for (var i = 0; i < doors.length; i++) {
      var d = doors[i];

      // move the door into "world space" using room1's position
      d.x += this.x;
      d.y += this.y;

      // move the door into room2 space by subtracting room2's position
      d.x -= otherRoom.x;
      d.y -= otherRoom.y;

      // make sure the position is valid for room2's tiles array
      if (d.x < 0 || d.x > otherRoom.width - 1 || d.y < 0 || d.y > otherRoom.height - 1) {
        continue;
      }

      // see if the tile is a door; if so this is a door from room1 to room2 so the rooms are connected
      if (otherRoom.tiles[d.y][d.x] == TILES.DOOR) {
        return true;
      }
    }

    return false;
  }
}
