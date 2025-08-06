
// src/app/myy/page.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from '~/components/ui/use-toast';
import { z } from 'zod';
import { api } from '~/trpc/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
import { Progress } from "~/components/ui/progress";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Info, Cpu, MemoryStick, HardDrive, Power, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "~/lib/utils";

import cpusData from "~/data/parts/cpu.json";
import gpusData from "~/data/parts/video-card.json";

type Part = { name: string; price: number | null; };
type CpuPart = Part & { core_count: number; boost_clock: number; microarchitecture: string; };
type GpuPart = Part & { chipset: string; memory: number; };

// #region Pricing Configuration
// This section centralizes all pricing logic variables for easy tuning.
// WHY: Centralizing these values makes it simple for developers to adjust the
//      pricing model without digging through complex code. It's a single source of truth.

const PRICING_CONFIG = {
  REPUR_PURCHASE_FACTOR: 0.6,
  AGE_HEURISTICS: [
    { series: ["50-series", "RTX 50", "Ryzen 9000"], years: 0.5 },
    { series: ["40-series", "RTX 40", "Ryzen 7000"], years: 1.5 },
    { series: ["30-series", "RTX 30", "Ryzen 5000"], years: 3 },
    { series: ["20-series", "RTX 20", "Ryzen 3000"], years: 5 },
    { series: ["10-series", "GTX 10", "Ryzen 2000"], years: 7 },
  ],
  DEFAULT_COMPONENT_AGE: 4,
  COMPONENT_DEPRECIATION: {
    CPU: 0.15,
    GPU: 0.25,
  },
  CONDITION_MULTIPLIERS: {
    "Uusi": 1.0,
    "Kuin uusi": 0.9,
    "Hyvä": 0.8,
    "Tyydyttävä": 0.6,
    "Huono": 0.3,
    "En tiedä": 0.8, // Default to "Hyvä" multiplier if "En tiedä"
  },
  RAM: {
    BASE_VALUE_PER_GB: 2.5,
    TYPE_MULTIPLIER: { DDR4: 1.0, DDR5: 1.5, en_tieda_ram_type: 1.0 },
    SPEED_MULTIPLIER: {
      LOW: 0.9,
      MID: 1.0,
      HIGH: 1.1,
    },
    DEFAULT_GB: 16,
  },
  STORAGE: {
    BASE_VALUE_PER_GB: { SSD: 0.08, HDD: 0.02, en_tieda_storage_type: 0.06 },
    DEFAULT_GB: 512,
  },
  PSU: {
    BASE_VALUE_PER_WATT: 0.05,
    EFFICIENCY_MULTIPLIER: {
      white: 0.8,
      bronze: 0.9,
      silver: 0.95,
      gold: 1.0,
      platinum: 1.1,
      titanium: 1.2,
      en_tieda_psu_efficiency: 0.9,
    },
    DEFAULT_WATTAGE: 650,
  },
};
// #endregion

// #region Pricing Calculation Logic
const getComponentAge = (name: string): number => {
  const lowerName = name.toLowerCase();
  for (const heuristic of PRICING_CONFIG.AGE_HEURISTICS) {
    if (heuristic.series.some(s => lowerName.includes(s))) {
      return heuristic.years;
    }
  }
  return PRICING_CONFIG.DEFAULT_COMPONENT_AGE;
};

const calculatePartValue = (part: Part, type: 'CPU' | 'GPU'): number => {
  const basePrice = part.price ?? 0;
  if (basePrice === 0) return 0;

  const age = getComponentAge(part.name);
  const depreciationRate = PRICING_CONFIG.COMPONENT_DEPRECIATION[type];
  
  const depreciatedValue = basePrice * Math.pow(1 - depreciationRate, age);
  
  return depreciatedValue;
};

