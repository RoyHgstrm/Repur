import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "~/lib/utils"

const ToastProvider = ToastPrimitives.Provider
const ToastViewport = ToastPrimitives.Viewport

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-neutral)] shadow-lg",
        destructive:
          "destructive group border-[var(--color-error)] bg-[var(--color-error)] text-[var(--color-surface-inverse)]",
        success:
          "border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-surface-inverse)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastHeader = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-[var(--color-neutral)]", className)}
    {...props}
  />
))
ToastHeader.displayName = "ToastHeader"

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 text-[var(--color-neutral)]/90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-[var(--color-neutral)]/50 opacity-0 transition-opacity hover:text-[var(--color-neutral)] focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-[var(--color-error)]/30 group-[.destructive]:hover:text-[var(--color-error)]/50",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm font-medium transition-colors hover:bg-[var(--color-surface-3)] focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

export {
  Toast,
  ToastHeader,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastProvider,
  ToastViewport,
}

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast> &
  VariantProps<typeof toastVariants>
export type ToastProviderProps = React.ComponentPropsWithoutRef<typeof ToastProvider>