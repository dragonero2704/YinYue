"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Video = void 0;
class Video {
    constructor(data) {
        var _a, _b;
        if (!data)
            throw new Error(`Can not initiate ${this.constructor.name} without data`);
        this.id = data.id || undefined;
        this.url = `https://www.youtube.com/watch?v=${this.id}`;
        this.title = data.title || undefined;
        this.description = data.description || undefined;
        this.durationRaw = data.duration_raw || "0:00";
        this.durationInSec = (data.duration < 0 ? 0 : data.duration) || 0;
        this.uploadedAt = data.uploadedAt || undefined;
        this.views = parseInt(data.views) || 0;
        this.thumbnail = data.thumbnail || {};
        this.channel = data.channel || {};
        this.likes = ((_a = data.ratings) === null || _a === void 0 ? void 0 : _a.likes) || 0;
        this.dislikes = ((_b = data.ratings) === null || _b === void 0 ? void 0 : _b.dislikes) || 0;
        this.live = !!data.live;
        this.private = !!data.private;
        this.tags = data.tags || [];
    }
    get type() {
        return "video";
    }
    get toString() {
        return this.url || "";
    }
    get toJSON() {
        var _a, _b, _c, _d;
        return {
            id: this.id,
            url: this.url,
            title: this.title,
            description: this.description,
            durationInSec: this.durationInSec,
            durationRaw: this.durationRaw,
            uploadedAt: this.uploadedAt,
            thumbnail: (_a = this.thumbnail) === null || _a === void 0 ? void 0 : _a.toJSON(),
            channel: {
                name: (_b = this.channel) === null || _b === void 0 ? void 0 : _b.name,
                id: (_c = this.channel) === null || _c === void 0 ? void 0 : _c.id,
                icon: (_d = this.channel) === null || _d === void 0 ? void 0 : _d.iconURL()
            },
            views: this.views,
            type: this.type,
            tags: this.tags,
            ratings: {
                likes: this.likes,
                dislikes: this.dislikes
            },
            live: this.live,
            private: this.private
        };
    }
}
exports.Video = Video;
//# sourceMappingURL=Video.js.map