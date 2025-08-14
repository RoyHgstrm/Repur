import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// HOW: This function merges multiple class names into a single string, resolving any conflicting Tailwind CSS classes.
// WHY: It provides a convenient and safe way to conditionally apply Tailwind CSS classes in components, preventing style conflicts and improving code readability.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HOW: This function removes all HTML tags from a string.
// WHY: It provides a simple way to sanitize user input and prevent XSS attacks.
export function sanitizeHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export { computePerformanceScore, getPerformanceTier } from '~/lib/performanceScoring'; // HOW: Re-export the new performance scoring functions.
                                                                                     // WHY: Centralizes performance logic in one module, ensuring consistency and easier maintenance.
