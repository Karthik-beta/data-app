'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Option can be a string or an object with value/label
type Option = string | { value: string; label: string };

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
    className?: string;
}

// Helper functions to normalize options
const getValue = (opt: Option): string => typeof opt === 'string' ? opt : opt.value;
const getLabel = (opt: Option): string => typeof opt === 'string' ? opt : opt.label;

export function MultiSelect({ options, selected, onChange, placeholder, className }: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(s => s !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    // Get display label for selected items
    const getSelectedLabel = (): string => {
        if (selected.length === 0) return placeholder;
        if (selected.length === 1) {
            const opt = options.find(o => getValue(o) === selected[0]);
            return opt ? getLabel(opt) : selected[0];
        }
        return `${selected.length} selected`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white h-9 font-normal',
                        className
                    )}
                >
                    <span className="truncate flex-1 text-left">
                        {getSelectedLabel()}
                    </span>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                        {selected.length > 0 && (
                            <span
                                onClick={clearAll}
                                className="h-4 w-4 p-0 hover:bg-slate-500 rounded flex items-center justify-center cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-slate-800 border-slate-600" align="start">
                <div className="max-h-60 overflow-auto">
                    {options.length === 0 ? (
                        <div className="p-2 text-sm text-slate-400 text-center">Loading...</div>
                    ) : (
                        options.map((option) => {
                            const value = getValue(option);
                            const label = getLabel(option);
                            const isSelected = selected.includes(value);

                            return (
                                <div
                                    key={value}
                                    onClick={() => handleSelect(value)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-slate-700 text-white',
                                        isSelected && 'bg-slate-700'
                                    )}
                                >
                                    <div className={cn(
                                        'h-4 w-4 border rounded flex items-center justify-center shrink-0',
                                        isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-slate-500'
                                    )}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="truncate">{label}</span>
                                </div>
                            );
                        })
                    )}
                </div>
                {selected.length > 0 && (
                    <div className="border-t border-slate-700 p-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-7 text-xs text-slate-400 hover:text-white"
                            onClick={() => { onChange([]); setOpen(false); }}
                        >
                            Clear all
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
