import seedrandom from "seedrandom";

export default class Random {
  constructor(seedValue) {
    this.rng = seedrandom(seedValue);
  }

  randomInteger(min, max, { onlyOdd = false, onlyEven = false } = {}) {
    if (onlyOdd) return this.randomOddInteger(min, max);
    else if (onlyEven) return this.randomEvenInteger(min, max);
    else return Math.floor(this.rng() * (max - min + 1) + min);
  }

  randomEvenInteger(min, max) {
    if (min % 2 !== 0 && min < max) min++;
    if (max % 2 !== 0 && max > min) max--;
    const range = (max - min) / 2;
    return Math.floor(this.rng() * (range + 1)) * 2 + min;
  }

  randomOddInteger(min, max) {
    if (min % 2 === 0) min++;
    if (max % 2 === 0) max--;
    const range = (max - min) / 2;
    return Math.floor(this.rng() * (range + 1)) * 2 + min;
  }

  randomPick(array) {
    return array[this.randomInteger(0, array.length - 1)];
  }
}
