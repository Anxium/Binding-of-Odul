import Dungeon from "./Dungeon";
import TILES from "./tiles";

describe("Dungeon constructor", () => {
  test("should use default config, if none specified", () => {
    const d = new Dungeon();
    expect(d.roomConfig).toMatchObject({
      width: { min: 5, max: 15, onlyOdd: false, onlyEven: false },
      height: { min: 5, max: 15, onlyOdd: false, onlyEven: false },
      maxArea: 150,
      maxRooms: 50
    });
    expect(d.width).toBe(50);
    expect(d.height).toBe(50);
  });

  test("should apply default config values for properties not specified", () => {
    const d = new Dungeon({
      width: 20,
      rooms: {
        width: { min: 2, onlyOdd: true },
        maxArea: 200
      }
    });
    expect(d.roomConfig).toMatchObject({
      width: { min: 3, max: 15, onlyOdd: true, onlyEven: false },
      height: { min: 5, max: 15, onlyOdd: false, onlyEven: false },
      maxArea: 200,
      maxRooms: 50
    });
    expect(d.width).toBe(20);
    expect(d.height).toBe(50);
  });

  test("should ignore maxArea if too small", () => {
    const d = new Dungeon({
      rooms: {
        width: { min: 10, max: 20 },
        height: { min: 10, max: 20 },
        maxArea: 20
      }
    });
    expect(d.roomConfig.maxArea).toBe(100);
  });

  test("should not allow rooms smaller than 3 x 3", () => {
    const d = new Dungeon({
      rooms: {
        width: { min: 0, max: 20 },
        height: { min: -2, max: 20 }
      }
    });
    expect(d.roomConfig.width.min).toBe(3);
    expect(d.roomConfig.height.min).toBe(3);
  });

  test("should not allow room size min less than max", () => {
    const d = new Dungeon({
      rooms: {
        width: { min: 5, max: 4 },
        height: { min: 2, max: 1 }
      }
    });
    expect(d.roomConfig.width.max).toBe(5);
    expect(d.roomConfig.height.max).toBe(3);
  });
});

describe("A dungeon", () => {
  test("should not have doors in the corners of rooms", () => {
    const d = new Dungeon({
      width: 500,
      height: 500,
      rooms: {
        width: { min: 3, max: 11 },
        height: { min: 3, max: 11 },
        maxRooms: 1000
      }
    });
    for (const room of d.rooms) {
      expect(room.tiles[0][0]).not.toBe(TILES.DOOR);
      expect(room.tiles[room.height - 1][0]).not.toBe(TILES.DOOR);
      expect(room.tiles[0][room.width - 1]).not.toBe(TILES.DOOR);
      expect(room.tiles[room.height - 1][room.width - 1]).not.toBe(TILES.DOOR);
    }
  });
});
