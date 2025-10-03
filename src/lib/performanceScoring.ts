/**
 * @comment
 * This module provides a comprehensive system for scoring PC component performance,
 * normalizing component names, and categorizing overall system performance into tiers.
 * The goal is to provide accurate, extensible, and marketing-ready performance scores
 * without relying on external benchmarks at runtime.
 * All functions are strongly typed for compile-time safety and clarity.
 */

// =============================================================================
// I. Hardware Database Definitions
// =============================================================================

/**
 * @comment
 * Defines the structure for GPU architecture data.
 * `baseScore`: A baseline performance score for the architecture.
 * `gen`: Generational index, used for slight performance nudges for newer architectures.
 */
interface GpuArchitectureData {
	readonly baseScore: number;
	readonly gen: number;
}

/**
 * @comment
 * Defines explicit scores for specific GPU models.
 * Normalized GPU names map to a score from 0-100.
 *
 * @example
 * rtx4090: 100, rtx4080super: 98
 */
const GPU_SCORES: Readonly<Record<string, number>> = {
	// NVIDIA 40 Series
	rtx4090: 100,
	rtx4080super: 98,
	rtx4080: 95,
	rtx4070tisuper: 92,
	rtx4070ti: 90,
	rtx4070super: 88,
	rtx4070: 85,
	rtx4060ti: 78,
	rtx4060: 75,
	rtx4050: 68,

	// NVIDIA 30 Series
	rtx3090ti: 96,
	rtx3090: 94,
	rtx3080ti: 92,
	rtx3080: 89,
	rtx3070ti: 85,
	rtx3070: 82,
	rtx3060ti: 80,
	rtx3060: 76,

	// AMD 7000 Series
	rx7900xtx: 99,
	rx7900xt: 94,
	rx7800xt: 88,
	rx7700xt: 83,
	rx7600: 76,
	rx7600s: 74,

	// Intel ARC
	a770: 79,
	a750: 74,
	a580: 68,
	a380: 58,

	// Mobile GPUs (keep only entries that don't duplicate desktop keys)
	rtx4090mobile: 92,
	rtx4080mobile: 87,
	rtx4070mobile: 82,
	rx7900m: 86,
	arc370m: 62,
};

/**
 * @comment
 * Defines GPU architectures with their base scores and generational index.
 * Used for adaptive scoring of GPUs not explicitly listed in `GPU_SCORES`.
 * `baseScore`: Pohjajohto (0-100)
 * `gen`: Sukupolven indeksi (korkeampi = uudempi)
 */
const GPU_ARCHITECTURES: Readonly<Record<string, GpuArchitectureData>> = {
	"ada-lovelace": { baseScore: 100, gen: 4 }, // NVIDIA 40-sarja
	ampere: { baseScore: 90, gen: 3 }, // NVIDIA 30-sarja
	rdna3: { baseScore: 98, gen: 3 }, // AMD RX 7000
	rdna2: { baseScore: 88, gen: 2 }, // AMD RX 6000
};

/**
 * @comment
 * Maps normalized GPU brand and series prefixes to their corresponding architectures.
 * This helps in determining the architecture for adaptive scoring.
 *
 * @example
 * 'nvidia:40' -> 'ada-lovelace'
 */
const GPU_SERIES_TO_ARCH: Readonly<
	Record<string, keyof typeof GPU_ARCHITECTURES>
> = {
	"nvidia:40": "ada-lovelace",
	"nvidia:30": "ampere",
	"amd:79": "rdna3", // 7900 series
	"amd:78": "rdna3",
	"amd:77": "rdna3",
	"amd:76": "rdna3",
	"amd:69": "rdna2", // 6900 series
	"amd:68": "rdna2",
	"amd:67": "rdna2",
	"amd:66": "rdna2",
};

/**
 * @comment
 * Defines explicit scores for specific CPU models.
 * Normalized CPU names map to a score from 0-100.
 *
 * @example
 * '14900k': 100, '7950x3d': 100
 */
