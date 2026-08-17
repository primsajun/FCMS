import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Settings, Save, AlertCircle, CheckCircle2, Activity, Trash2, FolderOpen, Radio } from 'lucide-react';
import { PREDEFINED_TEAMS } from './predefinedTeams';
import TeamInfoAdminView from './components/TeamInfoAdminView';
import ManagePlayerStats from './components/ManagePlayerStats';
import LiveMatchViewer from './components/LiveMatchViewer';

export default function AdminDashboard() {
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Hub states
  const [activeView, setActiveView] = useState(() => sessionStorage.getItem('fcms_admin_view') || 'hub'); // 'hub' | 'tables' | 'fixtures' | 'scheduler' | 'coaches' | 'history' | 'teams'
  
  useEffect(() => {
    sessionStorage.setItem('fcms_admin_view', activeView);
  }, [activeView]);
  const [activeLeague, setActiveLeague] = useState(39);
  
  // Pending coaches state
  const [pendingCoaches, setPendingCoaches] = useState([]);
  const [approvedTeams, setApprovedTeams] = useState([]);
  
  // Drill-down states
  const [selectedAdminTeam, setSelectedAdminTeam] = useState(null);
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  // Scheduler states
  const [schedLeague, setSchedLeague] = useState(39);
  const [schedHome, setSchedHome] = useState('');
  const [schedAway, setSchedAway] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [localLiveMatches, setLocalLiveMatches] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeView === 'live_matches') {
      fetchAdminData(); // Refresh on open
      const channel = supabase.channel('admin_live_matches_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'local_matches', filter: 'status=eq.live' },
          (payload) => {
            fetchAdminData(); // Brute force refresh for simplicity to get all current live matches
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeView]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: stData } = await supabase.from('custom_standings').select('*');
      const { data: mtData } = await supabase.from('live_fixtures').select('*').order('elapsed', { ascending: false });
      const { data: pendingCoachesData } = await supabase.from('profiles').select('*').eq('role', 'coach').eq('approval_status', 'pending');
      const { data: approvedTeamsData } = await supabase.from('profiles').select('*').eq('role', 'coach').eq('approval_status', 'approved').order('created_at', { ascending: false });
      const { data: logsData } = await supabase.from('audit_logs').select('*, created_by(*)').order('created_at', { ascending: false });
      const { data: sfData } = await supabase.from('custom_fixtures').select('*').order('match_date', { ascending: true });
      const { data: liveLocalData } = await supabase.from('local_matches').select('*').eq('status', 'live').order('match_date', { ascending: false });
      
      if (mtData) setMatches(mtData);
      if (liveLocalData) setLocalLiveMatches(liveLocalData);
      if (pendingCoachesData) setPendingCoaches(pendingCoachesData);
      if (approvedTeamsData) setApprovedTeams(approvedTeamsData);
      if (logsData) setAuditLogs(logsData);
      if (sfData) setScheduledMatches(sfData);

      // Merge predefined teams with any data that exists in Supabase
      const mergedStandings = PREDEFINED_TEAMS.map((team, index) => {
        const savedTeam = stData?.find(s => s.api_team_id === team.api_team_id && s.league_id === team.league_id);
        if (savedTeam) {
          return { ...savedTeam, temporary_id: savedTeam.id }; // Use DB ID
        } else {
          return {
            ...team,
            temporary_id: `temp_${team.league_id}_${team.api_team_id}`, // UI key
            rank: index + 1,
            played: 0, win: 0, draw: 0, lose: 0, goals_diff: 0, points: 0, custom_points: 0
          };
        }
      });

      setStandings(mergedStandings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, msg) => {
    setSaveStatus({ type, msg });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const deleteAuditLog = async (logId) => {
    if(!confirm("Are you sure you want to delete this log?")) return;
    try {
      const { error } = await supabase.from('audit_logs').delete().eq('id', logId);
      if (error) throw error;
      setAuditLogs(auditLogs.filter(log => log.id !== logId));
      showStatus('success', 'Log deleted successfully.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to delete log.');
    }
  };

  // --- STANDINGS HANDLERS ---
  const handleStatsChange = (tempId, field, value) => {
    const parsedValue = value === '' ? '' : parseInt(value) || 0;
    setStandings(prev => prev.map(s => s.temporary_id === tempId ? { ...s, [field]: parsedValue } : s));
  };

  const saveStandingsRow = async (team) => {
    try {
      const upsertData = {
        league_id: team.league_id,
        api_team_id: team.api_team_id,
        team_name: team.team_name,
        team_logo: team.team_logo,
        rank: team.rank,
        played: team.played,
        win: team.win,
        draw: team.draw,
        lose: team.lose,
        goals_diff: team.goals_diff,
        points: team.points,
        custom_points: team.custom_points
      };

      // If it has a real uuid, update it. If not, insert it (we check if temporary_id starts with 'temp_')
      if (team.id) {
        upsertData.id = team.id; 
      }

      // Upsert based on api_team_id & league_id would require a unique constraint. 
      // Since we didn't add one, we will use a basic select-then-update/insert
      if (team.id) {
        const { error } = await supabase.from('custom_standings').update(upsertData).eq('id', team.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('custom_standings').insert(upsertData).select();
        if (error) throw error;
        // Update local state with the new real ID so subsequent saves work as updates
        if (data && data.length > 0) {
           setStandings(prev => prev.map(s => s.temporary_id === team.temporary_id ? { ...s, id: data[0].id, temporary_id: data[0].id } : s));
        }
      }
      
      showStatus('success', `${team.team_name} points saved!`);
    } catch (error) {
      console.error(error);
      showStatus('error', `Failed to save ${team.team_name}.`);
    }
  };

  // --- SCHEDULER HANDLERS ---
  const scheduleMatch = async () => {
    if (!schedHome || !schedAway || !schedDate || !schedTime) {
      showStatus('error', 'Please fill in all fields.');
      return;
    }
    if (schedHome === schedAway) {
      showStatus('error', 'Home and away teams must be different.');
      return;
    }

    const homeTeam = PREDEFINED_TEAMS.find(t => t.api_team_id.toString() === schedHome);
    const awayTeam = PREDEFINED_TEAMS.find(t => t.api_team_id.toString() === schedAway);

    try {
      const { error } = await supabase.from('custom_fixtures').insert({
        league_id: schedLeague,
        home_team_id: homeTeam.api_team_id,
        home_team_name: homeTeam.team_name,
        home_team_logo: homeTeam.team_logo,
        away_team_id: awayTeam.api_team_id,
        away_team_name: awayTeam.team_name,
        away_team_logo: awayTeam.team_logo,
        match_date: schedDate,
        match_time: schedTime
      });
      if (error) throw error;

      showStatus('success', 'Match scheduled successfully!');
      // Reset fields
      setSchedHome('');
      setSchedAway('');
      setSchedDate('');
      setSchedTime('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to schedule match.');
    }
  };

  const deleteScheduledMatch = async (id) => {
    if(!confirm("Are you sure you want to delete this scheduled match?")) return;
    try {
      const { error } = await supabase.from('custom_fixtures').delete().eq('id', id);
      if (error) throw error;
      setScheduledMatches(scheduledMatches.filter(m => m.id !== id));
      showStatus('success', 'Match deleted successfully.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to delete match.');
    }
  };

  // ... (Matches handlers remain same, skipped to save space as focus is standings)
  
  if (loading) return <div className="admin-container"><div className="text-muted">Loading Admin Data...</div></div>;

  // Group Standings by League
  const plStandings = standings.filter(s => s.league_id === 39).sort((a,b) => b.custom_points - a.custom_points);
  const llStandings = standings.filter(s => s.league_id === 140).sort((a,b) => b.custom_points - a.custom_points);
  const uclStandings = standings.filter(s => s.league_id === 2).sort((a,b) => b.custom_points - a.custom_points);

  const renderLeagueTable = (title, teams) => (
    <div className="admin-card" style={{marginBottom: '2rem'}}>
      <h2 className="admin-card-title">{title} Editor</h2>
      <div className="admin-list">
        {teams.map(s => (
          <div key={s.temporary_id} className="admin-list-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <img src={s.team_logo} alt={s.team_name} style={{width: '24px'}} />
              <span style={{fontWeight: 'bold', width: '200px'}}>{s.team_name}</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>P</span>
                  <input type="number" className="admin-input" style={{width: '45px', textAlign: 'center', padding: '4px'}} value={s.played} onChange={(e) => handleStatsChange(s.temporary_id, 'played', e.target.value)} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>W</span>
                  <input type="number" className="admin-input" style={{width: '45px', textAlign: 'center', padding: '4px'}} value={s.win} onChange={(e) => handleStatsChange(s.temporary_id, 'win', e.target.value)} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>D</span>
                  <input type="number" className="admin-input" style={{width: '45px', textAlign: 'center', padding: '4px'}} value={s.draw} onChange={(e) => handleStatsChange(s.temporary_id, 'draw', e.target.value)} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>L</span>
                  <input type="number" className="admin-input" style={{width: '45px', textAlign: 'center', padding: '4px'}} value={s.lose} onChange={(e) => handleStatsChange(s.temporary_id, 'lose', e.target.value)} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>GD</span>
                  <input type="number" className="admin-input" style={{width: '55px', textAlign: 'center', padding: '4px'}} value={s.goals_diff} onChange={(e) => handleStatsChange(s.temporary_id, 'goals_diff', e.target.value)} />
                </div>
                <div style={{width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 4px', marginTop: '14px'}}></div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#aaa'}}>
                  <span>PTS</span>
                  <input type="number" className="admin-input" style={{width: '60px', textAlign: 'center', padding: '4px', fontWeight: 'bold'}} value={s.custom_points} onChange={(e) => handleStatsChange(s.temporary_id, 'custom_points', e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary btn-sm admin-save-btn" onClick={() => saveStandingsRow(s)} style={{marginTop: '14px'}}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (activeView === 'hub') {
    return (
      <div className="admin-container">
        <div className="admin-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 className="admin-title" style={{justifyContent: 'center'}}><Settings size={32} /> Super Admin Hub</h1>
          <p className="text-muted">Command center for manual data overrides.</p>
        </div>

        <div className="admin-grid">
          <div className="admin-card span-2" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}} onClick={() => setActiveView('live_matches')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444'}}>
              <div style={{width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
              Live Local Matches
            </h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Monitor all currently live matches in the app.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={() => setActiveView('tables')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Table Editor</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Manually edit points and standings for all leagues.</p>
          </div>
          
          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={() => setActiveView('fixtures')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Live Fixtures Editor</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Update live scores and match time manually.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={() => setActiveView('scheduler')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Match Scheduler</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Schedule upcoming matches to display on the Fixtures page.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease', position: 'relative'}} onClick={() => setActiveView('coaches')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {pendingCoaches.length > 0 && (
              <div style={{position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--accent-primary)', color: '#000', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
                {pendingCoaches.length}
              </div>
            )}
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Coach Approvals</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Review and approve newly registered coaches.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={() => setActiveView('teams')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}><FolderOpen size={24} style={{display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem'}}/> Team Directory</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>View all registered teams, rosters, and match schedules.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={() => setActiveView('history')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}><Activity size={24} style={{display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem'}}/> Update History</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>View and manage all coach activity logs globally.</p>
          </div>

          <div className="admin-card" style={{cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease', }} onClick={() => setActiveView('playerStats')} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <h2 className="admin-card-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}><Activity size={24} style={{display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem'}}/> Player Stats</h2>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>Manage top scorers and assists for the Home page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'teams') {
    if (selectedAdminTeam) {
      return <TeamInfoAdminView teamName={selectedAdminTeam.team_name} teamId={selectedAdminTeam.team_id} coachName={selectedAdminTeam.name} onBack={() => setSelectedAdminTeam(null)} />;
    }

    return (
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Team Directory</h1>
            <p className="text-muted">Select a team to view their players, schedules, and activity.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>
        
        <div className="admin-card">
          {approvedTeams.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No approved teams found.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
              {approvedTeams.map(team => {
                const teamDate = new Date(team.created_at);
                return (
                  <div key={team.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '8px', padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', cursor: 'pointer', transition: 'all 0.2s'}} onClick={() => setSelectedAdminTeam(team)} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(18, 18, 18, 0.4)'}>
                    <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>{team.team_name} <span style={{fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'normal'}}>({team.team_id})</span></h3>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Coach: <span style={{color: '#fff'}}>{team.name}</span></p>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem'}}>Mobile: <span style={{color: '#fff'}}>{team.mobile_number || team.mobile || '-'}</span></p>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem'}}>
                      <span>Registered on:</span>
                      <span>{teamDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'playerStats') {
    return <ManagePlayerStats onBack={() => setActiveView('hub')} />;
  }

  if (activeView === 'live_matches') {
    return (
      <div className="admin-container">
        <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 className="admin-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
              Global Live Matches
            </h1>
            <p className="text-muted">Monitor all active local matches happening right now.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>

        {localLiveMatches.length === 0 ? (
          <div className="card admin-card" style={{padding: '4rem', textAlign: 'center'}}>
            <Radio size={48} color="var(--text-muted)" style={{margin: '0 auto 1rem'}} />
            <h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>No Live Matches</h2>
            <p style={{color: 'var(--text-muted)'}}>There are no matches currently being played across any teams.</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: '2rem'}}>
            {localLiveMatches.map(match => (
              <div key={match.id} style={{position: 'relative'}}>
                <div style={{position: 'absolute', top: '-10px', left: '20px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.8)', padding: '0.2rem 1rem', borderRadius: '4px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold'}}>
                  {match.location}
                </div>
                <LiveMatchViewer liveMatch={match} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'history') {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Update History</h1>
            <p className="text-muted">Global audit logs for all coach actions.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>
        <div className="admin-card">
          {auditLogs.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No activity logs found.</div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {auditLogs.map(log => {
                const logDate = new Date(log.created_at);
                return (
                  <div key={log.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '8px', padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>{log.description}</div>
                      <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Team: <span style={{color: '#fff'}}>{log.team_name}</span> | By: {log.created_by?.name || 'Coach'}</div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                      <div style={{textAlign: 'right'}}>
                        <div style={{color: '#fff', fontWeight: 'bold'}}>{logDate.toLocaleDateString()}</div>
                        <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{logDate.toLocaleTimeString()}</div>
                      </div>
                      <button onClick={() => deleteAuditLog(log.id)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem'}}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'coaches') {
    const approveCoach = async (coachId) => {
      try {
        const { error } = await supabase.from('profiles').update({ approval_status: 'approved' }).eq('id', coachId);
        if (error) throw error;
        setPendingCoaches(pendingCoaches.filter(c => c.id !== coachId));
        setSaveStatus({ type: 'success', message: 'Coach approved successfully!' });
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        setSaveStatus({ type: 'error', message: 'Failed to approve coach.' });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    };

    return (
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Coach Approvals</h1>
            <p className="text-muted">Approve or reject coaches before they can manage teams.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>

        {saveStatus && (
          <div className="admin-notification" style={{backgroundColor: saveStatus.type === 'success' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: saveStatus.type === 'success' ? 'var(--accent-primary)' : '#ef4444'}}>
            {saveStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {saveStatus.message}
          </div>
        )}

        <div className="card admin-card">
          {pendingCoaches.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
              No pending coaches to approve right now.
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile Number</th>
                    <th>Team Name</th>
                    <th>Date Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCoaches.map(coach => (
                    <tr key={coach.id}>
                      <td style={{fontWeight: 'bold'}}>{coach.name}</td>
                      <td>{coach.email}</td>
                      <td>{coach.mobile_number || coach.mobile || '-'}</td>
                      <td style={{color: 'var(--accent-primary)'}}>{coach.team_name}</td>
                      <td>{new Date(coach.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}} onClick={() => approveCoach(coach.id)}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'scheduler') {
    const availableTeams = PREDEFINED_TEAMS.filter(t => t.league_id === schedLeague).sort((a,b) => a.team_name.localeCompare(b.team_name));

    return (
      <div className="admin-container">
         <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 className="admin-title">Match Scheduler</h1>
            <p className="text-muted">Create upcoming fixtures.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>

        {saveStatus && (
          <div className={`admin-alert ${saveStatus.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{marginBottom: '2rem'}}>
            {saveStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {saveStatus.msg}
          </div>
        )}

        <div className="admin-card" style={{maxWidth: '600px', margin: '0 auto'}}>
          <h2 className="admin-card-title" style={{marginBottom: '1.5rem'}}>Schedule a Match</h2>
          
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>League</label>
            <select className="admin-input" style={{width: '100%'}} value={schedLeague} onChange={(e) => { setSchedLeague(parseInt(e.target.value)); setSchedHome(''); setSchedAway(''); }}>
              <option value={39}>Premier League</option>
              <option value={140}>La Liga</option>
              <option value={2}>Champions League</option>
            </select>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>Home Team</label>
              <select className="admin-input" style={{width: '100%'}} value={schedHome} onChange={(e) => setSchedHome(e.target.value)}>
                <option value="">Select Home Team</option>
                {availableTeams.map(t => <option key={`home_${t.api_team_id}`} value={t.api_team_id}>{t.team_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>Away Team</label>
              <select className="admin-input" style={{width: '100%'}} value={schedAway} onChange={(e) => setSchedAway(e.target.value)}>
                <option value="">Select Away Team</option>
                {availableTeams.map(t => <option key={`away_${t.api_team_id}`} value={t.api_team_id}>{t.team_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>Date</label>
              <input type="date" className="admin-input" style={{width: '100%'}} value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>Time</label>
              <input type="time" className="admin-input" style={{width: '100%'}} value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary" style={{width: '100%'}} onClick={scheduleMatch}>
            <Save size={18} /> Schedule Match
          </button>
        </div>
        
        <div className="admin-card" style={{maxWidth: '600px', margin: '2rem auto 0'}}>
          <h2 className="admin-card-title" style={{marginBottom: '1.5rem'}}>Scheduled Matches</h2>
          {scheduledMatches.length === 0 ? (
            <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No matches scheduled.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {scheduledMatches.map(m => (
                <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{m.match_date}</span>
                      <span style={{fontWeight: 'bold', color: 'var(--accent-primary)'}}>{m.match_time}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <span style={{fontWeight: '500'}}>{m.home_team_name}</span>
                      <span style={{color: 'var(--text-muted)'}}>vs</span>
                      <span style={{fontWeight: '500'}}>{m.away_team_name}</span>
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{padding: '0.5rem', color: '#ef4444', borderColor: 'transparent'}} onClick={() => deleteScheduledMatch(m.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'fixtures') {
    return (
      <div className="admin-container">
         <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 className="admin-title">Live Fixtures Editor</h1>
            <p className="text-muted">Manage live match data</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
        </div>
        <div className="admin-card" style={{textAlign: 'center', padding: '3rem'}}>
          <p className="text-muted">Live fixtures editor coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="admin-title">Table Editor</h1>
          <p className="text-muted">Manually update league standings and points.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setActiveView('hub')}>Back to Hub</button>
      </div>

      {saveStatus && (
        <div className={`admin-alert ${saveStatus.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{position: 'sticky', top: '20px', zIndex: 100, marginBottom: '2rem'}}>
          {saveStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {saveStatus.msg}
        </div>
      )}

      <div className="league-filters" style={{marginBottom: '2rem', justifyContent: 'center'}}>
        <button className={`filter-pill ${activeLeague === 39 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(39)}>PREMIER LEAGUE</button>
        <button className={`filter-pill ${activeLeague === 140 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(140)}>LA LIGA</button>
        <button className={`filter-pill ${activeLeague === 2 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(2)}>CHAMPIONS LEAGUE</button>
      </div>

      {activeLeague === 39 && renderLeagueTable("Premier League", plStandings)}
      {activeLeague === 140 && renderLeagueTable("La Liga", llStandings)}
      {activeLeague === 2 && renderLeagueTable("Champions League", uclStandings)}

    </div>
  );
}



