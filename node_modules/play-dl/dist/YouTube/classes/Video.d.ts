import { Channel } from "./Channel";
import { Thumbnail } from "./Thumbnail";
interface VideoOptions {
    id?: string;
    url?: string;
    title?: string;
    description?: string;
    durationRaw: string;
    durationInSec: number;
    uploadedAt?: string;
    views: number;
    thumbnail?: {
        id: string | undefined;
        width: number | undefined;
        height: number | undefined;
        url: string | undefined;
    };
    channel?: {
        name: string;
        id: string;
        icon: string;
    };
    videos?: Video[];
    type: string;
    ratings: {
        likes: number;
        dislikes: number;
    };
    live: boolean;
    private: boolean;
    tags: string[];
}
export declare class Video {
    id?: string;
    url?: string;
    title?: string;
    description?: string;
    durationRaw: string;
    durationInSec: number;
    uploadedAt?: string;
    views: number;
    thumbnail?: Thumbnail;
    channel?: Channel;
    videos?: Video[];
    likes: number;
    dislikes: number;
    live: boolean;
    private: boolean;
    tags: string[];
    constructor(data: any);
    get type(): "video";
    get toString(): string;
    get toJSON(): VideoOptions;
}
export {};
//# sourceMappingURL=Video.d.ts.map