const CPU_SCORES: Readonly<Record<string, number>> = {
	// Intel 14th Gen
	"14900k": 100,
	"14900": 99,
	"14700k": 96,
	"14700": 95,
	"14600k": 90,
	"14600": 89,
	"14500": 85,
	"14400": 82,

	// AMD 7000 Series
	"7950x3d": 100,
	"7950x": 99,
	"7900x3d": 97,
	"7900x": 96,
	"7800x3d": 98,
	"7700x": 92,
	"7600x": 88,
	"7500f": 85,

	// AMD 5000 Series (Zen 3)
	"5950x": 88,
	"5900x": 87,
	"5800x3d": 85,
	"5800x": 82,
	"5700x": 80,
	"5600x": 78,
	"5600g": 75,

	// Mobile CPUs
	"7945hx": 97,
	"7845hx": 92,
	"7745hx": 88,
	"13980hx": 96,
	"13900h": 90,
	"13700h": 87,
};

/**
 * @comment
 * Defines CPU architectures with their base scores and generational index.
 * Used for adaptive scoring of CPUs not explicitly listed in `CPU_SCORES`.
 * `baseScore`: Peruspistemäärä (0-100)
 * `gen`: Sukupolven indeksi (korkeampi = uudempi)
 */
const CPU_ARCHITECTURES: Readonly<
	Record<string, { baseScore: number; gen: number }>
> = {
	"raptor-lake": { baseScore: 100, gen: 13 }, // Intel 13. sukupolvi
	"alder-lake": { baseScore: 92, gen: 12 }, // Intel 12. sukupolvi
	zen4: { baseScore: 100, gen: 4 }, // AMD Ryzen 7000
	zen3: { baseScore: 92, gen: 3 }, // AMD Ryzen 5000
};

/**
 * @comment
 * Maps normalized CPU brand and generation hints to their corresponding architectures.
 * Helps in determining the architecture for adaptive CPU scoring.
 *
 * @example
 * 'intel:13' -> 'raptor-lake'
 */
const CPU_SERIES_TO_ARCH: Readonly<
	Record<string, keyof typeof CPU_ARCHITECTURES>
> = {
	"intel:14": "raptor-lake", // Käsittelee 14. sukupolven lähellä raptor-lakea
	"intel:13": "raptor-lake",
	"intel:12": "alder-lake",
	"amd:7": "zen4",
	"amd:5": "zen3",
};

/**
 * @comment
 * Defines scoring parameters for RAM (Random Access Memory).
 * Scores are based on capacity, type (DDR3, DDR4, DDR5), and speed.
 */
const RAM_SCORES = {
	/**
	 * @comment
	 * RAM capacity scores in GB.
	 */
	capacity: { 4: 20, 8: 40, 16: 70, 32: 90, 64: 100, 128: 100 } as Readonly<
		Record<number, number>
	>,
	/**
	 * @comment
	 * RAM type scores.
	 */
	type: { ddr3: 0, ddr4: 20, ddr5: 40 } as Readonly<
		Record<"ddr3" | "ddr4" | "ddr5", number>
	>,
	/**
	 * @comment
	 * RAM speed scores for each DDR type.
	 */
	speed: {
		ddr3: { 1333: 0, 1600: 5, 1866: 10, 2133: 15 },
		ddr4: {
			2133: 5,
			2400: 10,
			2666: 15,
			3000: 20,
			3200: 25,
			3600: 30,
			4000: 35,
		},
		ddr5: {
			4800: 20,
			5200: 25,
			5600: 30,
			6000: 35,
			6400: 40,
			7200: 45,
			8000: 50,
		},
	} as Readonly<
		Record<"ddr3" | "ddr4" | "ddr5", Readonly<Record<number, number>>>
	>,
};

/**
 * @comment
 * Defines scoring parameters for Storage.
 * Scores are based on type (HDD, SATA, NVMe, PCIe4, PCIe5) and capacity.
 */
const STORAGE_SCORES = {
	/**
	 * @comment
	 * Storage type scores.
	 */
	type: { hdd: 30, sata: 60, nvme: 90, pcie4: 100, pcie5: 100 } as Readonly<
		Record<"hdd" | "sata" | "nvme" | "pcie4" | "pcie5", number>
	>,
	/**
	 * @comment
	 * Storage capacity scores in GB.
	 */
	capacity: { 256: 20, 512: 40, 1000: 70, 2000: 90, 4000: 100 } as Readonly<
		Record<number, number>
	>,
};

