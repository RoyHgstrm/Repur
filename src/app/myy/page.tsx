// src/app/myy/page.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { toast } from '~/components/ui/use-toast';
import { z } from 'zod';
import { api } from '~/trpc/react';

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
import { Label } from "~/components/ui/label";

import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Power, 
  CheckCircle2, 
  Monitor,
  Zap,
  Shield,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Recycle,
  Award
} from "lucide-react";
import { cn } from "~/lib/utils";

import cpusData from "~/data/parts/cpu.json";
import gpusData from "~/data/parts/video-card.json";

type Part = { name: string; price: number | null; [key: string]: any; };
type CpuPart = Part & { core_count: number; boost_clock: number; microarchitecture: string; };
type GpuPart = Part & { chipset: string; memory: number; };

// #region Pricing Configuration
const PRICING_CONFIG = {
  REPUR_PURCHASE_FACTOR: 0.6,
  AGE_HEURISTICS: [
    { series: ["50-series", "RTX 50", "Ryzen 9000"], years: 0.5 },
    { series: ["40-series", "RTX 40", "Ryzen 7000"], years: 1.5 },
    { series: ["30-series", "RTX 30", "Ryzen 5000"], years: 3 },
    { series: ["20-series", "RTX 20", "Ryzen 3000"], years: 5 },
    { series: ["10-series", "GTX 10", "Ryzen 2000"], years: 7 },
  ] as const,
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
    "En tiedä": 0.8,
  } as const,
  RAM: {
    BASE_VALUE_PER_GB: 2.5,
    TYPE_MULTIPLIER: { DDR4: 1.0, DDR5: 1.5, en_tieda_ram_type: 1.0 } as const,
    SPEED_MULTIPLIER: {
      LOW: 0.9,
      MID: 1.0,
      HIGH: 1.1,
    } as const,
    DEFAULT_GB: 16,
  },
  STORAGE: {
    BASE_VALUE_PER_GB: { SSD: 0.08, HDD: 0.02, en_tieda_storage_type: 0.06 } as const,
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
    } as const,
    DEFAULT_WATTAGE: 650,
  },
};

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
  const size = data.ramSize ? parseInt(data.ramSize, 10) : PRICING_CONFIG.RAM.DEFAULT_GB;
  const type = data.ramType && data.ramType !== 'en_tieda_ram_type' ? data.ramType : 'en_tieda_ram_type';
  const speed = data.ramSpeed ? parseInt(data.ramSpeed, 10) : 3200;

  let speedMultiplier: number = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.MID;
  if (speed < 3000) speedMultiplier = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.LOW;
  if (speed > 3600) speedMultiplier = PRICING_CONFIG.RAM.SPEED_MULTIPLIER.HIGH;

  const typeKey = type as keyof typeof PRICING_CONFIG.RAM.TYPE_MULTIPLIER;
  const typeMultiplier = PRICING_CONFIG.RAM.TYPE_MULTIPLIER[typeKey] || 1.0;

  return size * PRICING_CONFIG.RAM.BASE_VALUE_PER_GB * typeMultiplier * speedMultiplier;
};

const calculateStorageValue = (data: FormData): number => {
  const size = data.storageSize ? parseInt(data.storageSize, 10) : PRICING_CONFIG.STORAGE.DEFAULT_GB;
  const type = data.storageType && data.storageType !== 'en_tieda_storage_type' ? data.storageType : 'en_tieda_storage_type';
  const typeKey = type as keyof typeof PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB;
  const multiplier = PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB[typeKey] || PRICING_CONFIG.STORAGE.BASE_VALUE_PER_GB.en_tieda_storage_type;
  return size * multiplier;
};

