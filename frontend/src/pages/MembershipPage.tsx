import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Crown,
  DollarSign,
  Gift,
  Info,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import PageHero from '../components/layout/PageHero';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import Badge from '../components/ui/Badge';
import SectionHeading from '../components/ui/SectionHeading';
import { useAuth } from '../hooks/useAuth';
import type { LucideIcon } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: Record<BillingCycle, number>;
  icon: LucideIcon;
  features: PlanFeature[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For occasional charging and first-time EV owners.',
    price: { monthly: 0, yearly: 0 },
    icon: Users,
    features: [
      { name: 'Search the full station catalog', included: true },
      { name: 'Connector and speed filters', included: true },
      { name: 'Save stations in this browser', included: true },
      { name: 'Reviews and ratings', included: true },
      { name: 'Booking history', included: true },
      { name: 'Priority reservations', included: false },
      { name: 'Partner charging discounts', included: false },
      { name: 'Trip planning tools', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For drivers charging several times a month.',
    price: { monthly: 9.99, yearly: 99.99 },
    icon: Star,
    popular: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Priority reservations (24h ahead)', included: true },
      { name: 'Discounted per-kWh pricing', included: true },
      { name: 'Trip planning around chargers', included: true },
      { name: 'Priority support', included: true },
      { name: 'Fleet tools and reporting', included: false },
      { name: 'Dedicated account manager', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For fleets, teams and high-mileage drivers.',
    price: { monthly: 24.99, yearly: 249.99 },
    icon: Crown,
    features: [
      { name: 'Everything in Premium', included: true },
      { name: 'Fleet management tools', included: true },
      { name: 'Usage reporting and exports', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom billing terms', included: true },
      { name: 'Volume charging rates', included: true },
      { name: 'Onboarding workshop', included: true },
    ],
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: 'Know before you go',
    description: 'Connector type, peak power and current availability for every listed station.',
  },
  {
    icon: DollarSign,
    title: 'Compare the real price',
    description: 'Per-kWh and session fees side by side, so a cheap stop does not surprise you.',
  },
  {
    icon: Clock,
    title: 'Spend less time waiting',
    description: 'Filter for free connectors and keep every upcoming session in one list.',
  },
  {
    icon: MapPin,
    title: 'Plan around the map',
    description: 'See stations in context and sort by distance when you share your location.',
  },
  {
    icon: ShieldCheck,
    title: 'Sample data, clearly labelled',
    description: 'Anything simulated is marked in the interface — no invented live coverage claims.',
  },
  {
    icon: Gift,
    title: 'A single record',
    description: 'Bookings, wallet activity and saved stations live together in your account.',
  },
];

const FAQS = [
  {
    question: 'Can I change my plan at any time?',
    answer:
      'The plan structure supports upgrades and downgrades with prorated billing, but checkout is not connected in this demo build.',
  },
  {
    question: 'Which payment methods are supported?',
    answer:
      'The wallet screens model cards and bank accounts. No real payment provider is connected, so no card details are collected or stored.',
  },
  {
    question: 'Is there a contract?',
    answer: 'Plans are monthly or yearly with no long-term commitment in the product design.',
  },
  {
    question: 'What happens to my data?',
    answer:
      'This build stores favourites and your session in the browser. Station data comes from the bundled catalog or your local API.',
  },
];

const MembershipPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [notice, setNotice] = useState('');

  const currentPlan = user?.membershipLevel?.toLowerCase();

  const handleSelect = (plan: Plan) => {
    if (plan.price[billingCycle] === 0) {
      navigate('/signup');
      return;
    }
    setNotice(
      `Checkout is not available in this build, so no payment was taken for ${plan.name}. The plan comparison above is illustrative.`,
    );
  };

  return (
    <div>
      <PageHero
        eyebrow="Membership"
        title="Drive further. Spend less time hunting."
        description="Membership is designed around the parts of charging that cost you time: finding a free connector, knowing the price, and keeping a record of every session."
      >
        <div className="flex flex-wrap items-center gap-3">
          {isAuthenticated && user ? (
            <Badge tone="deep" icon={<Crown />}>
              Current plan: {user.membershipLevel}
            </Badge>
          ) : (
            <Badge tone="deep" dot>
              No account needed to search
            </Badge>
          )}
          <span className="text-xs text-deep-ink-muted">
            Plans are illustrative — billing is not connected.
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {notice && (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mb-8 flex max-w-3xl items-start gap-3 rounded-card border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-ink"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="text-warning-ink/80 transition-colors hover:text-warning-ink"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Billing cycle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Billing cycle">
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                aria-pressed={billingCycle === cycle}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  billingCycle === cycle
                    ? 'bg-brand text-on-accent'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                {cycle === 'yearly' && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                      billingCycle === 'yearly'
                        ? 'bg-black/15 text-on-accent'
                        : 'bg-brand-soft text-brand-soft-ink'
                    }`}
                  >
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = plan.price[billingCycle];
            const isCurrent = currentPlan === plan.name.toLowerCase();
            const savings = billingCycle === 'yearly' ? plan.price.monthly * 12 - plan.price.yearly : 0;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-card border p-6 sm:p-7 ${
                  plan.popular
                    ? 'border-brand/50 bg-surface shadow-card-hover'
                    : 'border-line bg-surface shadow-card'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-on-accent">
                    Most popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className={`ev-medallion ${plan.popular ? 'bg-brand text-on-accent' : ''}`}>
                    <Icon
                      className={`h-5 w-5 ${plan.popular ? 'text-on-accent' : 'text-brand-soft-ink'}`}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="ev-card-title text-ink">{plan.name}</h2>
                    {isCurrent && (
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brand">
                        Current plan
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="ev-figure text-[2.6rem] text-ink">
                    ${price.toFixed(price === 0 ? 0 : 2)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-ink-subtle">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
                <p className="mt-1 h-4 text-xs text-success-ink">
                  {savings > 0 ? `Save $${savings.toFixed(2)} per year` : ''}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-2.5 text-sm">
                      {feature.included ? (
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success-soft text-success-ink">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-subtle">
                          <X className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                      <span className={feature.included ? 'text-ink-muted' : 'text-ink-subtle line-through decoration-line-strong'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {isCurrent ? (
                    <Button variant="secondary" size="md" fullWidth disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'primary' : 'ghost'}
                      size="md"
                      fullWidth
                      onClick={() => handleSelect(plan)}
                      rightIcon={price > 0 ? <ArrowRight className="h-4 w-4" /> : undefined}
                    >
                      {price === 0 ? 'Create a free account' : `Choose ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-ink-subtle">
          Demo build: no payment provider is connected and no card details are collected. Choosing a
          paid plan shows an honest notice instead of a fake checkout.
        </p>

        {/* Benefits */}
        <section className="mt-20" aria-labelledby="membership-benefits-heading">
          <SectionHeading
            eyebrow="What you actually get"
            title="Built around the charging stop"
            description="No vague promises about coverage. These are the controls already in the product."
            id="membership-benefits-heading"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <span className="ev-medallion">
                  <benefit.icon className="h-5 w-5 text-brand-soft-ink" aria-hidden="true" />
                </span>
                <h3 className="ev-card-title mt-4 text-ink">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20" aria-labelledby="membership-faq-heading">
          <SectionHeading
            eyebrow="Questions"
            title="Before you choose a plan"
            id="membership-faq-heading"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-card border border-line bg-surface p-6">
                <h3 className="ev-card-title text-ink">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative mt-12 overflow-hidden rounded-[18px] border border-line bg-surface px-6 py-10 sm:px-8 lg:px-12">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ev-label">Start small</p>
              <h2 className="ev-title mt-3 max-w-xl text-ink">
                Search first. Decide on a plan when it earns its place.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
                The station finder and booking history work without a paid plan.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/search" variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Find a station
              </ButtonLink>
              <ButtonLink to={isAuthenticated ? '/dashboard' : '/signup'} variant="ghost" size="lg">
                {isAuthenticated ? 'Go to dashboard' : 'Create account'}
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MembershipPage;