// =============================================================================
// II. Normalization Engine
// =============================================================================

/**
 * @comment
 * Normalizes a component string by converting it to lowercase, removing special characters,
 * and stripping common keywords to make it suitable for lookup in score databases.
 * Preserves important information like DDR types and speeds.
 *
 * @param component - The raw component string (e.g., "NVIDIA GeForce RTX 4080 SUPER 16GB")
 * @param type - The type of component ('gpu', 'cpu', 'ram', 'storage') to apply specific normalization rules.
 * @returns The normalized component string.
 * @how
 * - Converts to lowercase.
 * - Removes non-alphanumeric characters.
 * - Removes common GPU/CPU/RAM/Storage keywords (e.g., "ti", "super", "mobile", "gb").
 * - Specifically preserves DDR types (ddr3, ddr4, ddr5) and memory speeds (e.g., 3200mhz -> 3200).
 * - Converts TB capacities to GB (e.g., "1tb" -> "1000").
 * @why
 * Ensures consistent input format for score lookups, regardless of variations in component naming.
 * This is crucial for accurate matching against predefined score tables and adaptive scoring logic.
 */
const normalizeComponent = (
	component: string | null,
	type: "gpu" | "cpu" | "ram" | "storage",
): string => {
	if (!component) return "";
	let normalized = component.toLowerCase().replace(/[^a-z0-9]/g, ""); // Poista erikoismerkit

	// Yleiset suodattimet
	normalized = normalized.replace(
		/(ti|super|xtx?|max[qp]|mobile|m|oc|boost|edition|processor|cpu|gpu|ram|memory|gb|tb|tb)/g,
		"",
	);
	normalized = normalized.replace(
		/(intel|amd|nvidia|core|ryzen|radeon|ge?force|v[ge]a|uhd|iris|arc)/g,
		"",
	);

	if (type === "ram") {
		// Säilytä DDR-tyyppi (esim. ddr4) ja nopeus (esim. 3200)
		normalized = normalized.replace(/(ddr[345]?)/g, (match) => match);
		normalized = normalized.replace(
			/(\d{3,4})\s*(mhz|mt\/s)/g,
			(match, p1) => p1,
		);
	} else if (type === "storage") {
		// Muunna TB GB:ksi
		normalized = normalized.replace(/(\d+)\s*(gb|tb)/g, (match, p1, p2) =>
			p2 === "tb" ? `${parseInt(p1, 10) * 1000}` : p1,
		);
	}

	// Poista ylimääräiset välilyönnit, jotka syntyivät korvausten seurauksena
	normalized = normalized.replace(/\s+/g, "");

	return normalized;
};

// =============================================================================
// III. Individual Component Scoring Functions
// =============================================================================

/**
 * @comment
 * Calculates a performance score (0-100) for a given GPU.
 * Prioritizes exact matches in `GPU_SCORES`, then uses adaptive scoring based on architecture and series.
 *
 * @param gpu - The normalized GPU string.
 * @returns The performance score (0-100).
 * @how
 * 1. Checks for an exact match in `GPU_SCORES`. If found, returns the predefined score.
 * 2. If no exact match, attempts adaptive scoring:
 *    - Identifies brand (NVIDIA, AMD, Intel) and 4-digit series (e.g., 4090, 7900).
 *    - Maps the brand and series prefix to a known GPU architecture (e.g., 'nvidia:40' -> 'ada-lovelace').
 *    - Applies a `baseScore` from the architecture.
 *    - Calculates a `tierFactor` from the last two digits of the series (e.g., 4090 -> 90 -> 0.9).
 *    - Applies a `genMultiplier` to slightly favor newer generations.
 *    - The adaptive score is `baseScore * tierFactor * genMultiplier`.
 * 3. Clamps the final score between 0 and 100.
 * @why
 * Provides a flexible and robust scoring mechanism that can handle both explicitly defined
 * GPU models and new/unseen models through intelligent adaptive logic, ensuring comprehensive coverage.
 */
