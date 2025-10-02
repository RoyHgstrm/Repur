import type * as React from "react";

import { cn } from "~/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-[var(--color-border)] placeholder:text-[var(--color-neutral)]/50 focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/40 aria-invalid:ring-[var(--color-error)]/20 aria-invalid:border-[var(--color-error)] flex field-sizing-content min-h-16 w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
