'use client';
import { useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatCOPFull } from '../../utils/format';

export default function Settings() {
  const { profile, updateProfile, transactions, clearAllData } = useStore();
  const [name, setName] = useState(profile.name);
  const [income, setIncome] = useState(profile.monthlyIncomeGoal.toString());
  const [apiKey, setApiKey] = useState(profile.openAiKey || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const amt = parseFloat(income.replace(/\./g, ''));
    updateProfile({ name: name.trim() || profile.name, monthlyIncomeGoal: amt || profile.monthlyIncomeGoal, openAiKey: apiKey.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const txCount = transactions.length;
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-white">Perfil</h1>
      </div>

      {/* Avatar card */}
      <div className="mx-4 mb-3 card p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black">
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-base font-bold">{profile.name}</p>
          <p className="text-muted text-xs">Copiloto Financiero Personal</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mb-3 card p-3 flex">
        {[
          { label: 'Movimientos', value: txCount.toString(), color: 'text-white' },
          { label: 'Ingresos', value: transactions.filter((t) => t.type === 'income').length.toString(), color: 'text-success' },
          { label: 'Gastos', value: transactions.filter((t) => t.type === 'expense').length.toString(), color: 'text-primary' },
          { label: 'Rastreado', value: formatCOPFull(expense), color: 'text-white' },
        ].map((s, i) => (
          <div key={s.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            <p className="text-muted text-[9px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Settings form */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-3">Configuración</p>
        <div className="space-y-3">
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Tu nombre</label>
            <input
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sebastián"
            />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Meta de ingreso mensual (COP)</label>
            <input
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Ej: 5000000"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1">API Key OpenAI (opcional)</label>
            <p className="text-muted text-xs mb-1.5">Para análisis con IA real (GPT-4o mini)</p>
            <input
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              type="password"
              autoCapitalize="none"
            />
          </div>
          <button
            onClick={handleSave}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-colors ${saved ? 'bg-success' : 'bg-primary'}`}
          >
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-2">Acerca de la app</p>
        <div className="card divide-y divide-border">
          {[
            ['Versión', '1.0.0'],
            ['Moneda', 'COP (Peso Colombiano)'],
            ['Almacenamiento', 'Local en tu dispositivo'],
            ['IA', apiKey ? 'OpenAI conectado ✓' : 'Modo offline'],
            ['Instalación', 'PWA — instala desde Safari'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-secondary text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-2">Funcionalidades</p>
        <div className="card p-4 space-y-2.5">
          {[
            ['📝', 'Entrada por lenguaje natural'],
            ['🤖', 'Categorización automática con IA'],
            ['📊', 'Análisis de hábitos financieros'],
            ['🎯', 'Presupuesto por categorías'],
            ['🤔', 'Índice de satisfacción'],
            ['💡', 'Insights personalizados'],
            ['📈', 'Comparación mensual'],
            ['🧬', 'ADN financiero personal'],
          ].map(([icon, text]) => (
            <div key={icon} className="flex items-center gap-3">
              <span className="text-base">{icon}</span>
              <span className="text-secondary text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Install instructions */}
      <div className="mx-4 mb-3 rounded-2xl border p-4" style={{ backgroundColor: '#07101A', borderColor: '#1E3A5F' }}>
        <p className="text-blue-400 text-sm font-bold mb-2">📱 Instalar en iPhone</p>
        <ol className="text-secondary text-xs space-y-1.5">
          <li>1. Abre esta app en <strong className="text-white">Safari</strong></li>
          <li>2. Toca el botón <strong className="text-white">Compartir ↑</strong></li>
          <li>3. Selecciona <strong className="text-white">"Agregar a inicio"</strong></li>
          <li>4. Toca <strong className="text-white">Agregar</strong></li>
          <li>5. ¡Ya aparece en tu pantalla de inicio! 🎉</li>
        </ol>
      </div>

      {/* Danger zone */}
      <div className="px-4 mb-8">
        <p className="text-primary text-sm font-bold mb-2">Zona de peligro</p>
        <button
          onClick={() => { if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) clearAllData(); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-primary border border-primary/50 bg-primary/10"
        >
          🗑️ Borrar todos los datos
        </button>
      </div>
    </Layout>
  );
}
