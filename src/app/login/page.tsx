'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const USER = 'saldaf';
const PASS = 'Behetria1!';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('finance_auth') === '1') {
      router.replace('/');
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (username.trim() === USER && password === PASS) {
      setLoading(true);
      localStorage.setItem('finance_auth', '1');
      router.replace('/');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-4xl mx-auto mb-4">
            💰
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Finance</h1>
          <p className="text-muted text-sm">Tu copiloto financiero personal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Usuario</label>
            <input
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm placeholder-muted outline-none focus:border-primary transition-colors"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Contraseña</label>
            <input
              type="password"
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm placeholder-muted outline-none focus:border-primary transition-colors"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-center font-semibold" style={{ color: '#FF6B6B' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-base mt-2 disabled:opacity-50"
            style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
