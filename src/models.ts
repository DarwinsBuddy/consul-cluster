import { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export interface Coord {
    Adjustment: number,
    Error: number,
    Height: number,
    Vec: number[]
}

export interface Coordinates {
    Node: string,
    Segment: string,
    Coord: Coord
}

export interface V extends SimulationNodeDatum {
    id: string,
    name: string
}

export interface E extends SimulationLinkDatum<V> {
    id: string,
    strength: number
    ping: number
}

export interface Network {
    nodes: V[],
    links: E[]
}