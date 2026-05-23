"use client";

import { useState, useEffect } from "react";

interface Merchant {
  merchant_id: string;
  company_name: string;
  platform: string;
}

interface SearchAuditBarProps {
  onAuditStart: () => void;
  onAuditComplete: (data: AuditResult) => void;
  onAuditError: (error: string) => void;
}

export interface AuditResult {
  merchant_id: string;
  company_name: string;
  platform: string;
  trust_score: number;
  risk_level: string;
  risk_tags: string[];
  legal_status: boolean;
  financial_risk: boolean;
  sentiment_score: boolean;
  executive_stability: boolean;
  summary: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SearchAuditBar({
  onAuditStart,
  onAuditComplete,
  onAuditError,
}: SearchAuditBarProps) {
  const [merchantId, setMerchantId] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-load available merchants for the hint list
  useEffect(() => {
    fetch(`${API_BASE}/merchants`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setMerchants(data);
      })
      .catch(() => {});
  }, []);

  const runAudit = async () => {
    if (!merchantId.trim()) return;
    setError(null);
    setIsLoading(true);
    onAuditStart();

    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: merchantId.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? `HTTP ${res.status}`);
      }

      const response = await res.json();
      onAuditComplete(response.data);
      
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred.";
      setError(message);
      onAuditError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 col-span-1 md:col-span-2 lg:col-span-3 flex flex-col gap-3">
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        {/* Input */}
        <input
          list="merchant-hints"
          type="text"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && runAudit()}
          placeholder="Enter Merchant ID (e.g. CPNG-KR-00421)"
          className="flex-1 rounded-lg bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          disabled={isLoading}
        />

        {/* Datalist hints */}
        <datalist id="merchant-hints">
          {merchants.map((m) => (
            <option key={m.merchant_id} value={m.merchant_id}>
              {m.company_name} — {m.platform}
            </option>
          ))}
        </datalist>

        {/* Button */}
        <button
          onClick={runAudit}
          disabled={isLoading || !merchantId.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isLoading ? "Running Audit…" : "Run Audit"}
        </button>
      </div>

      {/* Available IDs hint */}
      {merchants.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Available IDs:{" "}
          {merchants.map((m) => (
            <button
              key={m.merchant_id}
              onClick={() => setMerchantId(m.merchant_id)}
              className="font-mono text-primary hover:underline mr-2"
            >
              {m.merchant_id}
            </button>
          ))}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}