const calculatePsuValue = (data: FormData): number => {
  const wattage = data.psuWattage ? parseInt(data.psuWattage, 10) : PRICING_CONFIG.PSU.DEFAULT_WATTAGE;
  const efficiency = data.psuEfficiency && data.psuEfficiency !== 'en_tieda_psu_efficiency' ? data.psuEfficiency : 'en_tieda_psu_efficiency';
  const efficiencyKey = efficiency as keyof typeof PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER;
  const multiplier = PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER[efficiencyKey] || PRICING_CONFIG.PSU.EFFICIENCY_MULTIPLIER.en_tieda_psu_efficiency;
  return wattage * PRICING_CONFIG.PSU.BASE_VALUE_PER_WATT * multiplier;
};

const calculatePrice = (data: FormData): number | null => {
  const selectedCpu = cpusData.find((c) => c.name === data.cpu);
  const selectedGpu = gpusData.find((g) => g.chipset === data.gpu);

  if (!selectedCpu || !selectedGpu || 
      !data.ramSize || !data.ramType || !data.ramSpeed || 
      !data.storageType || !data.storageSize || 
      !data.psuWattage || !data.psuEfficiency) {
    return null;
  }

  const cpuValue = calculatePartValue(selectedCpu, 'CPU');
  const gpuValue = calculatePartValue(selectedGpu, 'GPU');
  const ramValue = calculateRamValue(data);
  const storageValue = calculateStorageValue(data);
  const psuValue = calculatePsuValue(data);

  const totalMarketValue = cpuValue + gpuValue + ramValue + storageValue + psuValue;
  const conditionKey = data.condition;
  const conditionMultiplier = PRICING_CONFIG.CONDITION_MULTIPLIERS[conditionKey] || PRICING_CONFIG.CONDITION_MULTIPLIERS["En tiedä"];
  const adjustedValue = totalMarketValue * conditionMultiplier;
  const finalOffer = adjustedValue * PRICING_CONFIG.REPUR_PURCHASE_FACTOR;
  
  return isNaN(finalOffer) ? null : Math.round(finalOffer);
};
// #endregion

// Process parts without showing prices
const processAndGroupParts = <T extends Part>(
  parts: T[],
  groupingKey: 'name' | 'chipset',
  groupLabelFn: (part: T) => string,
  mainLabelFn: (part: T) => string,
  sortFn?: (a: ComboboxOption, b: ComboboxOption) => number
): ComboboxOption[] => {
  const seenValues = new Set<string>();
  const groupedOptions: Record<string, ComboboxOption[]> = {};

  parts.forEach(part => {
    if (part.price === null || part.price === 0) return;

    const value = part[groupingKey] as string;
    if (seenValues.has(value)) return;
    seenValues.add(value);

    const group = groupLabelFn(part);
    if (!groupedOptions[group]) {
      groupedOptions[group] = [];
    }

    const newOption = {
      id: value,
      value: value,
      label: mainLabelFn(part), // No price shown
      group: group,
    };
    groupedOptions[group].push(newOption);
  });

  let result: ComboboxOption[] = [];
  Object.keys(groupedOptions).sort().forEach(group => {
    result.push({ type: 'group', label: group, id: group, value: '' } as ComboboxOption);
    const sortedGroupOptions = groupedOptions[group].sort(sortFn);
    result = result.concat(sortedGroupOptions);
  });

  return result;
};

// Zod schema for submission to backend
const TradeInSubmissionSchema = z.object({
  title: z.string().min(5, "Otsikko on liian lyhyt."),
  description: z.string().max(2048, "Kuvaus on liian pitkä.").optional(),
  cpu: z.string().min(1, "Prosessori on pakollinen."),
  gpu: z.string().min(1, "Näytönohjain on pakollinen."),
  ram: z.string().min(1, "RAM on pakollinen."),
  storage: z.string().min(1, "Tallennustila on pakollinen."),
  powerSupply: z.string().optional(),
  caseModel: z.string().optional(),
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä", "Huono", "En tiedä"]),
  estimatedValue: z.number().optional(),
  contactEmail: z.string().email("Virheellinen sähköpostiosoite."),
  contactPhone: z.string().optional(),
});

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
  condition: 'En tiedä',
  estimatedValue: undefined, 
  contactEmail: '', 
  contactPhone: '',
};

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
      <div key={step} className="flex items-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
          currentStep >= step 
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
            : "bg-gray-200 text-gray-600"
        )}>
          {step}
        </div>
        {step < totalSteps && (
          <div className={cn(
            "w-16 h-1 mx-2 rounded-full transition-all duration-300",
            currentStep > step ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-gray-200"
          )} />
        )}
      </div>
    ))}
  </div>
);

