interface formatOptions {
    url?: string;
    sp?: string;
    signatureCipher?: string;
    cipher?: string;
    s?: string;
}
export declare function js_tokens(body: string): string[] | null;
export declare function format_decipher(formats: formatOptions[], html5player: string): Promise<formatOptions[]>;
export {};
//# sourceMappingURL=cipher.d.ts.map