import BottomNav from './BottomNav';

// Merchant app frame: phone-width column with the bottom tab bar on every screen.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell app-shell">
      {children}
      <BottomNav />
    </div>
  );
}
