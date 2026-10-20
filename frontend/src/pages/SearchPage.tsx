import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Info,
  List,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import PageHero from '../components/layout/PageHero';
import SearchBar from '../components/home/SearchBar';
import StationCard from '../components/station/StationCard';
import StationMap from '../components/common/StationMap';
import Button from '../components/ui/Button';
import { stationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import type { ChargingSpeed, SearchFilters, SearchSort } from '../types';

const PAGE_SIZE = 12;
const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'distance', label: 'Nearest' },
  { value: 'price', label: 'Lowest price' },
  { value: 'rating', label: 'Best rated' },
  { value: 'speed', label: 'Fastest charging' },
  { value: 'name', label: 'Name (A–Z)' },
];

const CHIP =
  'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

function toggleValue<T extends string>(values: T[] | undefined, value: T): T[] {
  const current = values ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    return {
      query: searchParams.get('q') || undefined,
      connectorTypes: searchParams.get('connector') ? [searchParams.get('connector')!] : undefined,
      chargingSpeed: searchParams.get('speed')
        ? [searchParams.get('speed') as ChargingSpeed]
        : undefined,
      availability: searchParams.get('available') === '1' || undefined,
      sort: (searchParams.get('sort') as SearchSort) || 'distance',
      location:
        Number.isFinite(lat) && Number.isFinite(lng) && searchParams.get('lat')
          ? { latitude: lat, longitude: lng, radius: 25 }
          : undefined,
    };
  });
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(
    searchParams.get('view') === 'map' ? 'map' : 'list',
  );

  useEffect(() => {
    if (!favoriteMessage) return;
    const timer = window.setTimeout(() => setFavoriteMessage(''), 3200);
    return () => window.clearTimeout(timer);
  }, [favoriteMessage]);

  const { data: meta } = useQuery({
    queryKey: ['stations', 'filter-meta'],
    queryFn: () => stationService.getFilterMeta(),
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: result,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['stations', 'search', filters, page],
    queryFn: () => stationService.searchStations(filters, page, PAGE_SIZE),
  });

  const stations = result?.stations ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilterCount = useMemo(
    () =>
      (filters.connectorTypes?.length ?? 0) +
      (filters.chargingSpeed?.length ?? 0) +
      (filters.amenities?.length ?? 0) +
      (filters.operators?.length ?? 0) +
      (filters.availability ? 1 : 0) +
      (filters.query ? 1 : 0),
    [filters],
  );

  const updateFilters = useCallback((next: Partial<SearchFilters>, resetPage = true) => {
    setFilters((current) => ({ ...current, ...next }));
    if (resetPage) setPage(1);
  }, []);

  const syncParams = useCallback(
    (next: Partial<SearchFilters>) => {
      const params = new URLSearchParams(searchParams);
      const query = next.query;
      if (query) params.set('q', query);
      else params.delete('q');
      if (next.connectorTypes?.[0]) params.set('connector', next.connectorTypes[0]);
      else params.delete('connector');
      if (next.chargingSpeed?.[0]) params.set('speed', next.chargingSpeed[0]);
      else params.delete('speed');
      if (next.availability) params.set('available', '1');
      else params.delete('available');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleSearch = (next: SearchFilters) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
    syncParams(next);
  };

  const handleViewChange = (mode: 'list' | 'map') => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams);
    if (mode === 'map') params.set('view', 'map');
    else params.delete('view');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const next: SearchFilters = { sort: filters.sort };
    setFilters(next);
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleFavorite = (stationId: string, name: string) => {
    const saved = toggleFavorite(stationId);
    setFavoriteMessage(
      saved ? `${name} saved. Station added to your favourites.` : `${name} removed from favourites.`,
    );
  };

  const filterPanel = (
    <div id="search-filters" className="grid gap-6">
      {meta && (
        <>
          <fieldset>
            <legend className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Connector
            </legend>
            <div className="flex flex-wrap gap-2">
              {meta.connectorTypes.map((type) => {
                const active = filters.connectorTypes?.includes(type) ?? false;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updateFilters({ connectorTypes: toggleValue(filters.connectorTypes, type) })
                    }
                    className={`${CHIP} ${
                      active
                        ? 'border-brand bg-brand-soft text-brand-soft-ink'
                        : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Charging speed
            </legend>
            <div className="flex flex-wrap gap-2">
              {meta.chargingSpeeds.map((speed) => {
                const active = filters.chargingSpeed?.includes(speed as ChargingSpeed) ?? false;
                return (
                  <button
                    key={speed}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updateFilters({
                        chargingSpeed: toggleValue(
                          filters.chargingSpeed,
                          speed as ChargingSpeed,
                        ),
                      })
                    }
                    className={`${CHIP} ${
                      active
                        ? 'border-brand bg-brand-soft text-brand-soft-ink'
                        : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {speed}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Amenities
            </legend>
            <div className="flex flex-wrap gap-2">
              {meta.amenities.slice(0, 8).map((amenity) => {
                const active = filters.amenities?.includes(amenity) ?? false;
                return (
                  <button
                    key={amenity}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilters({ amenities: toggleValue(filters.amenities, amenity) })}
                    className={`${CHIP} ${
                      active
                        ? 'border-brand bg-brand-soft text-brand-soft-ink'
                        : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="operator-filter"
              className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle"
            >
              Network
            </label>
            <select
              id="operator-filter"
              value={filters.operators?.[0] ?? ''}
              onChange={(event) =>
                updateFilters({
                  operators: event.target.value ? [event.target.value] : undefined,
                })
              }
              className="h-10 w-full rounded-control border border-line bg-surface-muted px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            >
              <option value="">All networks</option>
              {meta.operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={Boolean(filters.availability)}
          onChange={(event) => updateFilters({ availability: event.target.checked || undefined })}
          className="h-4 w-4 rounded border-line-strong bg-surface-muted accent-[color:var(--color-brand)]"
        />
        Available now
      </label>

      <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
        Clear filters
      </Button>
    </div>
  );

  return (
    <div>
      <PageHero
        eyebrow="Station finder"
        title="Find your next charge"
        description="Search the ChargeEase catalog by place, connector and speed. Prices, power and availability come straight from the station feed."
      />

      <div className="relative z-10 mx-auto -mt-8 max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <SearchBar meta={meta} initialQuery={filters.query ?? ''} onSearch={handleSearch} />
      </div>

      <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Filters */}
          <aside className="w-full shrink-0 lg:w-[17.5rem]">
            <div className="flex items-center justify-between lg:hidden">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="search-filters"
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              >
                Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
              </Button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-brand hover:text-brand-strong"
                >
                  Clear all
                </button>
              )}
            </div>

            <div
              className={`${filtersOpen ? 'mt-4 block' : 'mt-4 hidden'} rounded-card border border-line bg-surface p-5 shadow-card lg:sticky lg:top-[88px] lg:mt-0 lg:block`}
            >
              <div className="mb-5 hidden items-center justify-between lg:flex">
                <h2 className="ev-card-title text-ink">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.7rem] font-semibold text-brand-soft-ink">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {filterPanel}
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <p role="status" aria-live="polite" className="text-sm text-ink-muted">
                {isPending
                  ? 'Searching stations…'
                  : `${total} station${total === 1 ? '' : 's'}`}
                {result?.source === 'demo' && (
                  <span className="ml-2 rounded-full border border-warning/35 bg-warning-soft px-2 py-0.5 text-[0.7rem] font-semibold text-warning-ink">
                    Demo mode
                  </span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-line bg-surface-muted p-1" role="group" aria-label="View mode">
                  <button
                    type="button"
                    onClick={() => handleViewChange('list')}
                    aria-pressed={viewMode === 'list'}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      viewMode === 'list' ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewChange('map')}
                    aria-pressed={viewMode === 'map'}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      viewMode === 'map' ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    Map
                  </button>
                </div>

                <label htmlFor="sort" className="sr-only">
                  Sort
                </label>
                <select
                  id="sort"
                  value={filters.sort ?? 'distance'}
                  onChange={(event) => updateFilters({ sort: event.target.value as SearchSort })}
                  className="h-9 rounded-full border border-line bg-surface-muted px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {result?.source === 'demo' && (
              <div className="mt-4 flex items-start gap-2.5 rounded-card border border-warning/30 bg-warning-soft px-4 py-3 text-xs leading-relaxed text-warning-ink">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  <strong className="font-semibold">Demo mode:</strong> the API could not be reached.
                  These are not real stations — they are bundled sample data so the finder stays
                  explorable.
                </p>
              </div>
            )}

            {favoriteMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 rounded-card border border-success/30 bg-success-soft px-4 py-2.5 text-xs font-medium text-success-ink"
              >
                {favoriteMessage}
              </p>
            )}

            <div className="mt-5">
              {isError ? (
                <div className="rounded-card border border-line bg-surface p-10 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-ink-subtle" aria-hidden="true" />
                  <h2 className="ev-card-title mt-4 text-ink">We could not complete that search.</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
                    {(error as Error)?.message || 'The station service did not respond.'}
                  </p>
                  <Button className="mt-5" onClick={() => refetch()} isLoading={isFetching}>
                    Try again
                  </Button>
                </div>
              ) : viewMode === 'map' ? (
                <div className="space-y-4">
                  <StationMap
                    stations={stations}
                    center={
                      filters.location
                        ? { latitude: filters.location.latitude, longitude: filters.location.longitude }
                        : undefined
                    }
                    selectedId={selectedId}
                    onSelect={(station) => setSelectedId(station.id)}
                    height="560px"
                    emptyMessage="No stations match these filters, so there is nothing to plot."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {stations.slice(0, 4).map((station) => (
                      <StationCard key={station.id} station={station} showActions />
                    ))}
                  </div>
                </div>
              ) : isPending ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[27rem] animate-pulse rounded-card border border-line bg-surface-muted"
                    />
                  ))}
                </div>
              ) : stations.length === 0 ? (
                <div className="rounded-card border border-line bg-surface p-10 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-ink-subtle" aria-hidden="true" />
                  <h2 className="ev-card-title mt-4 text-ink">No stations found</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                    Nothing in the catalog matches all of those filters. Try a wider search or
                    remove a filter.
                  </p>
                  <Button className="mt-5" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {stations.map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      showActions
                      cornerAction={
                        isAuthenticated ? (
                          <button
                            type="button"
                            onClick={() => handleFavorite(station.id, station.name)}
                            aria-label={
                              isFavorite(station.id)
                                ? `Remove ${station.name} from favourites`
                                : `Save ${station.name} to favourites`
                            }
                            aria-pressed={isFavorite(station.id)}
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors ${
                              isFavorite(station.id)
                                ? 'border-brand/40 bg-brand-soft text-brand'
                                : 'border-line bg-surface text-ink-subtle hover:text-ink'
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${isFavorite(station.id) ? 'fill-current' : ''}`}
                              aria-hidden="true"
                            />
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            aria-label={`Sign in to save ${station.name}`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-subtle transition-colors hover:border-brand/40 hover:text-brand"
                          >
                            <Heart className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!isError && stations.length > 0 && totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-between gap-3"
                aria-label="Search results pages"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <p className="text-xs text-ink-subtle">
                  Page {page} of {totalPages}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </nav>
            )}

            {stations.length > 0 && (
              <p className="mt-8 text-xs leading-relaxed text-ink-subtle">
                <Info className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                Availability, power and pricing are supplied by the station feed and can differ from
                what the operator charges on site.{' '}
                <Link to="/about" className="text-ink-muted underline underline-offset-2 hover:text-ink">
                  About the data
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
