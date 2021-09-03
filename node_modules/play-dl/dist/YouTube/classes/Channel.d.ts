export interface ChannelIconInterface {
    url?: string;
    width: number;
    height: number;
}
export declare class Channel {
    name?: string;
    verified?: boolean;
    id?: string;
    url?: string;
    icon?: ChannelIconInterface;
    subscribers?: string;
    constructor(data: any);
    private _patch;
    /**
     * Returns channel icon url
     * @param {object} options Icon options
     * @param {number} [options.size=0] Icon size. **Default is 0**
     */
    iconURL(options?: {
        size: number;
    }): string | undefined;
    get type(): "channel";
    toString(): string;
    toJSON(): {
        name: string | undefined;
        verified: boolean | undefined;
        id: string | undefined;
        url: string | undefined;
        iconURL: string | undefined;
        type: "channel";
        subscribers: string | undefined;
    };
}
//# sourceMappingURL=Channel.d.ts.map