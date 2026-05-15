'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AddModal from './AddModal';

const TABS = [
  { href: '/', icon: '⌂', label: 'Inicio' },
  { href: '/transactions', icon: '≡', label: 'Movimientos' },
  { href: null, icon: '+', label: '' }, // FAB placeholder
  { href: '/subscriptions', icon: '⟳', label: 'Recurrentes' },
  { href: '/budget', icon: '◑', label: 'Presupuesto' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('finance_auth') !== '1') {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg">
      {/* Content */}
      <main className="flex-1 pb-nav overflow-auto">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border safe-bottom">
        <div className="flex items-center h-16">
          {TABS.map((tab, i) => {
            if (!tab.href) {
              return (
                <div key="fab" className="flex-1 flex justify-center items-center -mt-5">
                  <button
                    onClick={() => setAddOpen(true)}
                    className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-light shadow-lg shadow-primary/40 active:scale-95 transition-transform"
                    aria-label="Agregar"
                  >
                    +
                  </button>
                </div>
              );
            }
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
              >
                <span className={`text-xl leading-none transition-colors ${active ? 'text-primary' : 'text-muted'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[9px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
