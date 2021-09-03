import { ParseSearchInterface } from "./utils/parser";
import { Video } from "./classes/Video";
import { Channel } from "./classes/Channel";
import { PlayList } from "./classes/Playlist";
export declare function search(search: string, options?: ParseSearchInterface): Promise<(Video | Channel | PlayList)[]>;
//# sourceMappingURL=search.d.ts.map