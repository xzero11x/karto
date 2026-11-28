import { type RoadGraph } from './build';
export declare const VEHICLE_TYPES: readonly ["mototaxi", "moto", "auto"];
export type VehicleType = (typeof VEHICLE_TYPES)[number];
export declare class Traffic {
    private g;
    private cum;
    private length;
    private vehicles;
    private random;
    readonly buffers: Float32Array[];
    constructor(g: RoadGraph);
    private next;
    update(dt: number): void;
}