const getGpuScore = (gpu: string): number => {
	// 1) Ensin manuaalinen mallitaulukko
	if (GPU_SCORES[gpu]) {
		return GPU_SCORES[gpu];
	}

	// 2) Adaptiivinen pisteytys
	let brand: "nvidia" | "amd" | "intel" | null = null;
	if (gpu.includes("rtx") || gpu.includes("gtx")) brand = "nvidia";
	else if (gpu.includes("rx")) brand = "amd";
	else if (gpu.includes("arc")) brand = "intel";

	const seriesMatch = gpu.match(/(\d{4})/); // Etsi 4-numeroinen sarjanumero
	const seriesNum = seriesMatch ? seriesMatch[1] : "";

	if (!brand || !seriesNum) {
		return 0; // Riittämätön tieto
	}

	const seriesPrefix = seriesNum.slice(0, 2); // Esim. '40' numerosta 4090
	const archKey = `${brand}:${seriesPrefix}`;
	const architecture = GPU_SERIES_TO_ARCH[archKey];

	if (!architecture) {
		return 0; // Tuntematon arkkitehtuurikartta
	}

	const archData = GPU_ARCHITECTURES[architecture];
	// Määrittää tason kahdesta viimeisestä numerosta, esim. 4090 -> 90
	const tierTwo = Number(seriesNum.slice(2));
	const tierFactor = Math.max(0.4, Math.min(1.0, tierTwo / 100)); // Clamp 40%-100%

	// Yksinkertainen sukupolven kerroin: suosii hieman uudempia arkkitehtuureja
	// Ada (gen 4) saa +2%, Ampere (gen 3) on perus
	const genMultiplier = 1.0 + (archData.gen - 3) * 0.02;

	const adaptiveScore = archData.baseScore * tierFactor * genMultiplier;
	return Math.min(100, Math.max(0, Math.round(adaptiveScore)));
};

/**
 * @comment
 * Calculates a performance score (0-100) for a given CPU.
 * Prioritizes exact matches in `CPU_SCORES`, then uses adaptive scoring based on family tier and generation.
 *
 * @param cpu - The normalized CPU string.
 * @returns The performance score (0-100).
 * @how
 * 1. Checks for an exact match in `CPU_SCORES`. If found, returns the predefined score.
 * 2. If no exact match, attempts adaptive scoring:
 *    - Identifies brand (Intel, AMD).
 *    - Determines `familyTier` (e.g., i9/Ryzen 9 -> 90, i7/Ryzen 7 -> 80).
 *    - Extracts generation hint (e.g., '13' from 13900, '7' from 7950).
 *    - Maps brand and generation hint to a CPU architecture (e.g., 'intel:13' -> 'raptor-lake').
 *    - Applies a `baseScore` from the architecture.
 *    - Applies a `tierFactor` based on the family tier.
 *    - Applies `featureMultiplier` for specific CPU features like 'X3D' or mobile variants.
 *    - The adaptive score is `baseScore * tierFactor * featureMultiplier`.
 * 3. Clamps the final score between 0 and 100.
 * @why
 * Provides intelligent CPU scoring that can adapt to a wide range of processors,
 * including those not explicitly listed, by leveraging their brand, family, and generation.
 */
