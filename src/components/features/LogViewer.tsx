"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function LogViewer() {
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [logLevel, setLogLevel] = useState<'info' | 'warn' | 'error' | 'all'>('all');

  const { data: logs, isLoading, refetch } = api.logs.getRecentLogs.useQuery(
    { limit, offset, searchTerm: searchTerm || undefined, logLevel: logLevel === 'all' ? undefined : logLevel },
    { refetchOnWindowFocus: false },
  );

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const handleFilterChange = () => {
    setOffset(0); // Reset offset when filters change
    void refetch();
  };

  return (
    <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)]">
      <CardHeader>
        <CardTitle className="text-2xl-fluid font-semibold flex items-center gap-2">
          Lokit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Hae viestistä..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={logLevel} onValueChange={(v) => setLogLevel(v as 'info' | 'warn' | 'error' | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Suodata tason mukaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kaikki tasot</SelectItem>
              <SelectItem value="info">INFO</SelectItem>
              <SelectItem value="warn">WARN</SelectItem>
              <SelectItem value="error">ERROR</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleFilterChange} variant="outline">
            Hae
          </Button>
        </div>
        {isLoading ? (
          <p className="text-[var(--color-text-secondary)] text-sm">
            Ladataan lokitietoja...
          </p>
        ) : (logs ?? []).length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-sm">
            Ei lokitietoja.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]/50">
                  <th className="py-2 pr-3">Aikaleima</th>
                  <th className="py-2 pr-3">Taso</th>
                  <th className="py-2 pr-3">Viesti</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => (
                  <tr key={log.id} className="border-b border-[var(--color-border)]/50">
                    <td className="py-2 pr-3">
                      {format(new Date(log.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: fi })}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={(
                          log.level === "error" ? "text-red-500" :
                          log.level === "warn" ? "text-yellow-500" :
                          "text-green-500"
                        )}
                      >
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-center">
              <Button onClick={handleLoadMore} variant="outline">
                Lataa lisää
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