const calculateRamValue = (data: FormData): number => {
  console.group("Calculating RAM Value");
  console.log("RAM Data Input:", data.ramSize, data.ramType, data.ramSpeed);
  const size = data.ramSize ? parseInt(data.ramSize, 10) : PRICING_CONFIG.RAM.DEFAULT_GB;
  const type = data.ramType && data.ramType !== 'en_tieda_ram_type' ? data.ramType : 'en_tieda_ram_type';
  const speed = data.ramSpeed ? parseInt(data.ramSpeed, 10) : 3200;

  let speedMultiplier = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.MID;
  if (speed < 3000) speedMultiplier = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.LOW;
  if (speed > 3600) speedMultiplier = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.HIGH;

  const typeKey = type as keyof typeof PRICING_CONFIG.RAM.TYPE_MULTIPLIER;
  const typeMultiplier = PRICING_CONFIG.RAM.TYPE_MULTIPLIER[typeKey] || 1.0;

  const result = size * PRICING_CONFIG.RAM.BASE_VALUE_PER_GB * typeMultiplier * speedMultiplier;
  console.log(`RAM Calculation: Size: ${size}GB, Type: ${type} (x${typeMultiplier}), Speed: ${speed} (x${speedMultiplier}) = ${result}€`);
  console.groupEnd();
  return result;
};

const calculateStorageValue = (data: FormData): number => {
  console.group("Calculating Storage Value");
  console.log("Storage Data Input:", data.storageType, data.storageSize);
  const size = data.storageSize ? parseInt(data.storageSize, 10) : PRICING_CONFIG.STORAGE.DEFAULT_GB;
  const type = data.storageType && data.storageType !== 'en_tieda_storage_type' ? data.storageType : 'en_tieda_storage_type';
  const typeKey = type as keyof typeof PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB;
  const multiplier = PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB[typeKey] || PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB.en_tieda_storage_type;
  const result = size * multiplier;
  console.log(`Storage Calculation: Size: ${size}GB, Type: ${type} (x${multiplier}) = ${result}€`);
  console.groupEnd();
  return result;
};

const calculatePsuValue = (data: FormData): number => {
  console.group("Calculating PSU Value");
  console.log("PSU Data Input:", data.psuWattage, data.psuEfficiency);
  const wattage = data.psuWattage ? parseInt(data.psuWattage, 10) : PRICING_CONFIG.PSU.DEFAULT_WATTAGE;
  const efficiency = data.psuEfficiency && data.psuEfficiency !== 'en_tieda_psu_efficiency' ? data.psuEfficiency : 'en_tieda_psu_efficiency';
  const efficiencyKey = efficiency as keyof typeof PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER;
  const multiplier = PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER[efficiencyKey] || PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER.en_tieda_psu_efficiency;
  const result = wattage * PRICING_CONFIG.PSU.BASE_VALUE_PER_WATT * multiplier;
  console.log(`PSU Calculation: Wattage: ${wattage}W, Efficiency: ${efficiency} (x${multiplier}) = ${result}€`);
  console.groupEnd();
  return result;
};

const calculatePrice = (data: FormData): number | null => {
  console.group("Calculating Total Price");
  console.log("Input FormData for Price Calculation:", data);

  const selectedCpu = (cpusData as CpuPart[]).find(c => c.name === data.cpu);
  const selectedGpu = (gpusData as GpuPart[]).find(g => g.chipset === data.gpu);

  console.log("Selected CPU:", selectedCpu?.name ?? "N/A", "Selected GPU:", selectedGpu?.chipset ?? "N/A");

  // Ensure core components are selected and other required fields are not empty before calculating
  if (!selectedCpu || !selectedGpu || 
      !data.ramSize || !data.ramType || !data.ramSpeed || 
      !data.storageType || !data.storageSize || 
      !data.psuWattage || !data.psuEfficiency) {
    console.log("Missing required components/data for full price calculation. Returning null.");
    console.groupEnd();
    return null;
  }

  const cpuValue = calculatePartValue(selectedCpu, 'CPU');
  const gpuValue = calculatePartValue(selectedGpu, 'GPU');
  const ramValue = calculateRamValue(data);
  const storageValue = calculateStorageValue(data);
  const psuValue = calculatePsuValue(data);

  console.log(`Component Values: CPU: ${cpuValue}€, GPU: ${gpuValue}€, RAM: ${ramValue}€, Storage: ${storageValue}€, PSU: ${psuValue}€`);

  const totalMarketValue = cpuValue + gpuValue + ramValue + storageValue + psuValue;
  console.log("Total Market Value (pre-condition):", totalMarketValue, "€");

  const conditionKey = data.condition as keyof typeof PRICING_CONFIG.CONDITION_MULTIPLIERS;
  // Fallback to 'En tiedä' multiplier if conditionKey is somehow invalid or missing in config
  const conditionMultiplier = PRICING_CONFIG.CONDITION_MULTIPLIERS[conditionKey] || PRICING_CONFIG.CONDITION_MULTIPLIERS["En tiedä"];
  console.log(`Condition: ${data.condition} (Multiplier: ${conditionMultiplier})`);

  const adjustedValue = totalMarketValue * conditionMultiplier;
  console.log("Adjusted Value (after condition):", adjustedValue, "€");

  const finalOffer = adjustedValue * PRICING_CONFIG.REPUR_PURCHASE_FACTOR;
  console.log(`Final Offer (after Repur factor ${PRICING_CONFIG.REPUR_PURCHASE_FACTOR}):`, finalOffer, "€");

  // Return null if the final calculation is NaN (e.g. due to unexpected non-numeric input somewhere)
  const result = isNaN(finalOffer) ? null : Math.round(finalOffer);
  console.log("Final Estimated Price (rounded):", result, "€");
  console.groupEnd();
  return result;
};
// #endregion