const getCpuScore = (cpu: string): number => {
	// 1) Ensin manuaalinen mallitaulukko
	if (CPU_SCORES[cpu]) {
		return CPU_SCORES[cpu];
	}

	// 2) Adaptiivinen pisteytys
	let brand: "intel" | "amd" | null = null;
	if (/^i[3579]/.test(cpu) || cpu.includes("intel")) brand = "intel";
	else if (cpu.includes("ryzen") || cpu.includes("amd")) brand = "amd";

	// Taso perheestä: i9/Ryzen 9 -> 90, i7/Ryzen 7 -> 80 jne.
	let familyTier = 50; // Oletusarvo
	if (/(i9|ryzen9)/.test(cpu)) familyTier = 90;
	else if (/(i7|ryzen7)/.test(cpu)) familyTier = 80;
	else if (/(i5|ryzen5)/.test(cpu)) familyTier = 60;
	else if (/(i3|ryzen3)/.test(cpu)) familyTier = 40;

	// Sukupolven vihje: Intel käyttää 5-numeroisen mallin kahta ensimmäistä numeroa (esim. 13900 -> 13).
	// AMD käyttää 4-numeroisen ensimmäistä numeroa (esim. 7950 -> 7).
	const digitsMatch = cpu.match(/(\d{4,5})/);
	const rawNum = digitsMatch ? digitsMatch[1] : "";
	let genKey = "";
	if (brand === "intel" && rawNum.length >= 2) {
		genKey = `intel:${rawNum.slice(0, 2)}`;
	} else if (brand === "amd" && rawNum.length >= 1) {
		genKey = `amd:${rawNum.slice(0, 1)}`;
	}

	const architecture = genKey ? CPU_SERIES_TO_ARCH[genKey] : undefined;

	if (!brand || !architecture) {
		return 0; // Tuntematon kartoitus
	}

	const archData = CPU_ARCHITECTURES[architecture];
	const tierFactor = Math.max(0.4, Math.min(1.0, familyTier / 100));

	// Ominaisuudet: X3D- ja mobiilinäppäimet
	const isX3D = cpu.includes("x3d");
	// Tarkistetaan, onko kyseessä mobiilisuoritin, mutta HX-sarjan mobiilisuorittimet ovat lähellä työpöytäsuorittimia
	const isMobile = /(h|u)/.test(cpu) && !/(hx)/.test(cpu);

	let featureMultiplier = 1.0;
	if (isX3D) featureMultiplier *= 1.03; // Pieni bonus X3D-suorittimille
	if (isMobile) featureMultiplier *= 0.96; // Pieni rangaistus ei-HX-mobiilisuorittimille

	const adaptiveScore = archData.baseScore * tierFactor * featureMultiplier;
	return Math.min(100, Math.max(0, Math.round(adaptiveScore)));
};

/**
 * @comment
 * Calculates a performance score (0-100) for RAM (Random Access Memory).
 * Scores are based on capacity (GB), type (DDR3, DDR4, DDR5), and speed (MHz).
 *
 * @param ram - The normalized RAM string (e.g., "32gbddr43200").
 * @returns The performance score (0-100).
 * @how
 * 1. Extracts capacity (GB), type (DDR3/4/5), and speed (MHz) from the normalized string using regex.
 * 2. Retrieves scores for capacity and type from `RAM_SCORES`.
 * 3. Determines speed score by finding the highest matching speed tier for the detected RAM type.
 * 4. Sums capacity, type, and speed scores.
 * 5. Clamps the final score between 0 and 100.
 * @why
 * Provides a granular scoring for RAM, reflecting the impact of each key specification
 * on overall system performance, ensuring a realistic contribution to the total score.
 */
const getRamScore = (ram: string): number => {
	// Etsi kapasiteetti (esim. 32)
	const capacityMatch = ram.match(/(\d+)(?=(?:gb)?(?:ddr[345])?\d{0,4}$)/);
	const capacity = capacityMatch ? parseInt(capacityMatch[1]!, 10) : 0;

	// Etsi tyyppi (esim. ddr4)
	const typeMatch = ram.match(/(ddr[345])/);
	const type: "ddr3" | "ddr4" | "ddr5" = typeMatch
		? (typeMatch[1] as "ddr3" | "ddr4" | "ddr5")
		: "ddr4"; // Oletus DDR4, jos ei löydy

	// Etsi nopeus (esim. 3200)
	const speedMatch = ram.match(/(\d{3,4})(?!\d)/);
	const speed = speedMatch ? parseInt(speedMatch[1]!, 10) : 0;

	const capacityScore = RAM_SCORES.capacity[capacity] || 0;
	const typeScore = RAM_SCORES.type[type] || 0;

	const speedTiers = RAM_SCORES.speed[type];
	let speedScore = 0;

	// Etsi korkein vastaava nopeuspistemäärä
	if (speedTiers) {
		// Järjestä nopeudet laskevaan järjestykseen löytääksesi korkeimman vastaavan tason
		const sortedEntries = Object.entries(speedTiers)
			.map(([key, value]) => ({ speed: parseInt(key, 10), score: value }))
			.sort((a, b) => b.speed - a.speed);

		for (const entry of sortedEntries) {
			if (speed >= entry.speed) {
				speedScore = entry.score;
				break;
			}
		}
	}
	// Palauta kokonaispistemäärä, rajoitettu 0-100
	return Math.min(100, capacityScore + typeScore + speedScore);
};

