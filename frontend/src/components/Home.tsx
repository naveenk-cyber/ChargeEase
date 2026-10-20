import React from 'react';
import Hero from './home/Hero';
import PlatformFacts from './home/PlatformFacts';
import PopularDestinations from './home/PopularDestinations';
import TopRatedSpots from './home/TopRatedSpots';
import HowItWorks from './home/HowItWorks';
import ChargingClub from './home/ChargingClub';
import { useCatalogCounts } from '../hooks/useStationCatalog';

const Home: React.FC = () => {
  const { stations, connectorStandards, cities, isLoading, source } = useCatalogCounts();

  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <section className="py-9 lg:py-12" aria-label="Platform at a glance">
          <PlatformFacts
            stationCount={stations}
            connectorStandards={connectorStandards}
            cities={cities}
            isLoading={isLoading}
            isDemo={source === 'demo'}
          />
        </section>

        <div className="h-px bg-line" />

        <div className="py-10 lg:py-14">
          <PopularDestinations />
        </div>

        <div className="h-px bg-line" />

        <div className="py-10 lg:py-14">
          <TopRatedSpots />
        </div>

        <div className="pb-10 lg:pb-14">
          <HowItWorks />
        </div>

        <div className="pb-12 lg:pb-16">
          <ChargingClub />
        </div>
      </div>
    </div>
  );
};

export default Home;
