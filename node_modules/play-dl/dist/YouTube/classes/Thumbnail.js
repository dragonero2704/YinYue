"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thumbnail = void 0;
class Thumbnail {
    constructor(data) {
        if (!data)
            throw new Error(`Cannot instantiate the ${this.constructor.name} class without data!`);
        this._patch(data);
    }
    _patch(data) {
        if (!data)
            data = {};
        this.id = data.id || undefined;
        this.width = data.width || 0;
        this.height = data.height || 0;
        this.url = data.url || undefined;
    }
    displayThumbnailURL(thumbnailType = "maxresdefault") {
        if (!["default", "hqdefault", "mqdefault", "sddefault", "maxresdefault", "ultrares"].includes(thumbnailType))
            throw new Error(`Invalid thumbnail type "${thumbnailType}"!`);
        if (thumbnailType === "ultrares")
            return this.url;
        return `https://i3.ytimg.com/vi/${this.id}/${thumbnailType}.jpg`;
    }
    defaultThumbnailURL(id) {
        if (!id)
            id = "0";
        if (!["0", "1", "2", "3", "4"].includes(id))
            throw new Error(`Invalid thumbnail id "${id}"!`);
        return `https://i3.ytimg.com/vi/${this.id}/${id}.jpg`;
    }
    toString() {
        return this.url ? `${this.url}` : "";
    }
    toJSON() {
        return {
            id: this.id,
            width: this.width,
            height: this.height,
            url: this.url
        };
    }
}
exports.Thumbnail = Thumbnail;
//# sourceMappingURL=Thumbnail.js.map