const FormStep = ({ title, description, children, isActive }: { title: string, description: string, children: React.ReactNode, isActive: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -50 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={cn("space-y-6", !isActive && "absolute w-full top-0 left-0 pointer-events-none")}
  >
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {children}
    </div>
  </motion.div>
);

export default function MyyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Remove price from display labels
  const processedCpuOptions: ComboboxOption[] = useMemo(() => {
    return processAndGroupParts(
      cpusData as CpuPart[],
      'name',
      (cpu) => (cpu as CpuPart).name.includes('Ryzen') ? 'AMD Processors' : 'Intel Processors',
      (cpu) => cpu.name, // Just show the name, no price
      (a, b) => a.label.localeCompare(b.label)
    );
  }, []);

  const processedGpuOptions: ComboboxOption[] = useMemo(() => {
    return processAndGroupParts(
      gpusData as GpuPart[],
      'chipset',
      (gpu) => (gpu as GpuPart).chipset.includes('Radeon') ? 'AMD Graphics Cards' : 'NVIDIA Graphics Cards',
      (gpu) => gpu.chipset, // Just show the chipset, no price
      (a, b) => a.label.localeCompare(b.label)
    );
  }, []);

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const debouncedCalculatePrice = useCallback(() => {
    const price = calculatePrice(formData); 
    setEstimatedPrice(price);
  }, [formData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      void debouncedCalculatePrice();
    }, 500);
    return () => clearTimeout(handler);
  }, [formData, debouncedCalculatePrice]);

  const createTradeInSubmissionMutation = api.listings.createTradeInSubmission.useMutation({
    onSuccess: () => {
      toast({ title: "Pyyntö lähetetty", description: "Olemme sinuun yhteydessä sähköpostitse.", variant: "success" });
      setCurrentStep(TOTAL_STEPS + 1);
    },
    onError: (error) => {
      toast({ title: "Virhe", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      
      const validatedData = TradeInSubmissionSchema.parse(submissionData);
      createTradeInSubmissionMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(issue => {
          toast({ title: "Virheellinen syöte", description: issue.message, variant: "destructive" });
        });
      }
    }
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS + 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-[var(--color-surface-1)] text-[var(--color-neutral)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-tertiary)] to-[var(--color-primary-dark)] text-[var(--color-neutral)]">
        <div className="container mx-auto px-container py-section">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl-fluid sm:text-5xl-fluid font-extrabold mb-6 !text-white"
            >
              Myy Tietokoneesi Repur.fi:lle
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg-fluid opacity-90 mb-8"
            >
              Anna vanhalle pelikoneellesi uusi elämä. Saat reilun tarjouksen ja tuet samalla kierrätystaloutta.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 text-sm-fluid"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[var(--color-success)]" />
                <span>12 kuukauden takuu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Recycle className="w-5 h-5 text-[var(--color-info)]" />
                <span>Ympäristöystävällistä</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-[var(--color-warning)]" />
                <span>Luotettava kumppani</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-container py-section">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
              {currentStep <= TOTAL_STEPS && (
                <CardHeader className="bg-[var(--color-surface-3)] border-b border-[var(--color-border)]">
                  <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
                </CardHeader>
              )}
              
              <CardContent className="p-lg">
                <AnimatePresence mode="wait">
                  {currentStep === TOTAL_STEPS + 1 ? (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-2xl"
                    >
                      <div className="w-24 h-24 bg-[var(--color-success)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-[var(--color-success)]" />
                      </div>
                      <h2 className="text-3xl-fluid font-bold text-[var(--color-neutral)] mb-4">Kiitos pyynnöstäsi!</h2>
                      <p className="text-[var(--color-neutral)]/80 mb-8 max-w-md mx-auto">
                        Olemme vastaanottaneet tietosi ja otamme sinuun yhteyttä sähköpostitse 24 tunnin sisällä.
                      </p>
                      <Button 
                        onClick={() => {
                          setCurrentStep(1);
                          setFormData(initialFormData);
                          setEstimatedPrice(null);
                        }}
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                      >
                        Lähetä uusi pyyntö
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="relative min-h-[500px]">
                        {/* Step 1: Core Components */}
                        {currentStep === 1 && (
                          <FormStep 
                            title="Ydinkomponentit" 
                            description="Valitse koneesi tärkeimmät osat - prosessori ja näytönohjain." 
                            isActive={currentStep === 1}
                          >
                            <div className="space-y-4">
                              <Label className="flex items-center text-[var(--color-neutral)] font-semibold">
                                <Cpu className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                Prosessori (CPU)
                              </Label>
                              <Combobox 
                                options={processedCpuOptions} 
                                value={formData.cpu} 
                                onValueChange={(v) => handleInputChange('cpu', v)} 
                                placeholder="Valitse prosessori..." 
                                searchPlaceholder="Etsi prosessoria..." 
                                groupBy="group" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="flex items-center text-[var(--color-neutral)] font-semibold">
                                <Monitor className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                Näytönohjain (GPU)
                              </Label>
                              <Combobox 
                                options={processedGpuOptions} 
                                value={formData.gpu} 
                                onValueChange={(v) => handleInputChange('gpu', v)} 
                                placeholder="Valitse näytönohjain..." 
                                searchPlaceholder="Etsi näytönohjainta..." 
                                groupBy="group" 
                              />
                            </div>
                          </FormStep>
                        )}

                        {/* Step 2: Memory and Storage */}
                        {currentStep === 2 && (
                          <FormStep 
                            title="Muisti ja Tallennustila" 
                            description="Kerro meille koneesi muistin ja tallennustilan tiedot." 
                            isActive={currentStep === 2}
                          >
                            <div className="bg-[var(--color-surface-3)]/50 p-lg rounded-xl border border-[var(--color-border)]">
                              <h3 className="font-semibold text-xl-fluid text-[var(--color-neutral)] flex items-center mb-4">
                                <MemoryStick className="mr-2 text-[var(--color-primary)]" /> 
                                Muisti (RAM)
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Koko</Label>
                                  <Combobox 
                                    options={RAM_OPTIONS} 
                                    value={formData.ramSize} 
                                    onValueChange={(v) => handleInputChange('ramSize', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Tyyppi</Label>
                                  <Combobox 
                                    options={RAM_TYPE_OPTIONS} 
                                    value={formData.ramType} 
                                    onValueChange={(v) => handleInputChange('ramType', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Nopeus</Label>
                                  <Combobox 
                                    options={RAM_SPEED_OPTIONS} 
                                    value={formData.ramSpeed} 
                                    onValueChange={(v) => handleInputChange('ramSpeed', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-[var(--color-surface-3)]/50 p-lg rounded-xl border border-[var(--color-border)]">
                              <h3 className="font-semibold text-xl-fluid text-[var(--color-neutral)] flex items-center mb-4">
                                <HardDrive className="mr-2 text-[var(--color-primary)]" /> 
                                Tallennustila
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Tyyppi</Label>
                                  <Combobox 
                                    options={STORAGE_TYPE_OPTIONS} 
                                    value={formData.storageType} 
                                    onValueChange={(v) => handleInputChange('storageType', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Koko</Label>
                                  <Combobox 
                                    options={STORAGE_SIZE_OPTIONS} 
                                    value={formData.storageSize} 
                                    onValueChange={(v) => handleInputChange('storageSize', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                              </div>
                            </div>
                          </FormStep>
                        )}

                        {/* Step 3: PSU and Details */}
                        {currentStep === 3 && (
                          <FormStep 
                            title="Virtalähde ja Lisätiedot" 
                            description="Viimeistele tiedot virtalähteellä ja muilla yksityiskohdilla." 
                            isActive={currentStep === 3}
                          >
                            <div className="bg-[var(--color-surface-3)]/50 p-lg rounded-xl border border-[var(--color-border)] col-span-full">
                              <h3 className="font-semibold text-xl-fluid text-[var(--color-neutral)] flex items-center mb-4">
                                <Power className="mr-2 text-[var(--color-primary)]" /> 
                                Virtalähde (PSU)
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Teho</Label>
                                  <Combobox 
                                    options={PSU_WATTAGE_OPTIONS} 
                                    value={formData.psuWattage} 
                                    onValueChange={(v) => handleInputChange('psuWattage', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[var(--color-neutral)]">Hyötysuhde</Label>
                                  <Combobox 
                                    options={PSU_EFFICIENCY_OPTIONS} 
                                    value={formData.psuEfficiency} 
                                    onValueChange={(v) => handleInputChange('psuEfficiency', v)} 
                                    placeholder="Valitse..." 
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <Label className="text-[var(--color-neutral)] font-semibold">Otsikko</Label>
                              <Input 
                                placeholder="Otsikko (esim. Tehokas Pelitietokone)" 
                                value={formData.title} 
                                onChange={(e) => handleInputChange('title', e.target.value)} 
                                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/40" 
                              />
                            </div>
                            
                            <div className="space-y-4">
                              <Label className="text-[var(--color-neutral)] font-semibold">Kotelo (Valinnainen)</Label>
                              <Input 
                                placeholder="Kotelo (esim. Fractal Design Meshify C)" 
                                value={formData.caseModel ?? ''} 
                                onChange={(e) => handleInputChange('caseModel', e.target.value)} 
                                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/40" 
                              />
                            </div>
                            
                            <div className="space-y-4 col-span-full">
                              <Label className="text-[var(--color-neutral)] font-semibold">Kuvaus (Valinnainen)</Label>
                              <Textarea 
                                placeholder="Tarkempi kuvaus koneesta, sen käytöstä ja kunnosta..." 
                                value={formData.description ?? ''} 
                                onChange={(e) => handleInputChange('description', e.target.value)} 
                                rows={4} 
                                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/40" 
                              />
                            </div>
                            
                            <div className="space-y-4 col-span-full">
                              <Label className="text-[var(--color-neutral)] font-semibold">Koneen yleiskunto</Label>
                              <Combobox 
                                options={CONDITION_OPTIONS} 
                                value={formData.condition} 
                                onValueChange={(v) => handleInputChange('condition', v)} 
                                placeholder="Valitse koneen yleiskunto..." 
                              />
                            </div>
                          </FormStep>
                        )}

                        {/* Step 4: Contact Info */}
                        {currentStep === 4 && (
                          <FormStep 
                            title="Yhteystiedot" 
                            description="Tarvitsemme yhteystietosi tarjouksen lähettämistä varten." 
                            isActive={currentStep === 4}
                          >
                            <div className="space-y-4">
                              <Label className="text-[var(--color-neutral)] font-semibold">Sähköpostiosoite *</Label>
                              <Input 
                                placeholder="Sähköpostiosoite" 
                                value={formData.contactEmail} 
                                onChange={(e) => handleInputChange('contactEmail', e.target.value)} 
                                type="email" 
                                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/40" 
                                required
                              />
                            </div>
                            
                            <div className="space-y-4">
                              <Label className="text-[var(--color-neutral)] font-semibold">Puhelinnumero (valinnainen)</Label>
                              <Input 
                                placeholder="Puhelinnumero" 
                                value={formData.contactPhone ?? ''} 
                                onChange={(e) => handleInputChange('contactPhone', e.target.value)} 
                                type="tel" 
                                className="bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] placeholder-[var(--color-neutral)]/50 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/40" 
                              />
                            </div>
                          </FormStep>
                        )}
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center pt-lg border-t border-[var(--color-border)]/50">
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={prevStep} 
                          disabled={currentStep === 1}
                          className="flex items-center space-x-2 px-lg py-md"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Edellinen</span>
                        </Button>
                        
                        {currentStep < TOTAL_STEPS ? (
                          <Button 
                            type="button"
                            onClick={nextStep}
                            className="flex items-center space-x-2 px-lg py-md bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                          >
                            <span>Seuraava</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            type="submit" 
                            disabled={createTradeInSubmissionMutation.isPending || !formData.cpu || !formData.gpu || !formData.title || !formData.contactEmail}
                            className="flex items-center space-x-2 px-xl py-md bg-gradient-to-r from-[var(--color-success)] to-[var(--color-primary)] hover:from-[var(--color-success)]/90 hover:to-[var(--color-primary)]/90"
                          >
                            {createTradeInSubmissionMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-[var(--color-neutral)] border-t-transparent rounded-full animate-spin" />
                                <span>Lähetetään...</span>
                              </>
                            ) : (
                              <>
                                <span>Lähetä Pyyntö</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-lg">
            {/* Price Estimate */}
            <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
              <CardHeader className="bg-[var(--color-surface-3)]/50 border-b border-[var(--color-border)]">
                <CardTitle className="flex items-center text-xl-fluid font-bold text-[var(--color-neutral)]">
                  <Calculator className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                  Hinta-arvio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-lg">
                {estimatedPrice !== null ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="text-4xl-fluid font-bold text-[var(--color-success)] mb-2">
                      {estimatedPrice} €
                    </div>
                    <p className="text-sm-fluid text-[var(--color-neutral)]/80">
                      Alustava tarjouksemme
                    </p>
                    <p className="text-xs-fluid text-[var(--color-neutral)]/60 mt-2">
                      Lopullinen hinta vahvistetaan tarkistuksen jälkeen
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center py-2xl">
                    <div className="w-16 h-16 bg-[var(--color-surface-3)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="w-8 h-8 text-[var(--color-neutral)]/50" />
                    </div>
                    <p className="text-[var(--color-neutral)]/80 text-sm-fluid">
                      Täytä komponenttien tiedot nähdäksesi hinta-arvion
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Process Steps */}
            <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl-fluid font-bold text-[var(--color-neutral)]">
                  Miten prosessi toimii?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-lg space-y-4">
                {[
                  { 
                    icon: Calculator, 
                    title: 'Täytä tiedot', 
                    description: 'Saat heti alustavan hinta-arvion komponenttiesi perusteella.' 
                  },
                  { 
                    icon: Zap, 
                    title: 'Lähetä pyyntö', 
                    description: 'Otamme yhteyttä 24 tunnin sisällä sähköpostitse.' 
                  },
                  { 
                    icon: Shield, 
                    title: 'Tarkastus & Tarjous', 
                    description: 'Tarkastamme koneen ja vahvistamme lopullisen hinnan.' 
                  },
                  { 
                    icon: CheckCircle2, 
                    title: 'Maksu', 
                    description: 'Hyväksyttyäsi tarjouksen, saat rahat nopeasti tilillesi.' 
                  }
                ].map((step, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary)] text-[var(--color-surface-inverse)] rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-neutral)] flex items-center">
                        <step.icon className="w-4 h-4 mr-1 text-[var(--color-primary)]" />
                        {step.title}
                      </h3>
                      <p className="text-[var(--color-neutral)]/80 text-sm-fluid mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-gradient-to-br from-[var(--color-surface-3)]/50 to-[var(--color-surface-4)]/50 border-[var(--color-border)]/50 shadow-lg">
              <CardContent className="p-lg">
                <h3 className="font-bold text-[var(--color-neutral)] mb-4">Miksi valita Repur.fi?</h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: "12 kuukauden takuu kaikille koneille" },
                    { icon: Recycle, text: "Ympäristöystävällinen vaihtoehto" },
                    { icon: Award, text: "Reilut hinnat ja nopea käsittely" },
                    { icon: Zap, text: "Ammattitaitoinen refurb-prosessi" }
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <benefit.icon className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                      <span className="text-sm-fluid text-[var(--color-neutral)]/80">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}