// Ensure options are unique and have valid prices, and group them.
const processAndGroupParts = <T extends Part>(
  parts: T[],
  groupingKey: 'name' | 'chipset',
  groupLabelFn: (part: T) => string,
  mainLabelFn: (part: T) => string,
  sortFn?: (a: ComboboxOption, b: ComboboxOption) => number
): ComboboxOption[] => {
  console.group(`Processing and Grouping Parts by ${groupingKey}`);
  console.log("Raw parts input:", parts);

  const seenValues = new Set<string>();
  const groupedOptions: { [key: string]: ComboboxOption[] } = {};

  parts.forEach(part => {
    if (part.price === null || part.price === 0) {
      console.log(`Skipping part (null/zero price): ${part[groupingKey as keyof T] as string}`);
      return; // Skip items with no price
    }

    const value = part[groupingKey as keyof T] as string; // Explicitly cast to string
    if (seenValues.has(value)) {
      console.log(`Skipping duplicate part: ${value}`);
      return; // Skip duplicates
    }
    seenValues.add(value);

    const group = groupLabelFn(part);
    if (!groupedOptions[group]) {
      groupedOptions[group] = [];
    }

    const newOption = {
      id: value,
      value: value,
      label: mainLabelFn(part),
      group: group,
    };
    console.log("Adding option:", newOption);
    groupedOptions[group].push(newOption);
  });

  console.log("Grouped options before flattening:", groupedOptions);

  let result: ComboboxOption[] = [];
  Object.keys(groupedOptions).sort().forEach(group => {
    console.log("Processing group:", group);
    result.push({ type: 'group', label: group, id: group, value: '' } as ComboboxOption); // Added id and empty value to group item
    const sortedGroupOptions = groupedOptions[group].sort(sortFn);
    result = result.concat(sortedGroupOptions);
  });

  console.log("Final processed parts result:", result);
  console.groupEnd();
  return result;
};

// Zod schema for submission to backend
const TradeInSubmissionSchema = z.object({
  title: z.string().min(5, "Otsikko on liian lyhyt."),
  description: z.string().max(2048, "Kuvaus on liian pitkä.").optional(),
  cpu: z.string().min(1, "Prosessori on pakollinen."),
  gpu: z.string().min(1, "Näytönohjain on pakollinen."),
  ram: z.string().min(1, "RAM on pakollinen."), // This expects the combined string
  storage: z.string().min(1, "Tallennustila on pakollinen."), // This expects the combined string
  powerSupply: z.string().optional(), // This expects the combined string
  caseModel: z.string().optional(),
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä", "Huono", "En tiedä"]), // Must match server enum exactly
  estimatedValue: z.number().optional(),
  contactEmail: z.string().email("Virheellinen sähköpostiosoite."),
  contactPhone: z.string().optional(),
});

