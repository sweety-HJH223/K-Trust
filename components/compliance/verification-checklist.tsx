"use client";

interface CheckItem {
  label: string;
  description: string;
  passed: boolean | null;
}

interface VerificationChecklistProps {
  legalStatus: boolean | null;
  financialRisk: boolean | null;
  sentimentScore: boolean | null;
  executiveStability: boolean | null;
  isLoading: boolean;
}

export default function VerificationChecklist({
  legalStatus,
  financialRisk,
  sentimentScore,
  executiveStability,
  isLoading,
}: VerificationChecklistProps) {
  const items: CheckItem[] = [
    {
      label: "Legal Registration",
      description: "No active litigation or regulatory violations",
      passed: legalStatus,
    },
    {
      label: "Financial Health",
      description: "Consistent tax filings and payment history",
      passed: financialRisk,
    },
    {
      label: "Public Sentiment",
      description: "Positive consumer feedback on Naver & Kakao",
      passed: sentimentScore,
    },
    {
      label: "Executive Stability",
      description: "No abrupt leadership changes detected",
      passed: executiveStability,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Verification Checklist
      </h2>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-0.5 flex-shrink-0">
              {isLoading || item.passed === null ? (
                <div className="w-5 h-5 rounded-full bg-gray-700 animate-pulse" />
              ) : item.passed ? (
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Text */}
            <div>
              <p className="text-sm font-medium text-foreground">
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>

            {/* Status text */}
            <div className="ml-auto text-xs font-medium flex-shrink-0 mt-0.5">
              {isLoading || item.passed === null ? (
                <span className="text-muted-foreground">—</span>
              ) : item.passed ? (
                <span className="text-green-400">Passed</span>
              ) : (
                <span className="text-red-400">Failed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}