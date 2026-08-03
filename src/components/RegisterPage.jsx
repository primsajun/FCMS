import React, { useState } from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function RegisterPage({ onRegisterSuccess, onBackToLogin }) {
  const [role, setRole] = useState(null); // 'player' or 'coach'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Player specific
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [position, setPosition] = useState('');
  
  // Team specific
  const [teamSelectionType, setTeamSelectionType] = useState('existing'); // 'existing' or 'new'
  const [teamName, setTeamName] = useState('');
  const [teamId, setTeamId] = useState('');

  const validateTeamId = (id) => {
    return /^[A-Z]{4}[0-9]{4}$/.test(id);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (!teamName.trim()) {
      setError("Team name cannot be empty.");
      return;
    }

    if (!validateTeamId(teamId)) {
      setError("Team ID must be exactly 4 uppercase letters followed by 4 numbers (e.g. ABCD1234).");
      return;
    }

    setLoading(true);
    
    try {
      if (role === 'coach' && teamSelectionType === 'new') {
        const { data: existingIdCheck } = await supabase
          .from('custom_teams')
          .select('team_id')
          .eq('team_id', teamId.trim())
          .single();
          
        if (existingIdCheck) {
          throw new Error("This Team ID is already taken by another team. Please choose a different one.");
        }
      } else {
        const { data: existingTeam, error: queryError } = await supabase
          .from('custom_teams')
          .select('team_id, name')
          .eq('team_id', teamId.trim())
          .eq('name', teamName.trim());
          
        if (!existingTeam || existingTeam.length === 0) {
          throw new Error("No team found matching that Team Name and Team ID. Please verify with your coach.");
        }
      }

      // 2. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Registration failed. No user returned.");
      }

      const userId = authData.user.id;

      // 3. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role,
          name,
          email,
          mobile,
          mobile_number: role === 'coach' ? mobile : null,
          age: role === 'player' ? parseInt(age) : null,
          country: role === 'player' ? country : null,
          position: role === 'player' ? position : null,
          team_name: teamName.trim(),
          team_id: teamId.trim(),
          approval_status: 'pending'
        });

      if (profileError) throw profileError;

      // 4. Create custom team if a coach chose to create a new one
      if (role === 'coach' && teamSelectionType === 'new') {
        const { error: teamError } = await supabase
          .from('custom_teams')
          .insert({
            name: teamName.trim(),
            team_id: teamId.trim(),
            coach_id: userId
          });
          
        if (teamError) {
          console.warn("Failed to create custom team record.", teamError);
        }
      }

      // Success
      alert("Registration successful! Your account is now pending approval.");
      onRegisterSuccess();
      
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div style={{textAlign: 'center'}}>
      <h2 style={{fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Join the Platform</h2>
      <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Are you registering as a Player or a Coach?</p>
      
      <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
        <button 
          className="btn btn-outline" 
          style={{padding: '1.5rem', flex: '1', fontSize: '1.1rem'}}
          onClick={() => { setRole('player'); setStep(2); }}
        >
          ⚽ Register as Player
        </button>
        <button 
          className="btn btn-primary" 
          style={{padding: '1.5rem', flex: '1', fontSize: '1.1rem'}}
          onClick={() => { setRole('coach'); setStep(2); }}
        >
          📋 Register as Coach
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleRegister} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
        <button type="button" onClick={() => setStep(1)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto'}}>
          {role === 'coach' ? 'Coach Registration' : 'Player Registration'}
        </h2>
      </div>

      {error && (
        <div style={{padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5'}}>
          {error}
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Mobile Number</label>
          <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} style={inputStyle} placeholder="+1 234 567 8900" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email Address</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      </div>

      {role === 'player' && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
          <div>
            <label style={labelStyle}>Age</label>
            <input type="number" required value={age} onChange={e => setAge(e.target.value)} style={inputStyle} min="10" max="60" />
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <input type="text" required value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Position</label>
            <select required value={position} onChange={e => setPosition(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Attacker">Attacker</option>
            </select>
          </div>
        </div>
      )}

      {role === 'coach' && (
        <div style={{display: 'flex', gap: '1rem', marginBottom: '0.5rem'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff'}}>
            <input type="radio" checked={teamSelectionType === 'existing'} onChange={() => setTeamSelectionType('existing')} />
            Join Existing Team
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff'}}>
            <input type="radio" checked={teamSelectionType === 'new'} onChange={() => { setTeamSelectionType('new'); setTeamName(''); setTeamId(''); }} />
            Create New Team
          </label>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. Real Madrid" 
            value={teamName} 
            onChange={e => setTeamName(e.target.value)} 
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={labelStyle}>Team ID <span style={{fontSize: '0.8em', color: '#aaa'}}>(4 letters + 4 numbers)</span></label>
          <input 
            type="text" 
            required 
            placeholder="e.g. REAL1234" 
            value={teamId} 
            onChange={e => setTeamId(e.target.value.toUpperCase())} 
            style={inputStyle} 
            maxLength={8}
          />
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        <div>
          <label style={labelStyle}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} minLength="6" />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} minLength="6" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold', justifyContent: 'center'}}>
        {loading ? 'Registering...' : 'Register Account'}
      </button>
    </form>
  );

  return (
    <div className="login-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem'}}>
      <div className="card" style={{width: '100%', maxWidth: '600px', padding: '2.5rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
        
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <Trophy size={48} className="text-accent" style={{margin: '0 auto 1rem auto'}} />
        </div>

        {step === 1 ? renderRoleSelection() : renderForm()}
        
        <div style={{marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem'}}>
          Already have an account? <span onClick={onBackToLogin} style={{color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500'}}>Login here</span>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)'};
const inputStyle = {width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none'};

