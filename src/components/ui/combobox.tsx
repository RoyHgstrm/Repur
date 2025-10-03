"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Command, CommandInput, CommandList, CommandEmpty } from "./command";
import { cn } from "~/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Check, ChevronDown, X } from "lucide-react";
import dynamic from 'next/dynamic';
// Removed: import { FixedSizeList } from 'react-window';

const ITEM_HEIGHT = 36;
const MAX_VISIBLE_ITEMS = 8;
const DEBOUNCE_DELAY = 150;

// Type for FixedSizeList props
interface FixedSizeListProps {
	height: number;
	itemCount: number;
	itemSize: number;
	width: string | number;
	children: React.ComponentType<any>;
	itemData?: any;
	overscanCount?: number;
	ref: React.Ref<any>; // Add ref to FixedSizeListProps
}

// Properly typed dynamic import for FixedSizeList with error handling
const ClientFixedSizeList = dynamic<FixedSizeListProps>(
  () => import("react-window").then((mod: any) => {
    if (!mod || !mod.List) {
      console.error('react-window List export not found:', mod);
      // Return a fallback component instead of throwing
      const FallbackList: React.FC<FixedSizeListProps> = (props) => (
        <div style={{ height: props.height, overflow: 'auto' }}>
          {Array.from({ length: props.itemCount }).map((_, index) => (
            <div key={index} style={{ height: props.itemSize }}>
              Item {index}
            </div>
          ))}
        </div>
      );
      return FallbackList as any;
    }
    console.log('✅ Successfully loaded react-window List');
    console.log('react-window module:', mod);
    console.log('Available exports:', Object.keys(mod));
    return mod.List as any;
  }), {
  ssr: false,
  loading: () => <div className="py-2 text-center">Loading virtualized list...</div>
});

type GroupItem = { type: "group"; label: string };

export interface ComboboxOption {
	id: string;
	label: string;
	value: string;
	group?: string;
	disabled?: boolean;
	searchTerms?: string[];
	meta?: Record<string, any>;
}

type ComboboxListItem = ComboboxOption | GroupItem;

function isComboboxOption(item: ComboboxListItem): item is ComboboxOption {
	return "value" in item && "label" in item;
}

// Optimized grouping with memoization
const groupOptions = (items: ComboboxOption[], key: string): ComboboxListItem[] => {
	const grouped = items.reduce((acc, item) => {
		const groupName = (item as any)[key] || "Muut";
		if (!acc[groupName]) acc[groupName] = [];
		acc[groupName].push(item);
		return acc;
	}, {} as Record<string, ComboboxOption[]>);

	const result: ComboboxListItem[] = [];
	Object.entries(grouped).forEach(([groupName, groupItems]) => {
		result.push({ type: "group", label: groupName });
		result.push(...groupItems);
	});
	return result;
};

// Debounce hook for search optimization
function useDebouncedValue<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

export interface ComboboxProps {
	options: ComboboxOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	groupBy?: string;
	searchPlaceholder?: string;
	noOptionsMessage?: string;
	clearable?: boolean;
	maxHeight?: number;
	virtualized?: boolean;
	caseSensitive?: boolean;
	onOpenChange?: (open: boolean) => void;
}

// Props for the row renderer
interface ItemRendererProps {
	index: number;
	style: React.CSSProperties;
	data: {
		items: ComboboxListItem[];
		value?: string;
		highlightedIndex: number;
		onSelect: (value: string) => void;
		setHighlightedIndex: (index: number) => void;
	};
}

// Memoized row component for virtualization
const RowComponent = React.memo<ItemRendererProps>(({ index, style, data }) => {
	// Add defensive checks
	if (!data || !data.items) {
		return (
			<div style={style} className="px-3 py-2 text-sm">
				Loading...
			</div>
		);
	}

	const { items, value, highlightedIndex, onSelect, setHighlightedIndex } = data;
	
	// Check if index is valid
	if (index < 0 || index >= items.length) {
		return null;
	}

	const item = items[index];

	if (!item) return null;

	if (!isComboboxOption(item)) {
		return (
			<div
				style={style}
				className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-3)]"
			>
				{item.label || 'Unnamed Group'}
			</div>
		);
	}

	const isSelected = value === item.value;
	const isHighlighted = highlightedIndex === index;

	return (
		<div
			role="option"
			aria-selected={isSelected}
			aria-disabled={item.disabled}
			style={style}
			onClick={() => {
				if (!item.disabled && onSelect) {
					onSelect(item.value);
				}
			}}
			onMouseEnter={() => setHighlightedIndex && setHighlightedIndex(index)}
			className={cn(
				"flex items-center px-3 cursor-pointer transition-colors",
				isHighlighted && "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
				!isHighlighted && isSelected && "bg-[var(--color-surface-3)]",
				item.disabled && "opacity-50 cursor-not-allowed"
			)}
		>
			<span className="flex-1 truncate">{item.label}</span>
			{isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
		</div>
	);
});

