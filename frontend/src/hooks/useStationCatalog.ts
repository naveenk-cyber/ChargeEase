// Single source of truth for the landing-page numbers and the city list.
//
// Every figure on the homepage is derived from the same station catalog the
// search page uses, so the landing page cannot advertise stations, cities or
// connector standards that the running system does not actually have. When the
// API is unreachable the shared demo fallback still answers, and `source`
// becomes 'demo' so the UI can say so.
import { useQuery } from '@tanstack/react-query';
import { stationService } from '../services/api';

/**
 * The API rejects `limit` values above 50 (MAX_LIMIT in backend
 * routes/stations.js), so the catalog page is fetched at exactly that size.
 */
export const CATALOG_PAGE_SIZE = 50;

export interface CatalogCounts {
  /** Total stations in the catalog, taken from the API's own count. */
  stations: number;
  /** Distinct connector standards present in the fetched catalog page. */
  connectorStandards: number;
  /** The connector standards themselves, for labelling the hero visual. */
  connectorTypes: string[];
  /** Distinct cities present in the fetched catalog page. */
  cities: number;
  isLoading: boolean;
  source?: 'database' | 'demo';
  error: Error | null;
}

/**
 * Shared catalog query. One cache entry means the hero, the city list and any
 * future consumer share a single network request and a single invalidation.
 */
export function useStationCatalog() {
  return useQuery({
    queryKey: ['stations', 'catalog'],
    queryFn: () => stationService.searchStations({ sort: 'name' }, 1, CATALOG_PAGE_SIZE),
    staleTime: 1000 * 60 * 5,
  });
}

/** Homepage-friendly slice of the shared catalog. */
export function useCatalogCounts(): CatalogCounts {
  const { data, error } = useStationCatalog();

  if (!data) {
    return {
      stations: 0,
      connectorStandards: 0,
      connectorTypes: [],
      cities: 0,
      isLoading: true,
      source: undefined,
      error: error ?? null,
    };
  }

  const connectorStandards = new Set<string>();
  const cities = new Set<string>();

  data.stations.forEach((station) => {
    station.connectorTypes?.forEach((connector) => {
      if (connector.type) connectorStandards.add(connector.type);
    });
    if (station.city) cities.add(station.city.trim().toLowerCase());
  });

  return {
    stations: data.total ?? data.stations.length,
    connectorStandards: connectorStandards.size,
    connectorTypes: [...connectorStandards].sort(),
    cities: cities.size,
    isLoading: false,
    source: data.source,
    error: null,
  };
}