// Type for local form state - granular fields, combining calculator and sell page fields
type FormData = {
  title: string;
  description?: string;
  cpu: string;
  gpu: string;
  ramSize: string; 
  ramType: string;
  ramSpeed: string;
  storageType: string;
  storageSize: string;
  psuWattage: string;
  psuEfficiency: string;
  caseModel?: string;
  condition: "Uusi" | "Kuin uusi" | "Hyvä" | "Tyydyttävä" | "Huono" | "En tiedä";
  estimatedValue?: number;
  contactEmail: string;
  contactPhone?: string;
};

const initialFormData: FormData = {
  title: '', 
  description: '', 
  cpu: '', 
  gpu: '',
  ramSize: '', 
  ramType: '', 
  ramSpeed: '',
  storageType: '', 
  storageSize: '',
  psuWattage: '', 
  psuEfficiency: '',
  caseModel: '',
  condition: 'En tiedä', // Set to "En tiedä" to show placeholder
  estimatedValue: undefined, 
  contactEmail: '', 
  contactPhone: '',
};

const FormStep = ({ title, description, children, isActive }: { title: string, description: string, children: React.ReactNode, isActive: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -50 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={cn("space-y-6", !isActive && "absolute w-full top-0 left-0 pointer-events-none")}
  >
    <h2 className="text-2xl font-bold text-[var(--color-neutral)]">{title}</h2>
    <p className="text-[var(--color-neutral)]/80 mt-1 mb-6">{description}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </motion.div>
);

export default function MyyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4;

  console.log("MyyPage Initialized. Current formData:", formData);
  console.log("Initial estimatedPrice:", estimatedPrice);
  console.log("Initial currentStep:", currentStep);

  const processedCpuOptions: ComboboxOption[] = useMemo(() => {
    console.group("Processing CPU Options");
    const result = processAndGroupParts(
      cpusData as CpuPart[],
      'name',
      (cpu) => (cpu as CpuPart).name.includes('Ryzen') ? 'AMD Processors' : 'Intel Processors',
      (cpu) => `${cpu.name} - ${cpu.price}€`,
      (a, b) => a.label.localeCompare(b.label) // Alphabetical sort
    );
    console.log("Processed CPU Options:", result);
    console.groupEnd();
    return result;
  }, [cpusData]);

  const processedGpuOptions: ComboboxOption[] = useMemo(() => {
    console.group("Processing GPU Options");
    const result = processAndGroupParts(
      gpusData as GpuPart[],
      'chipset',
      (gpu) => (gpu as GpuPart).chipset.includes('Radeon') ? 'AMD Graphics Cards' : 'NVIDIA Graphics Cards',
      (gpu) => `${gpu.chipset} - ${gpu.price}€`,
      (a, b) => a.label.localeCompare(b.label) // Alphabetical sort
    );
    console.log("Processed GPU Options:", result);
    console.groupEnd();
    return result;
  }, [gpusData]);

  const RAM_OPTIONS = useMemo(() => [
    { id: '8GB', value: '8', label: '8 GB' }, 
    { id: '16GB', value: '16', label: '16 GB' }, 
    { id: '32GB', value: '32', label: '32 GB' }, 
    { id: '64GB', value: '64', label: '64 GB' }, 
    { id: 'en_tieda_ram_size', value: 'en_tieda_ram_size', label: 'En tiedä' }
  ], []);
  
  const RAM_TYPE_OPTIONS = useMemo(() => [
    { id: 'DDR4', value: 'DDR4', label: 'DDR4' }, 
    { id: 'DDR5', value: 'DDR5', label: 'DDR5' }, 
    { id: 'en_tieda_ram_type', value: 'en_tieda_ram_type', label: 'En tiedä' }
  ], []);
  
  const RAM_SPEED_OPTIONS = useMemo(() => [
    { id: '2666MHz', value: '2666', label: '2666 MHz' }, 
    { id: '3200MHz', value: '3200', label: '3200 MHz' }, 
    { id: '3600MHz', value: '3600', label: '3600 MHz' }, 
    { id: '4800MHz', value: '4800', label: '4800 MHz (DDR5)'},
    { id: 'en_tieda_ram_speed', value: 'en_tieda_ram_speed', label: 'En tiedä' }
  ], []);
  
  const STORAGE_TYPE_OPTIONS = useMemo(() => [
    { id: 'SSD', value: 'SSD', label: 'SSD' }, 
    { id: 'HDD', value: 'HDD', label: 'HDD (Perinteinen)' }, 
    { id: 'en_tieda_storage_type', value: 'en_tieda_storage_type', label: 'En tiedä' }
  ], []);
  
  const STORAGE_SIZE_OPTIONS = useMemo(() => [
    { id: '256GB', value: '256', label: '256 GB' }, 
    { id: '512GB', value: '512', label: '512 GB' }, 
    { id: '1TB', value: '1024', label: '1 TB' }, 
    { id: '2TB', value: '2048', label: '2 TB' }, 
    { id: '4TB', value: '4096', label: '4 TB' }, 
    { id: 'en_tieda_storage_size', value: 'en_tieda_storage_size', label: 'En tiedä' }
  ], []);
  
  const PSU_WATTAGE_OPTIONS = useMemo(() => [
    { id: '450W', value: '450', label: '450W' }, 
    { id: '550W', value: '550', label: '550W' }, 
    { id: '650W', value: '650', label: '650W' }, 
    { id: '750W', value: '750', label: '750W' }, 
    { id: '850W', value: '850', label: '850W' }, 
    { id: '1000W+', value: '1000', label: '1000W+' }, 
    { id: 'en_tieda_psu_wattage', value: 'en_tieda_psu_wattage', label: 'En tiedä' }
  ], []);
  
  const PSU_EFFICIENCY_OPTIONS = useMemo(() => [
    { id: 'white', value: 'white', label: '80+ White' }, 
    { id: 'bronze', value: 'bronze', label: '80+ Bronze' }, 
    { id: 'silver', value: 'silver', label: '80+ Silver' }, 
    { id: 'gold', value: 'gold', label: '80+ Gold' }, 
    { id: 'platinum', value: 'platinum', label: '80+ Platinum' }, 
    { id: 'titanium', value: 'titanium', label: '80+ Titanium' }, 
    { id: 'en_tieda_psu_efficiency', value: 'en_tieda_psu_efficiency', label: 'En tiedä / Muu' }
  ], []);
  
  const CONDITION_OPTIONS = useMemo(() => [
    { id: 'uusi', value: 'Uusi', label: 'Uusi (sinetöity)' }, 
    { id: 'erinomainen', value: 'Kuin uusi', label: 'Erinomainen (kuin uusi)' }, 
    { id: 'hyväkuntoinen', value: 'Hyvä', label: 'Hyvä (pieniä käytön jälkiä)' }, 
    { id: 'tyydyttävä', value: 'Tyydyttävä', label: 'Tyydyttävä (selviä naarmuja)' },
    { id: 'huonokuntoinen', value: 'Huono', label: 'Huono (kolhuja, vikoja)' },
    { id: 'en_tieda_condition', value: 'En tiedä', label: 'En tiedä' }
  ], []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    console.log(`FormData changed: Field \`${field}\` set to \`${value}\``);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const debouncedCalculatePrice = useCallback(() => {
    console.log("Debounced calculation triggered. Current formData:", formData);
    const price = calculatePrice(formData); 
    console.log("Calculated price (debounced):", price);
    setEstimatedPrice(price);
  }, [formData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      void debouncedCalculatePrice();
    }, 500);
    return () => clearTimeout(handler);
  }, [formData, debouncedCalculatePrice]);

  const createTradeInSubmissionMutation = api.listings.createTradeInSubmission.useMutation({
    onSuccess: (data) => {
      console.log("Trade-in submission successful! Response:", data);
      toast({ title: "Pyyntö lähetetty", description: "Olemme sinuun yhteydessä sähköpostitse.", variant: "success" });
      setCurrentStep(TOTAL_STEPS + 1); // Move to confirmation step
    },
    onError: (error) => {
      console.error("Trade-in submission failed! Error:", error);
      toast({ title: "Virhe", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.group("Handling Form Submission");
    console.log("Form data at submission:", formData);
    try {
      const submissionData = {
        title: formData.title,
        description: formData.description,
        cpu: formData.cpu,
        gpu: formData.gpu,
        ram: `${formData.ramSize} ${formData.ramType} ${formData.ramSpeed}`.trim(),
        storage: `${formData.storageSize} ${formData.storageType}`.trim(),
        powerSupply: `${formData.psuWattage} ${formData.psuEfficiency}`.trim(),
        caseModel: formData.caseModel,
        condition: formData.condition,
        estimatedValue: estimatedPrice ?? undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
      };
      console.log("Submission data prepared:", submissionData);
      
      const validatedData = TradeInSubmissionSchema.parse(submissionData);
      console.log("Validated submission data:", validatedData);
      createTradeInSubmissionMutation.mutate(validatedData);
    } catch (error) {
      console.error("Form validation error:", error);
      if (error instanceof z.ZodError) {
        error.issues.forEach(issue => {
          console.error("Validation Issue:", issue.message);
          toast({ title: "Virheellinen syöte", description: issue.message, variant: "destructive" });
        });
      }
    } finally {
        console.groupEnd();
    }
  };

  const steps = [
    { id: 1, title: "Ydinkomponentit", description: "Valitse koneesi tärkeimmät osat, prosessori ja näytönohjain." },
    { id: 2, title: "Muisti ja Tallennustila", description: "Kerro meille koneesi muistin ja tallennustilan tiedot." },
    { id: 3, title: "Virtalähde ja Kunto", description: "Viimeistele tiedot virtalähteellä ja yleiskunnolla."},
    { id: 4, title: "Yhteystiedot", description: "Tarvitsemme yhteystietosi, jotta voimme lähettää sinulle tarjouksen."}
  ];

  const nextStep = () => {
    console.log("Moving to next step. Current step:", currentStep);
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS + 1));
    console.log("New step:", Math.min(currentStep + 1, TOTAL_STEPS + 1));
  }
  const prevStep = () => {
    console.log("Moving to previous step. Current step:", currentStep);
    setCurrentStep(s => Math.max(s - 1, 1));
    console.log("New step:", Math.max(currentStep - 1, 1));
  }

  return (
    <div className="container mx-auto px-container py-section">
      <header className="text-center mb-12">
        <h1 className="text-4xl-fluid font-extrabold tracking-tight text-[var(--color-neutral)]">
          Myy Tietokoneesi Meille
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg-fluid text-[var(--color-neutral)]/80">
          Anna vanhalle pelikoneellesi uusi elämä. Täytä tiedot, saat heti hinta-arvion ja teemme sinulle reilun tarjouksen.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <main className="lg:col-span-2 relative min-h-[600px]">
          <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
            {currentStep <= TOTAL_STEPS && (
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl-fluid font-bold text-[var(--color-neutral)]">Vaihe {currentStep}/{TOTAL_STEPS}: {steps[currentStep - 1]?.title}</CardTitle>
                  <div className="flex space-x-1">
                    {steps.map(step => (
                      <div key={step.id} className={`w-10 h-2 rounded-full ${currentStep >= step.id ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-3)]'}`}></div>
                    ))}
                  </div>
                </div>
              </CardHeader>
            )}
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {currentStep === TOTAL_STEPS + 1 ? (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-center py-12"
                  >
                    <CheckCircle2 className="w-16 h-16 text-[var(--color-success)] mx-auto mb-4" />
                    <h2 className="text-3xl-fluid font-bold text-[var(--color-neutral)]">Kiitos pyynnöstäsi!</h2>
                    <p className="text-[var(--color-neutral)]/80 mt-2">Olemme vastaanottaneet tietosi ja otamme sinuun pian yhteyttä sähköpostitse. Tarkistathan myös roskapostikansiosi.</p>
                    <Button onClick={() => {
                        console.log("Resetting form and returning to step 1.");
                        setCurrentStep(1);
                        setFormData(initialFormData);
                        setEstimatedPrice(null);
                      }} className="mt-8">Lähetä uusi pyyntö</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="relative">
                    {currentStep === 1 && (
                      <FormStep title="Ydinkomponentit" description="Valitse koneesi tärkeimmät osat, prosessori ja näytönohjain." isActive={currentStep === 1}>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="cpu" className="flex items-center text-[var(--color-neutral)]"><Cpu className="mr-2 h-4 w-4 text-[var(--color-primary)]" />Prosessori</Label>
                          <Combobox options={processedCpuOptions} value={formData.cpu} onValueChange={(v) => handleInputChange('cpu', v)} placeholder="Valitse prosessori..." searchPlaceholder="Etsi prosessoria..." groupBy="group" />
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="gpu" className="flex items-center text-[var(--color-neutral)]"><Info className="mr-2 h-4 w-4 text-[var(--color-primary)]" />Näytönohjain</Label>
                          <Combobox options={processedGpuOptions} value={formData.gpu} onValueChange={(v) => handleInputChange('gpu', v)} placeholder="Valitse näytönohjain..." searchPlaceholder="Etsi näytönohjainta..." groupBy="group" />
                        </div>
                      </FormStep>
                    )}

                    {currentStep === 2 && (
                      <FormStep title="Muisti ja Tallennustila" description="Kerro meille koneesi muistin ja tallennustilan tiedot." isActive={currentStep === 2}>
                        <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-4 col-span-full bg-[var(--color-surface-3)]">
                            <h3 className="font-semibold text-lg-fluid text-[var(--color-neutral)] flex items-center"><MemoryStick className="mr-2 text-[var(--color-primary)]" /> Muisti (RAM)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Koko</Label><Combobox options={RAM_OPTIONS} value={formData.ramSize} onValueChange={(v) => handleInputChange('ramSize', v)} placeholder="Valitse..." /></div>
                                <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Tyyppi</Label><Combobox options={RAM_TYPE_OPTIONS} value={formData.ramType} onValueChange={(v) => handleInputChange('ramType', v)} placeholder="Valitse..." /></div>
                                <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Nopeus</Label><Combobox options={RAM_SPEED_OPTIONS} value={formData.ramSpeed} onValueChange={(v) => handleInputChange('ramSpeed', v)} placeholder="Valitse..." /></div>
                            </div>
                        </div>
                        <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-4 col-span-full bg-[var(--color-surface-3)]">
                            <h3 className="font-semibold text-lg-fluid text-[var(--color-neutral)] flex items-center"><HardDrive className="mr-2 text-[var(--color-primary)]" /> Tallennustila</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Tyyppi</Label><Combobox options={STORAGE_TYPE_OPTIONS} value={formData.storageType} onValueChange={(v) => handleInputChange('storageType', v)} placeholder="Valitse..." /></div>
                                <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Koko</Label><Combobox options={STORAGE_SIZE_OPTIONS} value={formData.storageSize} onValueChange={(v) => handleInputChange('storageSize', v)} placeholder="Valitse..." /></div>
                            </div>
                        </div>
                      </FormStep>
                    )}

                    {currentStep === 3 && (
                      <FormStep title="Virtalähde ja Kunto" description="Viimeistele tiedot virtalähteellä ja yleiskunnolla." isActive={currentStep === 3}>
                        <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-4 col-span-full bg-[var(--color-surface-3)]">
                          <h3 className="font-semibold text-lg-fluid text-[var(--color-neutral)] flex items-center"><Power className="mr-2 text-[var(--color-primary)]" /> Virtalähde</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Teho</Label><Combobox options={PSU_WATTAGE_OPTIONS} value={formData.psuWattage} onValueChange={(v) => handleInputChange('psuWattage', v)} placeholder="Valitse..." /></div>
                              <div className="space-y-2"><Label className="text-[var(--color-neutral)]">Hyötysuhde</Label><Combobox options={PSU_EFFICIENCY_OPTIONS} value={formData.psuEfficiency} onValueChange={(v) => handleInputChange('psuEfficiency', v)} placeholder="Valitse..." /></div>
                          </div>
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="title" className="text-[var(--color-neutral)]">Otsikko</Label>
                          <Input placeholder="Otsikko (esim. Tehokas Pelitietokone)" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="description" className="text-[var(--color-neutral)]">Kuvaus</Label>
                          <Textarea placeholder="Tarkempi kuvaus (valinnainen)..." value={formData.description ?? ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="caseModel" className="text-[var(--color-neutral)]">Kotelo (Valinnainen)</Label>
                          <Input placeholder="Kotelo (esim. Fractal Design Meshify C)" value={formData.caseModel ?? ''} onChange={(e) => handleInputChange('caseModel', e.target.value)} className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label className="text-[var(--color-neutral)]">Koneen yleiskunto</Label>
                          <Combobox options={CONDITION_OPTIONS} value={formData.condition} onValueChange={(v) => handleInputChange('condition', v)} placeholder="Valitse koneen yleiskunto..." />
                        </div>
                      </FormStep>
                    )}

                    {currentStep === 4 && (
                      <FormStep title="Yhteystiedot" description="Tarvitsemme yhteystietosi, jotta voimme lähettää sinulle tarjouksen." isActive={currentStep === 4}>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="contactEmail" className="text-[var(--color-neutral)]">Sähköpostiosoite</Label>
                          <Input placeholder="Sähköpostiosoite" value={formData.contactEmail} onChange={(e) => handleInputChange('contactEmail', e.target.value)} type="email" className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                        </div>
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="contactPhone" className="text-[var(--color-neutral)]">Puhelinnumero (valinnainen)</Label>
                          <Input placeholder="Puhelinnumero (valinnainen)" value={formData.contactPhone ?? ''} onChange={(e) => handleInputChange('contactPhone', e.target.value)} type="tel" className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                        </div>
                      </FormStep>
                    )}
                    </div> {/* End of relative div for FormSteps */}

                    <div className="flex justify-between items-center pt-6 border-t border-[var(--color-border)]/50">
                      <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="px-4 py-2 sm:px-6 sm:py-3 touch-manipulation min-h-[44px]">Edellinen</Button>
                      {currentStep < TOTAL_STEPS && <Button onClick={nextStep} className="px-4 py-2 sm:px-6 sm:py-3 touch-manipulation min-h-[44px]">Seuraava</Button>}
                      {currentStep === TOTAL_STEPS && (
                        <Button type="submit" disabled={createTradeInSubmissionMutation.isPending || !formData.cpu || !formData.gpu || !formData.title || !formData.contactEmail} className="px-4 py-2 sm:px-6 sm:py-3 touch-manipulation min-h-[44px]">
                          {createTradeInSubmissionMutation.isPending ? 'Lähetetään...' : 'Lähetä Pyyntö'}
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </main>

        <aside className="lg:col-span-1 space-y-8">
          <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl-fluid font-bold text-[var(--color-neutral)]">Alustava Hinta-arvio</CardTitle>
            </CardHeader>
            <CardContent>
              {estimatedPrice !== null ? (
                <div className="text-center">
                  <p className="text-5xl font-extrabold text-[var(--color-success)]">{estimatedPrice} €</p>
                  <p className="text-sm text-[var(--color-neutral)]/80 mt-2">Lopullinen hinta vahvistetaan tarkistuksen jälkeen.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-[var(--color-neutral)]/50 mx-auto mb-4" />
                  <p className="text-[var(--color-neutral)]/80">Täytä komponenttien tiedot nähdäksesi hinta-arvion.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl-fluid font-bold text-[var(--color-neutral)]">Miten prosessi toimii?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[ { title: 'Täytä tiedot', description: 'Saat heti alustavan hinta-arvion.' }, { title: 'Lähetä pyyntö', description: 'Otamme sinuun yhteyttä sähköpostitse.' }, { title: 'Tarkastus & Tarjous', description: 'Vahvistamme hinnan koneen tarkistuksen jälkeen.' }, { title: 'Maksu', description: 'Hyväksyttyäsi tarjouksen, saat rahat tilillesi.' } ].map((step, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full font-bold text-sm">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-[var(--color-neutral)]">{step.title}</h3>
                    <p className="text-[var(--color-neutral)]/80 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
