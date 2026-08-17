import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { PREDEFINED_TEAMS } from '../predefinedTeams';

export default function ManagePlayerStats({ onBack }) {
  const [stats, setStats] = useState([]);
  const [league, setLeague] = useState('Premier League');
  const [statType, setStatType] = useState('goals');
  const [playerName, setPlayerName] = useState('');
  const [statValue, setStatValue] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('player_stats').select('*').order('stat_value', { ascending: false });
      if (error) throw error;
      if (data) setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, msg) => {
    setSaveStatus({ type, msg });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleAdd = async () => {
    if (!playerName || !statValue) {
      showStatus('error', 'Please fill in all fields');
      return;
    }
    
    try {
      const { data, error } = await supabase.from('player_stats').insert([
        { league, stat_type: statType, player_name: playerName, stat_value: parseInt(statValue), player_logo: teamLogo || 'https://media.api-sports.io/football/teams/0.png' }
      ]).select();
      
      if (error) throw error;
      
      const newStats = [...stats, data[0]];
      newStats.sort((a, b) => b.stat_value - a.stat_value);
      setStats(newStats);
      
      setPlayerName('');
      setStatValue('');
      setTeamLogo('');
      showStatus('success', 'Player stat added successfully');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to add stat');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;
    try {
      const { error } = await supabase.from('player_stats').delete().eq('id', id);
      if (error) throw error;
      setStats(stats.filter(s => s.id !== id));
      showStatus('success', 'Stat deleted');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to delete stat');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="admin-title">Manage Player Stats</h1>
          <p className="text-muted">Update top scorers and assists for the Home page.</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>Back to Hub</button>
      </div>

      {saveStatus && (
        <div className={`admin-notification`} style={{backgroundColor: saveStatus.type === 'success' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: saveStatus.type === 'success' ? 'var(--accent-primary)' : '#ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
          {saveStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {saveStatus.msg}
        </div>
      )}

      <div className="admin-grid" style={{gridTemplateColumns: '1fr 2fr', gap: '2rem'}}>
        <div className="card admin-card" style={{height: 'fit-content'}}>
          <h3 className="admin-card-title" style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Trophy size={20} className="text-accent" /> Add New Stat
          </h3>
          
          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>League</label>
            <select className="admin-input" style={{width: '100%'}} value={league} onChange={(e) => { setLeague(e.target.value); setTeamLogo(''); }}>
              <option value="Premier League">Premier League</option>
              <option value="La Liga">La Liga</option>
              <option value="Champions League">Champions League</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Serie A">Serie A</option>
              <option value="Ligue 1">Ligue 1</option>
            </select>
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Player Team (for Logo)</label>
            <select className="admin-input" style={{width: '100%'}} value={teamLogo} onChange={(e) => setTeamLogo(e.target.value)}>
              <option value="">-- Select Team --</option>
              {PREDEFINED_TEAMS.filter(t => t.league_id === (league === 'Premier League' ? 39 : league === 'La Liga' ? 140 : league === 'Champions League' ? 2 : league === 'Bundesliga' ? 78 : league === 'Serie A' ? 135 : 61)).map(t => (
                <option key={t.api_team_id} value={t.team_logo}>{t.team_name}</option>
              ))}
            </select>
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Stat Type</label>
            <select className="admin-input" style={{width: '100%'}} value={statType} onChange={(e) => setStatType(e.target.value)}>
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
            </select>
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Player Name</label>
            <input type="text" className="admin-input" style={{width: '100%'}} placeholder="e.g. Erling Haaland" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          </div>

          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Stat Value (Count)</label>
            <input type="number" className="admin-input" style={{width: '100%'}} placeholder="e.g. 14" value={statValue} onChange={(e) => setStatValue(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{width: '100%'}} onClick={handleAdd}>Add Stat</button>
        </div>

        <div className="card admin-card">
          <h3 className="admin-card-title" style={{marginBottom: '1rem'}}>Current Stats</h3>
          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : stats.length === 0 ? (
            <p className="text-muted">No stats found.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem'}}>
              {['Premier League', 'La Liga', 'Champions League', 'Bundesliga', 'Serie A', 'Ligue 1'].map(l => (
                <div key={l} style={{marginBottom: '1rem'}}>
                  <h4 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)'}}>{l}</h4>
                  {['goals', 'assists'].map(t => (
                    <div key={t} style={{marginBottom: '1rem', paddingLeft: '1rem'}}>
                      <h5 style={{color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'capitalize'}}>{t}</h5>
                      {stats.filter(s => s.league === l && s.stat_type === t).map(s => (
                        <div key={s.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '0.25rem'}}>
                          <span><strong>{s.player_name}</strong> - {s.stat_value}</span>
                          <button style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center'}} onClick={() => handleDelete(s.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {stats.filter(s => s.league === l && s.stat_type === t).length === 0 && <span className="text-muted" style={{fontSize: '0.8rem'}}>None</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
