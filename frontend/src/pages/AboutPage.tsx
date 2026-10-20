import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  MapPin, 
  Award, 
  Leaf, 
  Shield, 
  Clock, 
  Star, 
  ArrowRight 
} from 'lucide-react';
import Button from '../components/ui/Button';

const AboutPage: React.FC = () => {
  const stats = [
    { label: 'Charging Stations', value: '10,000+', icon: MapPin },
    { label: 'Happy Users', value: '50,000+', icon: Users },
    { label: 'Cities Covered', value: '200+', icon: Star },
    { label: 'CO₂ Saved', value: '2M kg', icon: Leaf }
  ];

  const features = [
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Find charging stations that are always open when you need them.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'All our partner stations are verified for safety and reliability.'
    },
    {
      icon: Zap,
      title: 'Fast Charging',
      description: 'Access to the fastest charging networks across the country.'
    },
    {
      icon: Award,
      title: 'Best Prices',
      description: 'Compare prices and find the most affordable charging options.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      bio: 'Former Tesla engineer with 10+ years in EV technology.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      bio: 'Tech visionary focused on sustainable transportation solutions.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Operations',
      bio: 'Operations expert ensuring seamless charging experiences.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-deep text-deep-ink">
        <div className="ev-grid ev-grid--center" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-4 flex justify-center">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-brand/25 bg-brand-soft">
                <Zap className="h-5 w-5 text-brand" />
              </div>
            </div>
            <h1 className="ev-display mx-auto max-w-[16ch] text-deep-ink">
              About ChargeEase
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-deep-ink-muted sm:text-base">
              Making electric vehicle charging simple, accessible, and reliable for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-11 lg:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="ev-title mb-3 text-ink">
                Our Mission
              </h2>
              <p className="mb-3 text-[0.95rem] leading-relaxed text-ink-muted">
                We believe that electric vehicle adoption should be effortless. Our mission is to 
                eliminate range anxiety by providing the most comprehensive, user-friendly platform
                for finding and booking charging stations.
              </p>
              <p className="mb-6 text-[0.95rem] leading-relaxed text-ink-muted">
                By connecting EV drivers with reliable charging infrastructure, we're accelerating 
                the transition to sustainable transportation and helping create a cleaner future for all.
              </p>
              <div className="flex space-x-4">
                <Button>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative"
            >
              <img
                src="/assets/charging-hardware.jpg"
                alt="Electric vehicle charging"
                className="aspect-[3/2] w-full rounded-card border border-line object-cover shadow-card"
              />
              <div className="absolute -bottom-4 right-2 rounded-card bg-brand p-4 text-on-accent shadow-lg sm:-right-4">
                <div className="text-center">
                  <div className="ev-figure text-2xl">5★</div>
                  <div className="text-xs font-medium">User Rating</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-line bg-surface-muted py-11 lg:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-9 text-center"
          >
            <h2 className="ev-title mb-2 text-ink">
              By the Numbers
            </h2>
            <p className="mx-auto max-w-2xl text-[0.95rem] text-ink-muted">
              Our platform continues to grow, connecting more EV drivers with charging solutions every day.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-brand/20 bg-brand-soft">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="ev-figure mb-1 text-[2rem] text-ink">
                    {stat.value}
                  </div>
                  <div className="text-sm text-ink-muted">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-11 lg:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-9 text-center"
          >
            <h2 className="ev-title mb-2 text-ink">
              Why Choose ChargeEase?
            </h2>
            <p className="mx-auto max-w-2xl text-[0.95rem] text-ink-muted">
              We've built the most comprehensive and user-friendly EV charging platform.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="rounded-card border border-line bg-surface p-5 text-center shadow-card"
                >
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-brand/20 bg-brand-soft">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="ev-card-title mb-1.5 text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="border-y border-line bg-surface-muted py-11 lg:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-9 text-center"
          >
            <h2 className="ev-title mb-2 text-ink">
              Meet Our Team
            </h2>
            <p className="mx-auto max-w-2xl text-[0.95rem] text-ink-muted">
              We're a passionate team of engineers, designers, and EV enthusiasts.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-card border border-line bg-surface p-5 text-center"
              >
                <div
                  aria-hidden="true"
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-brand/20 bg-brand-soft text-xl font-semibold text-brand"
                >
                  {member.name
                    .split(' ')
                    .map((part) => part.charAt(0))
                    .join('')}
                </div>
                <h3 className="ev-card-title mb-0.5 text-ink">
                  {member.name}
                </h3>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                  {member.role}
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-11 lg:py-14">
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="ev-title mb-2 text-ink">
              Ready to Start Your EV Journey?
            </h2>
            <p className="mx-auto mb-7 max-w-2xl text-[0.95rem] text-ink-muted">
              Join thousands of EV drivers who trust ChargeEase for their charging needs.
            </p>
            <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button
                size="lg"
                className="bg-brand text-on-accent hover:bg-brand-strong"
              >
                Find Charging Stations
              </Button>
              <Button
                size="lg"
                variant="outline"
              >
                Download App
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

