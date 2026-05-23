"use client";

import { useState } from "react";
import SearchAuditBar, { AuditResult } from "@/components/compliance/search-audit-bar";
import TrustIndexCard from "@/components/compliance/trust-index-card";
import VerificationChecklist from "@/components/compliance/verification-checklist";
import ComplianceSummaryCard from "@/components/compliance/compliance-summary";

export default function CompliancePortal() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleAuditStart = () => {
    setIsLoading(true);
    setResult(null);
  };

  const handleAuditComplete = (data: AuditResult) => {
    setResult(data);
    setIsLoading(false);
  };

  const handleAuditError = (_error: string) => {
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* Premium Header Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              K-Trust Portal
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Enterprise compliance verification and corporate trust scoring
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">

          {/* Search & Audit Bar — Full Width Top */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <SearchAuditBar
              onAuditStart={handleAuditStart}
              onAuditComplete={handleAuditComplete}
              onAuditError={handleAuditError}
            />
          </div>

          {/* Trust Index Score Ring */}
          <div className="col-span-1">
            <TrustIndexCard
              score={result?.trust_score ?? null}
              riskLevel={result?.risk_level ?? null}
              isLoading={isLoading}
            />
          </div>

          {/* Verification Checklist */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <VerificationChecklist
              legalStatus={result?.legal_status ?? null}
              financialRisk={result?.financial_risk ?? null}
              sentimentScore={result?.sentiment_score ?? null}
              executiveStability={result?.executive_stability ?? null}
              isLoading={isLoading}
            />
          </div>

          {/* AI Compliance Summary — Full Width Bottom */}
          <ComplianceSummaryCard
            companyName={result?.company_name ?? null}
            platform={result?.platform ?? null}
            riskTags={result?.risk_tags ?? []}
            summary={result?.summary ?? null}
            isLoading={isLoading}
          />

        </div>
      </div>
    </main>
  );
}