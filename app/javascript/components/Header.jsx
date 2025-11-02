import React, { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function parseJsonDataset(el, key, fallback) {
  try {
    const value = el?.dataset?.[key];
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export const mountHeaderPropsFromDom = (el) => {
  if (!el) return { features: [], appName: 'App' };
  return {
    features: parseJsonDataset(el, 'features', []),
    appName: el.dataset.appName || 'App',
    signInPath: el.dataset.signinPath || '/signin',
    signUpPath: el.dataset.signupPath || '/signup',
  };
};

const ChevronDown = () => (
  <svg className="ml-1 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
  </svg>
);

const NavLink = ({ href, label, active }) => (
  <a
    href={href}
    className={
      `rounded-md px-3 py-2 text-sm font-medium transition-colors ` +
      (active ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
    }
  >
    {label}
  </a>
);

const Header = ({ features, appName }) => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : '');

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    const onHash = () => setHash(window.location.hash);
    onScroll();
    window.addEventListener('scroll', onScroll);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const items = useMemo(() => {
    return (features || []).map((f) => ({ href: `#${f.id}`, label: f.title }));
  }, [features]);

  const solutions = useMemo(() => {
    // Pick a few key features to show under Solutions
    const preferredIds = ['script-creation', 'ai-props', 'call-sheets'];
    const map = new Map(items.map((i) => [i.href.replace('#',''), i]));
    const picked = preferredIds
      .map((id) => map.get(id))
      .filter(Boolean);
    return picked.length ? picked : items.slice(0, 3);
  }, [items]);

  return (
    <header className={`sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex h-16 items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-bold">SG</span>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">{appName}</span>
          </a>

          <div className="hidden md:flex items-center gap-2 text-[15px]">
            <div className="relative group">
              <button className="inline-flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">
                Solutions <ChevronDown />
              </button>
              <div className="invisible absolute left-0 mt-2 w-[280px] rounded-xl border border-gray-100 bg-white p-2 text-sm shadow-lg group-hover:visible">
                {solutions.map((s) => (
                  <a key={s.href} href={s.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="relative group">
              <button className="inline-flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">
                Resources <ChevronDown />
              </button>
              <div className="invisible absolute left-0 mt-2 w-[260px] rounded-xl border border-gray-100 bg-white p-2 text-sm shadow-lg group-hover:visible">
                <a href="#" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">Docs</a>
                <a href="#" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">Blog</a>
                <a href="#" className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">Support</a>
              </div>
            </div>

            <NavLink href="#pricing" label="Pricing" active={hash === '#pricing'} />
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            ) : isAuthenticated ? (
              <>
                <a href="/dashboard" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {user?.picture && <img src={user.picture} alt={user.name} className="h-6 w-6 rounded-full" />}
                  <span>Dashboard</span>
                </a>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => loginWithRedirect()} className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Sign in
                </button>
                <button
                  onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-brand-600/10 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  Create account
                </button>
              </>
            )}
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-gray-700 animate-fade-in-up">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} active={hash === item.href} />
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <a href="/dashboard" className="rounded-md px-3 py-2 text-center font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                      Dashboard
                    </a>
                    <button
                      onClick={() => {
                        logout({ logoutParams: { returnTo: window.location.origin } });
                        setOpen(false);
                      }}
                      className="rounded-md px-3 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { loginWithRedirect(); setOpen(false); }} className="flex-1 rounded-md px-3 py-2 text-center font-medium text-gray-700 hover:bg-gray-50">
                      Sign in
                    </button>
                    <button onClick={() => { loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } }); setOpen(false); }} className="flex-1 inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
                      Create account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </header>
  );
};

export default Header;


