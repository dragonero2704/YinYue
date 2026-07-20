import { search } from "play-dl";

export interface SearchOptions {
  limit?: number;
  source?: {
    youtube?: "video" | "playlist" | "channel";
    spotify?: "album" | "playlist" | "track";
    soundcloud?: "tracks" | "playlists" | "albums";
    deezer?: "track" | "playlist" | "album";
  };
  fuzzy?: boolean;
  language?: string;
  /**
   * !!! Before enabling this for public servers, please consider using Discord features like NSFW channels as not everyone in your server wants to see NSFW images. !!!
   * Unblurred images will likely have different dimensions than specified in the {@link YouTubeThumbnail} objects.
   */
  unblurNSFWThumbnails?: boolean;
}

const cache: { [key: string]: any } = {};

const cachekey = (slug: string, options: SearchOptions) => {
  // extra logic to convert a query to a cache key
  return slug;
};

export async function searchWrapper(query: string, options: SearchOptions, cacheTTL:number = 60 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const cachedVal = cache[cachekey(query, options)];
    if (cachedVal) return resolve(cachedVal);
    search(query, options)
      .catch(reject)
      .then((value) => {
        if (!value) reject("No results");
        // add value to cache
        const key = cachekey(query, options)
        cache[key] = value;
        // set cache deletion timeout
        setTimeout(()=>{delete cache[key]}, cacheTTL)
      });
  });
}
