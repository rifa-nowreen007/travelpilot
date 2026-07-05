import { Link } from 'react-router-dom';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import PageWrapper from '../components/PageWrapper';

export default function NotFound() {
  return (
    <PageWrapper>
      <section className="max-w-lg mx-auto px-6 text-center py-24">
        <PiCompassRoseDuotone className="text-6xl text-teal-500 mx-auto mb-6 animate-float" />
        <h1 className="font-display text-4xl font-bold mb-3">Off the map</h1>
        <p className="text-midnight-900/60 dark:text-white/60 mb-8">
          The page you're looking for doesn't exist, or you've wandered somewhere TravelPilot hasn't charted yet.
        </p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </section>
    </PageWrapper>
  );
}
