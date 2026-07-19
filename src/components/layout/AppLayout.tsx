import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="page-container">
      <Outlet />
      <BottomNav />
    </div>
  );
}
