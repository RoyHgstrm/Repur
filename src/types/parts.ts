/**
 * @fileoverview This file contains TypeScript type definitions for the CPU and GPU parts data
 * loaded from JSON files. This ensures type safety when accessing properties of these parts,
 * preventing 'any' inference and improving static analysis.
 */

/**
 * @interface Part
 * @description Defines the base structure for a generic computer part.
 *
 * @property {string} name - The name of the part.
 * @property {number | null} price - The price of the part, or null if not available.
 * @property {any} [key: string] - Allows for additional, unspecified properties.
 */
export interface Part {
  name: string;
  price: number | null;
  [key: string]: any;
}

/**
 * @interface CpuPart
 * @description Defines the structure for a CPU part object, mirroring the schema found in `cpu.json`.
 *
 * @property {string} name - The name of the CPU.
 * @property {number | null} price - The price of the CPU, or null if not available.
 * @property {number} core_count - The number of cores in the CPU.
 * @property {number} core_clock - The base clock speed of the CPU in GHz.
 * @property {number | null} boost_clock - The boost clock speed of the CPU in GHz, or null if not available.
 * @property {string} microarchitecture - The microarchitecture of the CPU (e.g., "Zen 5", "Raptor Lake Refresh").
 * @property {number} tdp - The Thermal Design Power (TDP) of the CPU in watts.
 * @property {string | null} graphics - The integrated graphics of the CPU, or null if none.
 */
export interface CpuPart {
  name: string;
  price: number | null;
  core_count: number;
  core_clock: number;
  boost_clock: number | null;
  microarchitecture: string;
  tdp: number;
  graphics: string | null;
}

/**
 * @interface GpuPart
 * @description Defines the structure for a GPU part object, mirroring the schema found in `video-card.json`.
 *
 * @property {string} name - The name of the GPU.
 * @property {number | null} price - The price of the GPU, or null if not available.
 * @property {string} chipset - The chipset of the GPU (e.g., "GeForce RTX 3060 12GB").
 * @property {number} memory - The video memory (VRAM) of the GPU in GB.
 * @property {number} core_clock - The base core clock speed of the GPU in MHz.
 * @property {number | null} boost_clock - The boost core clock speed of the GPU in MHz, or null if not available.
 * @property {string | null} color - The color of the GPU, or null if not specified.
 * @property {number | null} length - The length of the GPU in millimeters, or null if not available.
 */
export interface GpuPart {
  name: string;
  price: number | null;
  chipset: string;
  memory: number;
  core_clock: number;
  boost_clock: number | null;
  color: string | null;
  length: number | null;
}

// Declare modules for JSON files to provide type inference
declare module '*.json' {
  const value: any; // Fallback for other JSONs
  export default value;
}

declare module '@/data/parts/cpu.json' {
  const value: CpuPart[];
  export default value;
}

declare module '@/data/parts/video-card.json' {
  const value: GpuPart[];
  export default value;
}