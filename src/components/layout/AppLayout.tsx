import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import DemoBanner from './DemoBanner';

export default function AppLayout() {
  return (
    <div className="page-container">
      <DemoBanner />
      <Outlet />
      <BottomNav />
    </div>
  );
}