/**
 * @comment
 * Calculates a performance score (0-100) for Storage.
 * Scores are based on type (HDD, SATA, NVMe, PCIe4, PCIe5) and capacity (GB).
 *
 * @param storage - The normalized storage string (e.g., "1000gbnvme").
 * @returns The performance score (0-100).
 * @how
 * 1. Extracts capacity (GB) from the normalized string.
 * 2. Determines storage type based on keywords (e.g., 'nvme', 'pcie4', 'hdd').
 * 3. Retrieves scores for type and capacity from `STORAGE_SCORES`.
 * 4. Combines type and capacity scores with a weighting (type 70%, capacity 30%).
 * 5. Clamps the final score between 0 and 100.
 * @why
 * Reflects the significant impact of storage technology (SSD vs. HDD, NVMe vs. SATA)
 * on overall system responsiveness and user experience, while also accounting for capacity.
 */
const getStorageScore = (storage: string): number => {
	// Etsi kapasiteetti (esim. 1000)
	const capacityMatch = storage.match(/(\d+)(?=(?:gb|tb)?)/);
	const capacity = capacityMatch ? parseInt(capacityMatch[1]!, 10) : 0;

	// Määritä tallennustyyppi avainsanojen perusteella
	let type: keyof typeof STORAGE_SCORES.type = "sata"; // Oletus SATA
	if (storage.includes("nvme")) type = "nvme";
	if (storage.includes("pcie4")) type = "pcie4";
	if (storage.includes("pcie5")) type = "pcie5";
	if (storage.includes("hdd")) type = "hdd";

	const typeScore = STORAGE_SCORES.type[type] || 0;

	let capacityScore = 0;
	// Järjestä kapasiteetit laskevaan järjestykseen löytääksesi korkeimman vastaavan tason
	const sortedCapacities = Object.entries(STORAGE_SCORES.capacity)
		.map(([key, value]) => ({ capacity: parseInt(key, 10), score: value }))
		.sort((a, b) => b.capacity - a.capacity);

	for (const entry of sortedCapacities) {
		if (capacity >= entry.capacity) {
			capacityScore = entry.score;
			break;
		}
	}
	// Yhdistä tyyppi- ja kapasiteettipisteet painotuksella (tyyppi 70%, kapasiteetti 30%)
	return Math.min(100, typeScore * 0.7 + capacityScore * 0.3);
};

// =============================================================================
// IV. Main Performance Scoring Function
// =============================================================================

/**
 * @comment
 * Defines the input structure for the `computePerformanceScore` function.
 * All properties are optional to allow for flexible input.
 */
interface PerformanceSpecs {
	readonly gpu?: string | null;
	readonly cpu?: string | null;
	readonly ram?: string | null;
	readonly storage?: string | null;
	readonly ramAmount?: string | null; // Alternative format for RAM capacity
	readonly storageType?: string | null; // Alternative format for Storage type
}

/**
 * @comment
 * Computes an overall performance score (0-100) for a PC based on its core components:
 * GPU, CPU, RAM, and Storage. Each component contributes a weighted percentage to the total score.
 * A balance bonus is applied if multiple components are recognized.
 *
 * @param specs - An object containing the specifications of the PC components.
 * @returns The total performance score (0-100).
 * @how
 * 1. Normalizes each component string (GPU, CPU, RAM, Storage) using `normalizeComponent`.
 * 2. Calculates individual scores for each component using `getGpuScore`, `getCpuScore`,
 *    `getRamScore`, and `getStorageScore`.
 * 3. Applies predefined weights to each component's score (GPU 55%, CPU 35%, RAM 7%, Storage 3%).
 * 4. Adds a 'balance bonus' (up to 5 points) based on how many components were successfully recognized and scored.
 * 5. Clamps the final score between 0 and 100.
 * @why
 * Provides a single, consolidated performance metric for a PC, which is useful for
 * categorization, comparison, and marketing. The weighting reflects the typical impact
 * of each component on overall user experience in a gaming/general-use context.
 */
