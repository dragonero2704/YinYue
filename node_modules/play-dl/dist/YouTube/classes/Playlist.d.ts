import { Thumbnail } from "./Thumbnail";
import { Channel } from "./Channel";
import { Video } from "./Video";
export declare class PlayList {
    id?: string;
    title?: string;
    videoCount?: number;
    lastUpdate?: string;
    views?: number;
    url?: string;
    link?: string;
    channel?: Channel;
    thumbnail?: Thumbnail;
    private videos?;
    private fetched_videos;
    private _continuation;
    private __count;
    constructor(data: any, searchResult?: Boolean);
    private __patch;
    private __patchSearch;
    next(limit?: number): Promise<Video[]>;
    fetch(max?: number): Promise<this>;
    get type(): "playlist";
    page(number: number): Video[];
    get total_pages(): number;
    get total_videos(): number;
    toJSON(): {
        id: string | undefined;
        title: string | undefined;
        thumbnail: Thumbnail | undefined;
        channel: {
            name: string | undefined;
            id: string | undefined;
            icon: string | undefined;
        };
        url: string | undefined;
        videos: [] | undefined;
    };
}
//# sourceMappingURL=Playlist.d.ts.map