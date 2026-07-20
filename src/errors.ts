import logger from "./logger";

export class NotImplemented extends Error {
  /**
   *
   * @param {String} url
   */
  constructor(url = undefined) {
    super(
      url
        ? `This url [${url}] is not supported`
        : `The url provided is not supported`
    );
    this.name = "NotImplemented";
  }
}

export class NoResults extends Error {
  /**
   *
   * @param {String} query
   */
  constructor(query = undefined) {
    super(query ? `0 results found for [${query}]` : "0 results found");
    this.name = "NoResults";
  }
}

export class PlaylistNotFound extends Error {
  /**
   *
   * @param {String} url
   */
  constructor(url = undefined) {
    super(
      url
        ? `Couldn't resolve playlist url [${url}]`
        : "Couldn't resolve playlist url"
    );
    this.name = "PlaylistNotFound";
  }
}

export class VideoNotFound extends Error {
  /**
   *
   * @param {String} url
   */
  constructor(url = undefined) {
    super(
      url
        ? `Couldn't resolve youtube url [${url}]`
        : "Couldn't resolve youtube url"
    );
    this.name = "VideoNotFound";
  }
}
