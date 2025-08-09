"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { ShieldCheck, Truck, Gauge, CheckCircle2 } from "lucide-react"
import { cn } from "~/lib/utils"
import { DialogClose } from "@radix-ui/react-dialog"

export interface EnhancedPurchaseDialogProps {
  trigger: React.ReactNode
  productTitle: string
  priceEUR: number
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  highlights?: Array<{ icon?: React.ReactNode; text: string }>
  className?: string
}

export function EnhancedPurchaseDialog({
  trigger,
  productTitle,
  priceEUR,
  onConfirm,
  confirmLabel = "Jatka",
  cancelLabel = "Peruuta",
  highlights,
  className,
}: EnhancedPurchaseDialogProps) {
  const defaultHighlights: Array<{ icon?: React.ReactNode; text: string }> = highlights ?? [
    { icon: <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />, text: "12 kuukauden takuu" },
    { icon: <Truck className="w-4 h-4 text-[var(--color-primary)]" />, text: "Ilmainen toimitus Suomessa" },
    { icon: <Gauge className="w-4 h-4 text-[var(--color-accent)]" />, text: "Testattu suorituskyky" },
    { icon: <CheckCircle2 className="w-4 h-4 text-[var(--color-secondary)]" />, text: "Selkeä hinnoittelu" },
  ]

  const formattedPrice = Number.isFinite(priceEUR) ? `${priceEUR} €` : "—"

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-xl", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl-fluid font-bold text-[var(--color-text-primary)]">
            Vahvista osto
          </DialogTitle>
          <DialogDescription>
            Tarkista tiedot ennen jatkamista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
            <div className="text-sm text-[var(--color-text-tertiary)]">Tuote</div>
            <div className="mt-1 text-base-fluid font-medium text-[var(--color-text-primary)]">{productTitle}</div>
            <div className="mt-3 text-sm text-[var(--color-text-tertiary)]">Hinta</div>
            <div className="mt-1 text-2xl-fluid font-extrabold text-gradient-primary">{formattedPrice}</div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Sisältyy kauppaan</div>
            <ul className="space-y-2">
              {defaultHighlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  {h.icon}
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="min-w-[8rem]">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            className={cn(
              "min-w-[10rem] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]",
              "hover:from-[var(--color-primary)]/90 hover:to-[var(--color-accent)]/90 text-white"
            )}
            onClick={onConfirm}
            data-testid="confirm-purchase"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedPurchaseDialog


