"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
class Channel {
    constructor(data) {
        if (!data)
            throw new Error(`Cannot instantiate the ${this.constructor.name} class without data!`);
        this._patch(data);
    }
    _patch(data) {
        if (!data)
            data = {};
        this.name = data.name || null;
        this.verified = !!data.verified || false;
        this.id = data.id || null;
        this.url = data.url || null;
        this.icon = data.icon || { url: null, width: 0, height: 0 };
        this.subscribers = data.subscribers || null;
    }
    /**
     * Returns channel icon url
     * @param {object} options Icon options
     * @param {number} [options.size=0] Icon size. **Default is 0**
     */
    iconURL(options = { size: 0 }) {
        var _a;
        if (typeof options.size !== "number" || options.size < 0)
            throw new Error("invalid icon size");
        if (!((_a = this.icon) === null || _a === void 0 ? void 0 : _a.url))
            return undefined;
        const def = this.icon.url.split("=s")[1].split("-c")[0];
        return this.icon.url.replace(`=s${def}-c`, `=s${options.size}-c`);
    }
    get type() {
        return "channel";
    }
    toString() {
        return this.name || "";
    }
    toJSON() {
        return {
            name: this.name,
            verified: this.verified,
            id: this.id,
            url: this.url,
            iconURL: this.iconURL(),
            type: this.type,
            subscribers: this.subscribers
        };
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.js.map