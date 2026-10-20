import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { ChargingStation } from '../../types';
import { formatPrice } from '../../utils/helpers';

/**
 * OpenStreetMap + Leaflet map.
 *
 * Tiles are served by the public OpenStreetMap tile servers. That service is
 * free but has a usage policy (no bulk downloading, attribution required, and
 * not intended to back high-traffic production apps). For production traffic,
 * point `TILE_URL` at your own tile server or a commercial provider, and keep
 * the attribution intact. See README "Maps and station data".
 */
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Build a lightweight div icon so we avoid Leaflet's bundler-unfriendly assets.
 *
 * Only the size is inline; the colour comes from CSS (`data-status` plus the
 * design tokens), so switching theme restyles every marker without rebuilding
 * the Leaflet icons.
 */
const buildIcon = (station: ChargingStation, selected: boolean) => {
  // 24px is the minimum comfortable target for a pointer or touch; the selected
  // marker grows so the active station is obvious without a second highlight.
  const size = selected ? 30 : 24;
  const status = station.availability.status.replace(/\s+/g, '-');
  return L.divIcon({
    className: 'chargeease-marker',
    html:
      `<span class="chargeease-dot${selected ? ' is-selected' : ''}" data-status="${status}" ` +
      `style="width:${size}px;height:${size}px"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface StationMapProps {
  stations: ChargingStation[];
  center?: { latitude: number; longitude: number };
  selectedId?: string | null;
  onSelect?: (station: ChargingStation) => void;
  height?: string;
  /** Shown when there are no stations to plot. */
  emptyMessage?: string;
}

const StationMap: React.FC<StationMapProps> = ({
  stations,
  center,
  selectedId = null,
  onSelect,
  height = '600px',
  emptyMessage = 'No stations to show on the map yet.',
}) => {
  const mapCenter = useMemo<[number, number]>(
    () => [center?.latitude ?? 37.7749, center?.longitude ?? -122.4194],
    [center?.latitude, center?.longitude],
  );

  const selected = stations.find((station) => station.id === selectedId) || null;

  return (
    <div className="chargeease-map relative rounded-card overflow-hidden border border-line" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={center ? 12 : 11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        {center && <Recenter center={mapCenter} />}
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={buildIcon(station, station.id === selectedId)}
            // Leaflet puts this on the marker element, which is a focusable
            // button; without it a keyboard or screen-reader user hears an
            // unnamed control.
            title={station.name}
            eventHandlers={{ click: () => onSelect?.(station) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-ink">{station.name}</p>
                <p className="text-xs text-ink-muted">{station.address}</p>
                <p className="text-xs mt-1">
                  {station.availability.status} · {station.availability.availableConnectors}/
                  {station.availability.totalConnectors} free
                </p>
                <p className="text-xs">
                  {station.pricing.perKwh != null
                    ? `${formatPrice(station.pricing.perKwh)}/kWh`
                    : 'Pricing varies'}
                  {station.distance != null && ` · ${station.distance} mi`}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {stations.length === 0 && (
        <div className="relative rounded-card overflow-hidden border border-deep-line p-6 shadow-card" style={{ backgroundImage: 'linear-gradient(135deg, rgb(17 24 31 / 0.8), rgb(5 7 8 / 0.6))' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand/5 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand/5 blur-3xl opacity-30" />
          </div>
          <span className="grid place-items-center w-16 h-16 mx-auto mb-4 rounded-control bg-surface-muted relative">
            <MapPin className="w-8 h-8 text-ink-subtle" aria-hidden="true" />
          </span>
          <p className="text-sm text-ink-muted">{emptyMessage}</p>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-surface rounded-control shadow-lg border border-line p-3 z-[400]">
          <p className="font-semibold text-sm text-ink">{selected.name}</p>
          <p className="text-xs text-ink-muted">{selected.address}</p>
        </div>
      )}
    </div>
  );
};

export default StationMap;
