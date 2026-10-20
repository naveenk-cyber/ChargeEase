import { Compass } from 'lucide-react';
import ButtonLink from '../components/ui/ButtonLink';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <Compass className="w-14 h-14 text-ink-subtle mx-auto mb-4" aria-hidden="true" />
      <h1 className="ev-display text-ink mb-2">404</h1>
      <p className="ev-body text-ink-muted mb-6">
        We could not find that page. It may have moved, or the link may be incorrect.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <ButtonLink to="/">Go home</ButtonLink>
        <ButtonLink to="/search" variant="outline">
          Find a station
        </ButtonLink>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