export const computePerformanceScore = (specs: PerformanceSpecs): number => {
	// Normalisoi syötteet
	const normalizedGpu = normalizeComponent(specs.gpu ?? null, "gpu");
	const normalizedCpu = normalizeComponent(specs.cpu ?? null, "cpu");
	const ramSpec = specs.ram || specs.ramAmount || "";
	const normalizedRam = normalizeComponent(ramSpec, "ram");
	const storageSpec = specs.storage || specs.storageType || "";
	const normalizedStorage = normalizeComponent(storageSpec, "storage");

	let totalScore = 0;
	let recognizedComponentsCount = 0;

	// GPU (55% painotus)
	if (normalizedGpu) {
		const gpuScore = getGpuScore(normalizedGpu);
		if (gpuScore > 0) {
			totalScore += gpuScore * 0.55;
			recognizedComponentsCount++;
		} else if (process.env.NODE_ENV === "development") {
			// Konsolivaroitus kehitystilassa tuntemattomista komponenteista
			console.info(
				`[perf-score] Tuntematon näytönohjain: raaka="${specs.gpu}" normalisoitu="${normalizedGpu}"`,
			);
		}
	}

	// CPU (35% painotus)
	if (normalizedCpu) {
		const cpuScore = getCpuScore(normalizedCpu);
		if (cpuScore > 0) {
			totalScore += cpuScore * 0.35;
			recognizedComponentsCount++;
		} else if (process.env.NODE_ENV === "development") {
			console.info(
				`[perf-score] Tuntematon prosessori: raaka="${specs.cpu}" normalisoitu="${normalizedCpu}"`,
			);
		}
	}

	// RAM (7% painotus)
	if (normalizedRam) {
		const ramScore = getRamScore(normalizedRam);
		if (ramScore > 0) {
			totalScore += ramScore * 0.07;
			recognizedComponentsCount++;
		}
	}

	// Storage (3% painotus)
	if (normalizedStorage) {
		const storageScore = getStorageScore(normalizedStorage);
		if (storageScore > 0) {
			totalScore += storageScore * 0.03;
			recognizedComponentsCount++;
		}
	}

	// Tasapainobonus (enintään 5 pistettä)
	// Palkitsee järjestelmiä, joissa useampi komponentti tunnistettiin,
	// mikä viittaa tasapainoisempaan kokoonpanoon.
	const balanceBonus = Math.min(5, recognizedComponentsCount * 1.25);
	totalScore += balanceBonus;

	// Apply 1.25x multiplier to total score to slightly favor higher configurations
	totalScore *= 1.25;

	// Rajoita kokonaispistemäärä välille 0-100
	return Math.min(100, Math.max(0, Math.round(totalScore)));
};

// =============================================================================
// V. Performance Tiering
// =============================================================================

/**
 * @comment
 * Defines the structure for a performance tier.
 * `level`: The name of the performance tier (e.g., 'Elite', 'Pro').
 * `color`: A hex color code associated with the tier for UI representation.
 * `description`: A brief description of the performance level.
 */
export interface PerformanceTier {
	readonly level: "Elite" | "Pro" | "Performance" | "Mainstream" | "Entry";
	readonly color: string;
	readonly description: string;
}

/**
 * @comment
 * Determines the performance tier for a given numerical score.
 * Maps a score (0-100) to a predefined performance level with associated color and description.
 *
 * @param score - The overall performance score (0-100).
 * @returns An object containing the tier level, color, and description.
 * @how
 * Compares the input score against a series of thresholds to assign a tier.
 * Higher scores correspond to higher performance tiers.
 * @why
 * Provides a user-friendly and marketing-ready categorization of PC performance,
 * allowing customers to quickly understand the capabilities of a system.
 */
export const getPerformanceTier = (score: number): PerformanceTier => {
	if (score >= 95)
		return {
			level: "Elite",
			color: "#8b5cf6",
			description: "Äärimmäinen peli-/työasemasuorituskyky",
		};
	if (score >= 85)
		return {
			level: "Pro",
			color: "#ef4444",
			description: "Huippuluokan pelaamista ja tuottavuutta",
		};
	if (score >= 70)
		return {
			level: "Performance",
			color: "#3b82f6",
			description: "Erinomainen 1440p-pelaamiskokemus",
		};
	if (score >= 55)
		return {
			level: "Mainstream",
			color: "#10b981",
			description: "Vankka 1080p-pelaamiskokemus",
		};
	return {
		level: "Entry",
		color: "#6b7280",
		description: "Satunnaiseen pelaamiseen ja tuottavuuteen",
	};
};