RowComponent.displayName = "RowComponent";

export function Combobox(props: ComboboxProps) {
	const {
		options,
		value,
		onValueChange,
		placeholder = "Valitse...",
		disabled,
		className,
		groupBy,
		searchPlaceholder = "Hae...",
		noOptionsMessage = "Ei vaihtoehtoja löydy.",
		clearable = false,
		maxHeight = MAX_VISIBLE_ITEMS * ITEM_HEIGHT,
		virtualized = true,
		caseSensitive = false,
		onOpenChange,
	} = props;

	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<any>(null); // Ref for the FixedSizeList component
	const listContainerRef = useRef<HTMLDivElement>(null);
	const [listContainerWidth, setListContainerWidth] = useState(0);

	useEffect(() => {
		const container = listContainerRef.current;
		if (!container) return;

		const resizeObserver = new ResizeObserver(entries => {
			if (entries[0]) {
				setListContainerWidth(entries[0].contentRect.width);
			}
		});

		resizeObserver.observe(container);

		return () => resizeObserver.unobserve(container);
	}, []);

	// Debounced search for better performance
	const debouncedSearch = useDebouncedValue(searchTerm, DEBOUNCE_DELAY);

	// Memoized flattened options
	const flattenedOptions = useMemo(
		() => (groupBy ? groupOptions(options, groupBy) : options),
		[options, groupBy]
	);

	// Optimized filtering with memoization
	const filteredOptions = useMemo(() => {
		if (!debouncedSearch.trim()) return flattenedOptions;

		const searchLower = caseSensitive
			? debouncedSearch
			: debouncedSearch.toLowerCase();

		return flattenedOptions.filter((item) => {
			if (!isComboboxOption(item)) return true;

			const matchLabel = caseSensitive
				? item.label.includes(searchLower)
				: item.label.toLowerCase().includes(searchLower);

			const matchTerms = item.searchTerms?.some((term) =>
				caseSensitive
					? term.includes(searchLower)
					: term.toLowerCase().includes(searchLower)
			);

			return (matchLabel || matchTerms) && !item.disabled;
		});
	}, [flattenedOptions, debouncedSearch, caseSensitive]);

	// Get only selectable items for keyboard navigation
	const selectableItems = useMemo(
		() => filteredOptions.filter(isComboboxOption),
		[filteredOptions]
	);

	// Find selected option
	const selectedOption = useMemo(
		() => options.find((option) => option.value === value),
		[options, value]
	);

	// Handle open state changes
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			setOpen(newOpen);
			onOpenChange?.(newOpen);

			if (newOpen) {
				setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
				setSearchTerm("");
				setHighlightedIndex(-1);
			}
		},
		[onOpenChange]
	);

	// Handle selection
	const handleSelect = useCallback(
		(selectedValue: string) => {
			onValueChange?.(selectedValue);
			handleOpenChange(false);
			triggerRef.current?.focus();
		},
		[onValueChange, handleOpenChange]
	);

	// Optimized keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!open) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleOpenChange(true);
				}
				return;
			}

			switch (e.key) {
				case "ArrowDown": {
					e.preventDefault();
					setHighlightedIndex((prev) => {
						const currentIndex = selectableItems.findIndex(
							(item) => item === filteredOptions[prev]
						);
						const nextSelectableIndex = Math.min(
							currentIndex + 1,
							selectableItems.length - 1
						);
						return filteredOptions.indexOf(selectableItems[nextSelectableIndex]);
					});
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					setHighlightedIndex((prev) => {
						const currentIndex = selectableItems.findIndex(
							(item) => item === filteredOptions[prev]
						);
						const prevSelectableIndex = Math.max(currentIndex - 1, 0);
						return filteredOptions.indexOf(selectableItems[prevSelectableIndex]);
					});
					break;
				}
				case "Home": {
					e.preventDefault();
					const firstSelectable = filteredOptions.findIndex(isComboboxOption);
					setHighlightedIndex(firstSelectable);
					break;
				}
				case "End": {
					e.preventDefault();
					const lastSelectableIndex = filteredOptions.length - 1;
					for (let i = lastSelectableIndex; i >= 0; i--) {
						if (isComboboxOption(filteredOptions[i])) {
							setHighlightedIndex(i);
							break;
						}
					}
					break;
				}
				case "Enter": {
					e.preventDefault();
					const highlightedItem = filteredOptions[highlightedIndex];
					if (isComboboxOption(highlightedItem) && !highlightedItem.disabled) {
						handleSelect(highlightedItem.value);
					}
					break;
				}
				case "Escape": {
					e.preventDefault();
					handleOpenChange(false);
					triggerRef.current?.focus();
					break;
				}
				case "Tab": {
					handleOpenChange(false);
					break;
				}
			}
		},
		[
			open,
			highlightedIndex,
			filteredOptions,
			selectableItems,
			handleSelect,
			handleOpenChange,
		]
	);

	// Clear selection handler
	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onValueChange?.("");
		},
		[onValueChange]
	);

	// Memoize item data for the virtualized list to prevent unnecessary re-renders
	const memoizedItemData = useMemo(() => ({
		items: filteredOptions,
		value,
		highlightedIndex,
		onSelect: handleSelect,
		setHighlightedIndex,
	}), [filteredOptions, value, highlightedIndex, handleSelect, setHighlightedIndex]);

	// Virtualized list component
	const VirtualizedList = useCallback(() => {
		const listHeight = Math.min(maxHeight, filteredOptions.length * ITEM_HEIGHT);

		// Add defensive checks for all props
		const safeItemData = memoizedItemData || {
			items: [],
			value: '',
			highlightedIndex: -1,
			onSelect: () => { /* noop */ },
			setHighlightedIndex: () => { /* noop */ },
		};

		const safeItemCount = Math.max(0, filteredOptions.length);

		if (listContainerWidth === 0) return null;

		return (
			<ClientFixedSizeList
				ref={listRef}
				height={listHeight}
				itemCount={safeItemCount}
				itemSize={ITEM_HEIGHT}
				width={listContainerWidth}
				overscanCount={5}
				itemData={safeItemData}
			>
				{({ index, style, data }) => (
					<RowComponent 
						index={index} 
						style={style} 
						data={data || safeItemData} 
					/>
				)}
			</ClientFixedSizeList>
		);
	}, [filteredOptions.length, maxHeight, memoizedItemData, listRef, listContainerWidth]); // Update dependencies

	// Non-virtualized list for small datasets
	const RegularList = useCallback(() => {
		return (
			<div className="max-h-[288px] overflow-y-auto">
				{filteredOptions.map((item, index) => {
					const key = isComboboxOption(item) ? item.id : `group-${item.label}`;
					
					if (!isComboboxOption(item)) {
						return (
							<div
								key={key}
								className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-3)]"
							>
								{item.label}
							</div>
						);
					}

					const isSelected = value === item.value;
					const isHighlighted = highlightedIndex === index;

					return (
						<div
							key={key}
							role="option"
							aria-selected={isSelected}
							aria-disabled={item.disabled}
							onClick={() => {
								if (!item.disabled) {
									handleSelect(item.value);
								}
							}}
							onMouseEnter={() => setHighlightedIndex(index)}
							className={cn(
								"flex items-center px-3 py-2 cursor-pointer transition-colors",
								isHighlighted && "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
								!isHighlighted && isSelected && "bg-[var(--color-surface-3)]",
								item.disabled && "opacity-50 cursor-not-allowed"
							)}
						>
							<span className="flex-1 truncate">{item.label}</span>
							{isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
						</div>
					);
				})}
			</div>
		);
	}, [filteredOptions, value, highlightedIndex, handleSelect]);

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					ref={triggerRef}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					aria-haspopup="listbox"
					aria-controls="combobox-list"
					className={cn(
						"w-full justify-between",
						"bg-[var(--color-surface-2)] text-[var(--color-neutral)] border-[var(--color-border)]",
						"hover:bg-[var(--color-surface-3)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
						className
					)}
					disabled={disabled}
					onKeyDown={handleKeyDown}
				>
					<span className="truncate">
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<div className="flex items-center ml-2 gap-1 shrink-0">
						{clearable && value && (
							<X
								className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
								onClick={handleClear}
							/>
						)}
						<ChevronDown className="h-4 w-4 opacity-50" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[--radix-popover-trigger-width] p-0 bg-[var(--color-surface-2)] border-[var(--color-border)]"
				align="start"
				onOpenAutoFocus={(e) => {
					e.preventDefault();
					inputRef.current?.focus({ preventScroll: true });
				}}
			>
				<Command shouldFilter={false}>
					<div className="flex items-center border-b border-[var(--color-border)] px-3">
						<CommandInput
							ref={inputRef}
							placeholder={searchPlaceholder}
							value={searchTerm}
							onValueChange={setSearchTerm}
							className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-neutral)]/50"
							onKeyDown={handleKeyDown}
						/>
					</div>
					<CommandList ref={listContainerRef} id="combobox-list" role="listbox">
						{filteredOptions.length === 0 ? (
							<CommandEmpty className="py-6 text-center text-sm text-[var(--color-neutral)]/70">
								{noOptionsMessage}
							</CommandEmpty>
						) : virtualized && filteredOptions.length > 20 ? (
							<VirtualizedList />
						) : (
							<RegularList />
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}