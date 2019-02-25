import Random from "./random";

describe("randomInteger", () => {
  test("should return a number between min and max", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(3, 5))
      .forEach(r => {
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(5);
      });
  });

  test("should return a number between min and max when min > max", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(5, 3))
      .forEach(r => {
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(5);
      });
  });

  test("should return an even number when isEven option is used", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(2, 30, { isEven: true }))
      .forEach(r => {
        expect(r % 2).toBe(0);
      });
  });

  test("should return an even number when isEven option is used and parameters are odd", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(3, 31, { isEven: true }))
      .forEach(r => {
        expect(r % 2).toBe(0);
      });
  });

  test("should return an odd number when isOdd option is used", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(3, 31, { isOdd: true }))
      .forEach(r => {
        expect(r % 2).toBe(1);
      });
  });

  test("should return an odd number when isOdd option is used and parameters are even", () => {
    const r = new Random(0);
    Array(100)
      .map(() => r.randomInteger(2, 30, { isOdd: true }))
      .forEach(r => {
        expect(r % 2).toBe(1);
      });
  });
});
