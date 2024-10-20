class Cache {
  /**
   *
   * @param {Object} options
   */
  constructor({ size = 1000, enableKeyTTL = false, keyTimeToLive = 60_000 }) {
    this.registry = new Map();
    this.history = [];
    this.maxSize = size;
    this.keyTimeToLive = keyTimeToLive;
    this.enableKeyTTL = enableKeyTTL;
  }
  /**
   *
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    this.registry.set(key, value);
    this.history.push(key);
    if (this.registry.size > this.maxSize) {
      //removes the element that was added first
      let key = this.history.shift();
      this.registry.delete(key);
    }
    if (this.enableKeyTTL)
      setTimeout(this.delete.bind(this, key), this.keyTimeToLive);
  }
  /**
   *
   * @param {string} key
   */
  delete(key) {
    if (this.registry.delete(key))
      this.history = this.history.filter((e) => e !== key);
  }
  /**
   *
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this.registry.get(key);
  }
  /**
   * Clears the cache
   */
  clear() {
    this.registry.clear();
    this.history = [];
  }
}

module.exports = {
  Cache,
};
