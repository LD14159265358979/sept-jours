'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requireSupabase } from '@/lib/supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(null);
    const client = requireSupabase();
    const result = mode === 'signin'
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({ email, password });
    setLoading(false);
    if (result.error) setMessage(result.error.message === 'Invalid login credentials' ? 'Adresse e-mail ou mot de passe incorrect.' : result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Compte créé. Consultez votre e-mail pour confirmer votre adresse.');
  }

  async function resetPassword() {
    if (!email) { setMessage('Saisissez d’abord votre adresse e-mail.'); return; }
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    setMessage(error ? error.message : 'Un lien de réinitialisation vient de vous être envoyé.');
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark"><Check /></span><span className="brand-name">Sept Jours</span></div>
        <div><p className="eyebrow">Votre semaine personnelle</p><h1>{mode === 'signin' ? 'Heureuse de vous revoir.' : 'Créer votre espace.'}</h1><p>Vos tâches et vos notes restent privées et se synchronisent entre vos appareils.</p></div>
        <form onSubmit={submit}>
          <label htmlFor="auth-email">Adresse e-mail</label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="auth-password">Mot de passe</label><span className="password-field"><Input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff /> : <Eye />}</button></span>
          {message && <output className="auth-message">{message}</output>}
          <Button type="submit" size="lg" disabled={loading}>{loading ? 'Connexion…' : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}</Button>
        </form>
        <div className="auth-links">
          {mode === 'signin' && <button type="button" onClick={resetPassword}>Mot de passe oublié ?</button>}
          <button type="button" onClick={() => { setMode((value) => value === 'signin' ? 'signup' : 'signin'); setMessage(null); }}>{mode === 'signin' ? 'Première visite ? Créer un compte' : 'J’ai déjà un compte'}</button>
        </div>
      </section>
    </main>
  );
}
