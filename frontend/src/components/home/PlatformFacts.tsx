import type React from 'react';
import { Building2, Info, MapPin, PlugZap, ShieldCheck } from 'lucide-react';

interface PlatformFactsProps {
  stationCount?: number;
  connectorStandards?: number;
  cities?: number;
  isLoading?: boolean;
  isDemo?: boolean;
}

/**
 * Statistics and feature indicators.
 *
 * Three of the four figures are measured from the running catalog (stations,
 * connector standards, cities). Nothing here is a usage, coverage or customer
 * claim, because this build has no telemetry to support one.
 */
const PlatformFacts: React.FC<PlatformFactsProps> = ({
  stationCount,
  connectorStandards,
  cities,
  isLoading = false,
  isDemo = false,
}) => {
  const facts = [
    {
      icon: MapPin,
      value: isLoading ? '…' : stationCount != null ? String(stationCount) : '—',
      label: 'Stations available',
      detail: 'From the seeded catalog',
    },
    {
      icon: PlugZap,
      value: isLoading ? '…' : connectorStandards != null ? String(connectorStandards) : '—',
      label: 'Connector standards',
      detail: 'Across the catalog',
    },
    {
      icon: Building2,
      value: isLoading ? '…' : cities != null ? String(cities) : '—',
      label: 'Cities with coverage',
      detail: 'Where stations are seeded',
    },
    {
      icon: ShieldCheck,
      value: 'Free',
      label: 'Cost to run',
      detail: 'No paid services used',
    },
  ];

  return (
    <section aria-labelledby="platform-facts-heading">
      <h2 id="platform-facts-heading" className="sr-only">
        Platform at a glance
      </h2>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-card border border-line bg-surface p-5 shadow-card"
          >
            {/* Circular medallion with a blurred accent wash behind the glyph. */}
            <span className="ev-medallion mb-4 h-10 w-10">
              <fact.icon className="h-5 w-5 text-brand-soft-ink" aria-hidden="true" />
            </span>
            <dd className="ev-figure text-[2.1rem] leading-none text-ink">
              {fact.value}
            </dd>
            <dt className="ev-card-title mt-2.5 text-ink">{fact.label}</dt>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">{fact.detail}</p>
          </div>
        ))}
      </dl>

      {isDemo && (
        <p className="flex items-start gap-2 mt-4 text-xs text-warning-ink">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          Demo data — the API is unreachable, so these figures come from the bundled sample
          stations rather than your local database.
        </p>
      )}
    </section>
  );
};

export default PlatformFacts;
