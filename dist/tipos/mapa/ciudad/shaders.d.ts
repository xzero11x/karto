export type Variant = 'main' | 'shadow' | 'pick';
/** Ubicaciones fijas: todas las variantes comparten el mismo VAO. */
export declare const ATTR: {
    readonly pos: 0;
    readonly normal: 1;
    readonly uv: 2;
    readonly info: 3;
    readonly style: 4;
    readonly id: 5;
    readonly color: 2;
    readonly ia: 6;
    readonly ib: 7;
};
export declare function source(kind: 'building' | 'mesh' | 'tree' | 'ground' | 'glow' | 'surface' | 'skirt', variant: Variant): {
    vertex: string;
    fragment: string;
};
