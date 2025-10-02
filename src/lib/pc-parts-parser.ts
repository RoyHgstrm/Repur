// HOW: We import the raw JSON data directly from the filesystem.
// WHY: Using standard JSON files simplifies the build process, as Next.js has built-in support for it, removing the need for custom loaders.
import cpuData from "~/data/parts/cpu.json";
import gpuData from "~/data/parts/video-card.json";

// HOW: Defines the basic structure for any PC part.
// WHY: Ensures that every part has a name and a price, providing a consistent base for all components.
export interface BasePart {
	id: string;
	name: string;
	price: number | null;
}

// HOW: Creates a flexible type that includes all possible part details.
// WHY: Allows the parsePCParts function to be generic and work with different part types while still having type safety.
export type PartWithOptionalDetails = BasePart & {
	memory?: number;
	core_count?: number;
	microarchitecture?: string;
	chipset?: string;
	core_clock?: number;
	boost_clock?: number | null;
	color?: string;
	length?: number;
	generation?: string;
	tdp?: number;
	graphics?: string | null;
};

// HOW: Extends the BasePart interface with CPU-specific attributes.
// WHY: Provides a typed structure for CPU data, ensuring data integrity and enabling type-safe operations.
export interface CPUPart extends BasePart {
	core_count: number;
	core_clock: number;
	boost_clock: number | null;
	microarchitecture: string;
	generation?: string;
	tdp: number;
	graphics: string | null;
}

// HOW: Extends the BasePart interface with GPU-specific attributes.
// WHY: Provides a typed structure for GPU data, crucial for accurate calculations and display.
export interface GPUPart extends BasePart {
	chipset: string;
	memory: number;
	core_clock: number;
	boost_clock: number | null;
	color: string;
	length: number;
	generation?: string;
}

// HOW: Extracts a generation or series string from a part's name or chipset using regex.
// WHY: Standardizes the generation identifier, which is essential for grouping and comparing parts from different product lines.

// HOW: Filters and enhances a list of parts based on provided criteria.
// WHY: This function serves as the core data processing pipeline, ensuring that only valid and relevant parts are used in the application logic.
export function parsePCParts<T extends BasePart>(partData: T[]): T[] {
	const partsWithIds = partData.map((part) => ({
		...part,
		id: part.id || `${part.name}-${Math.random().toString(36).substr(2, 9)}`,
	}));

	const validParts = partsWithIds.filter((part) => part.price !== null);

	return validParts.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
}

// HOW: Loads CPU and GPU data from the imported JSON files and processes them.
// WHY: This function acts as the main entry point for accessing component data, abstracting the data source from the UI. It's async to allow for future data fetching from an API.
export async function loadAllParts() {
	return {
		cpus: parsePCParts<CPUPart>(cpuData as CPUPart[]),
		gpus: parsePCParts<GPUPart>(gpuData as GPUPart[]),
	};
}
