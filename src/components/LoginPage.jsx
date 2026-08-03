import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Check approval status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
         throw new Error("Profile not found. Please contact support.");
      }

      if (profile.role === 'coach' || profile.role === 'player') {
         if (profile.approval_status === 'pending') {
            await supabase.auth.signOut();
            throw new Error(`Your ${profile.role} account is currently pending approval. Please check back later.`);
         }
         if (profile.approval_status === 'rejected') {
            await supabase.auth.signOut();
            throw new Error("Your account registration was rejected.");
         }
      }

      // Success! Pass profile data back up
      onLoginSuccess(profile);

    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', padding: '2.5rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <Trophy size={48} className="text-accent" style={{margin: '0 auto 1rem auto'}} />
          <h2 style={{fontSize: '1.8rem', fontWeight: 'bold'}}>Welcome Back</h2>
          <p style={{color: 'var(--text-muted)'}}>Sign in to access your football hub</p>
        </div>
        
        {error && (
          <div style={{marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.95rem'}}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)'}}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)'}}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none'}}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 'bold', justifyContent: 'center'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
          Don't have an account? <span onClick={onGoToRegister} style={{color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500'}}>Register here</span>
        </div>
      </div>
    </div>
  );
}

