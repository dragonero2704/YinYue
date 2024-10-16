// const song = {
//     url: video.url,
//     title: video.title,
//     thumbnailUrl: video.thumbnails[0].url,
//     duration: video.durationInSec,
//     durationRaw: video.durationRaw,
//   };

class Song {
  /**
   *
   * @param {string} url
   * @param {string} title
   * @param {string} author
   * @param {string} thumbnailUrl
   * @param {string} duration
   * @param {number} durationRaw
   */
  constructor(url, title, author, thumbnailUrl, durationText, durationRaw) {
    this.url = url;
    this.title = title;
    this.author = author;
    this.thumbnailUrl = thumbnailUrl;
    this.durationText = durationText;
    this.durationRaw = durationRaw;
  }

  toString()
  {
    return `${title}\t${this.durationText}`
  }
}

module.exports = Song;
