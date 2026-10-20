import Badge from '../ui/Badge';
import type { ChargingStation } from '../../types';

/**
 * Availability pill. Uses tokens rather than hard-coded hex values so the
 * status reads the same in the station finder, the details page and the
 * discovery cards, and stays legible in both themes.
 */
const TONE_BY_STATUS = {
  Available: 'success',
  Busy: 'warning',
  'Out of Service': 'danger',
  'Coming Soon': 'neutral',
} as const;

const StationStatusBadge: React.FC<{ status: ChargingStation['availability']['status'] }> = ({
  status,
}) => (
  <Badge tone={TONE_BY_STATUS[status] ?? 'neutral'} dot>
    {status}
  </Badge>
);

export default StationStatusBadge;
