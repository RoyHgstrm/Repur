import { SignIn } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <SignIn 
        appearance={{
          elements: {
            card: "bg-[var(--color-surface-2)] text-[var(--color-neutral)] border-[var(--color-border)] shadow-xl rounded-lg",
            headerTitle: "text-[var(--color-neutral)] text-2xl-fluid font-bold",
            headerSubtitle: "text-[var(--color-neutral)]/80",
            formFieldLabel: "text-[var(--color-neutral)]",
            formFieldInput: "bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-neutral)] focus:ring-2 focus:ring-[var(--color-primary)]/40",
            socialButtonsBlockButton: "bg-[var(--color-3)] hover:bg-[var(--color-surface-2)] text-[var(--color-neutral)]",
            footerActionLink: "text-[var(--color-primary)] hover:text-[var(--color-primary)]/80",
            footerActionText: "text-[var(--color-neutral)]/80"
          },
          layout: {
            socialButtonsVariant: "iconButton",
            showOptionalFields: false
          }
        }}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
      />
    </div>
  );
}