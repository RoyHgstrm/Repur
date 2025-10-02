import type React from "react";
import { useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleComponentProps {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

export default function CollapsibleComponent({
	title,
	icon,
	children,
	defaultOpen = false,
}: CollapsibleComponentProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
			<CollapsibleTrigger asChild>
				<button
					className={cn(
						"flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200",
						"hover:bg-[var(--color-surface-3)] hover:text-[var(--color-primary)]",
						isOpen
							? "bg-[var(--color-surface-3)] text-[var(--color-primary)]"
							: "text-[var(--color-neutral)]/80",
					)}
				>
					<span className="flex items-center gap-3">
						{icon}
						{title}
					</span>
					{isOpen ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent className="pl-8 pr-4">
				<div className="space-y-2 py-1">{children}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
