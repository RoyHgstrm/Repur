"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function OstosVahvistusPage() {
  const searchParams = useSearchParams();
  const initialPurchaseId = searchParams.get("purchaseId");
  const checkoutSessionId = searchParams.get("checkoutSessionId");

  // State to manage the actual purchaseId used for polling
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(initialPurchaseId);
  const [pollingStatus, setPollingStatus] = useState<"loading" | "success" | "error" | "timeout">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch purchaseId from checkoutSessionId if available
  const { data: fetchedPurchaseIdData, isLoading: isFetchingPurchaseId, error: fetchPurchaseIdError } = api.purchases.getPurchaseIdByCheckoutSession.useQuery(
    { checkoutSessionId: checkoutSessionId ?? "" },
    {
      enabled: !!checkoutSessionId && !currentPurchaseId, // Only run if checkoutSessionId exists and we don't have a purchaseId yet
      onSuccess: (data) => {
        setCurrentPurchaseId(data.purchaseId);
      },
      onError: (err) => {
        setPollingStatus("error");
        setErrorMessage(err.message || "Ostotunnuksen hakeminen epäonnistui Stripe-sessiolta.");
      },
    }
  );

  // Poll for purchase status using the resolved purchaseId
  const { data, error } = api.purchases.getPurchaseStatus.useQuery(
    { purchaseId: currentPurchaseId ?? "" },
    {
      enabled: !!currentPurchaseId,
      refetchInterval: pollingStatus === "loading" ? 2000 : false, // Poll every 2 seconds if loading, otherwise stop
      retry: 3, // Retry a few times if there are network issues
      staleTime: 5000, // Consider data stale after 5 seconds to trigger refetchInterval
    }
  );

  useEffect(() => {
    if (!currentPurchaseId) {
      setPollingStatus("error");
      setErrorMessage("Ostotunnusta ei löytynyt. Ostosvahvistus epäonnistui.");
      return;
    }

    if (error) {
      setPollingStatus("error");
      setErrorMessage(`Virhe ostotapahtuman tilaa haettaessa: ${error.message}.`);
      return;
    }

    if (data) {
      if (data.status === "COMPLETED") {
        setPollingStatus("success");
        setErrorMessage(null);
      } else if (data.status === "PENDING") {
        // Still pending, continue polling
      } else {
        setPollingStatus("error");
        setErrorMessage(`Ostotapahtuman tila: ${data.status}. Ota yhteyttä asiakaspalveluun.`);
      }
    }
  }, [currentPurchaseId, data, error, pollingStatus]);

  // This useEffect handles the timeout for polling if no response is received in time.
  useEffect(() => {
    if (pollingStatus === "loading") {
      const timeoutId = setTimeout(() => {
        setPollingStatus("timeout");
        setErrorMessage("Ostotapahtuman vahvistus aikakatkaistiin. Ota yhteyttä asiakaspalveluun.");
      }, 15000); // 15-second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [pollingStatus]);

  let content;
  if (!currentPurchaseId) {
    content = (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Ostosvahvistus epäonnistui</AlertTitle>
        <AlertDescription>Ostotunnusta ei löytynyt. Yritä uudelleen tai ota yhteyttä asiakaspalveluun.</AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button asChild><Link href="/">Siirry etusivulle</Link></Button>
          <Button variant="outline" asChild><Link href="/yhteystiedot">Ota yhteyttä</Link></Button>
        </div>
      </Alert>
    );
  } else if (pollingStatus === "loading") {
    content = (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Vahvistetaan ostotapahtumaa...</AlertTitle>
        <AlertDescription>Tarkistamme ostoksesi tilaa. Tämä voi kestää hetken.</AlertDescription>
      </Alert>
    );
  } else if (pollingStatus === "success" && data?.status === "COMPLETED") {
    content = (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Osto vahvistettu!</AlertTitle>
        <AlertDescription>Kiitos ostoksestasi! Saat pian vahvistussähköpostin ja toimitustiedot.</AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button asChild><Link href="/">Siirry etusivulle</Link></Button>
          {data.companyListingId && (
            <Button variant="secondary" asChild><Link href={`/osta/${data.companyListingId}`}>Näytä tuote</Link></Button>
          )}
        </div>
      </Alert>
    );
  } else if (pollingStatus === "error" || pollingStatus === "timeout") {
    content = (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Ostosvahvistus epäonnistui</AlertTitle>
        <AlertDescription>{errorMessage || "Tapahtui virhe ostoksesi vahvistamisessa. Ota yhteyttä asiakaspalveluun antamalla ostotunnuksesi."}</AlertDescription>
        {currentPurchaseId && <p className="text-sm text-muted-foreground mt-2">Ostotunnus: {currentPurchaseId}</p>}
        <div className="flex gap-2 mt-4">
          <Button asChild><Link href="/">Siirry etusivulle</Link></Button>
          <Button variant="outline" asChild><Link href="/yhteystiedot">Ota yhteyttä</Link></Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-container py-section flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-2xl bg-[var(--color-surface-2)] border-[var(--color-border)]">
        <CardHeader>
          <CardTitle className="text-2xl-fluid font-semibold text-center">Ostoksen vahvistus</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
