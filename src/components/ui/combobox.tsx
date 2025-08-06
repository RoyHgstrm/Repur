"use client"

import * as React from 'react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FixedSizeList as List } from 'react-window'
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  // CommandItem // Removed, as it's replaced by div for custom handling
} from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type GroupItem = { type: 'group', label: string };

export interface ComboboxOption {
  id: string;
  label: string;
  value: string;
  group?: string;
  disabled?: boolean;
  searchTerms?: string[];
}

type ComboboxListItem = ComboboxOption | GroupItem;

function isComboboxOption(item: ComboboxListItem): item is ComboboxOption {
  return (item as ComboboxOption).label !== undefined;
}

const groupOptions = (items: ComboboxOption[], key: string) => {
  const groupedItems: ComboboxListItem[] = [];
  const groupMap: Record<string, ComboboxOption[]> = {};

  // Group items
  items.forEach(item => {
    const groupKey = item[key as keyof ComboboxOption] as string || 'Muut';
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = [];
    }
    groupMap[groupKey].push(item);
  });

  // Create grouped list with headers
  Object.keys(groupMap).sort().forEach(groupName => {
    groupedItems.push({ type: 'group', label: groupName });
    groupedItems.push(...groupMap[groupName]);
  });

  return groupedItems;
};

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  groupBy?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
}

export function Combobox(props: ComboboxProps) {
  const {
    options,
    value,
    onValueChange,
    placeholder = 'Valitse...',
    disabled = false,
    className,
    groupBy,
    searchPlaceholder = 'Etsi...',
    noOptionsMessage = 'Ei tuloksia'
  } = props;

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<List>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prepare options with optional grouping
  const flattenedOptions: ComboboxListItem[] = groupBy 
    ? groupOptions(options, groupBy) 
    : options;

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return flattenedOptions.filter(item => {
      // Skip group headers
      if (!isComboboxOption(item)) return true;
      
      // Check if item matches search term
      const matchesSearch = 
        item.label.toLowerCase().includes(lowerSearchTerm) ||
        item.searchTerms?.some(term => 
          term.toLowerCase().includes(lowerSearchTerm)
        );
      
      return matchesSearch && !item.disabled;
    });
  }, [flattenedOptions, searchTerm]);

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
        setHighlightedIndex(nextIndex);
        // Skip group headers
        while (
          nextIndex < filteredOptions.length && 
          !isComboboxOption(filteredOptions[nextIndex])
        ) {
          setHighlightedIndex(prevIndex => Math.min(prevIndex + 1, filteredOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(highlightedIndex - 1, 0);
        setHighlightedIndex(prevIndex);
        // Skip group headers
        while (
          prevIndex >= 0 && 
          !isComboboxOption(filteredOptions[prevIndex])
        ) {
          setHighlightedIndex(prevIndex => Math.max(prevIndex - 1, 0));
        }
        break;
      case 'Enter':
        e.preventDefault();
        const highlightedItem = filteredOptions[highlightedIndex];
        if (isComboboxOption(highlightedItem)) {
          onValueChange?.(highlightedItem.value);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [open, highlightedIndex, filteredOptions, onValueChange]);

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(highlightedIndex);
    }
  }, [highlightedIndex]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, filteredOptions]);

  const VirtualizedList = () => {
    const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
      const item = filteredOptions[index];
      
      // Group header rendering
      if (!isComboboxOption(item)) {
        return (
          <div 
            style={style} 
            className="px-2 py-1 text-xs font-semibold text-[var(--color-neutral)]/70 bg-[var(--color-surface-3)] border-b border-[var(--color-border)]"
          >
            {item.label}
          </div>
        );
      }

      // Option rendering
      const isSelected = item.value === value;
      const isHighlighted = index === highlightedIndex;
      const handleSelect = () => {
        if (!item.disabled) {
          onValueChange?.(item.value);
          setOpen(false);
        }
      };
      return (
        <div
          key={`${item.id}-${index}`}
          style={style}
          tabIndex={0}
          role="option"
          aria-selected={isHighlighted}
          className={cn(
            "relative flex select-none items-center px-2 py-2 text-sm outline-none cursor-pointer",
            isSelected && "bg-[var(--color-primary)] text-[var(--color-surface-inverse)]",
            isHighlighted && !isSelected && "bg-[var(--color-surface-3)] text-[var(--color-neutral)]",
            item.disabled && "text-[var(--color-neutral)]/50 cursor-not-allowed pointer-events-none"
          )}
          onClick={handleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSelect();
            }
          }}
        >
          {isSelected && (
            <Check className="mr-2 h-4 w-4" />
          )}
          {item.label}
        </div>
      );
    };

    return (
      <List
        ref={listRef}
        height={250}
        itemCount={filteredOptions.length}
        itemSize={36}
        width="100%"
      >
        {Row}
      </List>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "bg-[var(--color-surface-2)] text-[var(--color-neutral)] border-[var(--color-border)] hover:bg-[var(--color-surface-3)]",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0 bg-[var(--color-surface-2)] border-[var(--color-border)]"
        align="start"
      >
        <Command 
          filter={(value, search) => 
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-[var(--color-border)] px-3">
            <CommandInput
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-neutral)]/50 disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={handleKeyDown}
            />
          </div>
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty className="py-6 text-center text-sm text-[var(--color-neutral)]/70">
                {noOptionsMessage}
              </CommandEmpty>
            ) : (
              <VirtualizedList />
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}