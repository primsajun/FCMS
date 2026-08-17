import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, CheckCircle2, AlertCircle, Users, CalendarDays, Edit2, X, Plus, Play, Clock, History, Activity, Radio } from 'lucide-react';
import LiveMatchEditor from './LiveMatchEditor';
import LiveMatchViewer from './LiveMatchViewer';
import { logAction } from '../utils/logger';

export default function CoachHub({ currentUser }) {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('fcms_coach_tab') || 'approvals'); // 'approvals', 'squad', 'schedule'
  
  useEffect(() => {
    sessionStorage.setItem('fcms_coach_tab', activeTab);
  }, [activeTab]);
  
  // Data states
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [approvedPlayers, setApprovedPlayers] = useState([]);
  const [localMatches, setLocalMatches] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // Edit Player Modal state
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Live Match Editor state (for managing)
  const [activeLiveMatch, setActiveLiveMatch] = useState(null);

  // Live Match Viewer state (for viewing)
  const [liveMatch, setLiveMatch] = useState(null);

  // New Match state
  const [matchForm, setMatchForm] = useState({ opponent: '', opponentId: '', date: '', time: '', location: '' });

  useEffect(() => {
    if (currentUser && currentUser.team_id) {
      fetchCoachData();
    }
  }, [currentUser, activeTab]);

  const fetchCoachData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'approvals') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player')
          .eq('team_id', currentUser.team_id)
          .eq('approval_status', 'pending');
        if (error) throw error;
        if (data) setPendingPlayers(data);
      } 
      else if (activeTab === 'squad') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player')
          .eq('team_id', currentUser.team_id)
          .eq('approval_status', 'approved');
        if (error) throw error;
        if (data) setApprovedPlayers(data);
      }
      else if (activeTab === 'live') {
        const { data, error } = await supabase
          .from('local_matches')
          .select('*')
          .or(`team_id.eq.${currentUser.team_id},opponent_id.eq.${currentUser.team_id}`)
          .eq('status', 'live')
          .single();
        if (error && error.code !== 'PGRST116') console.error(error);
        if (data) setLiveMatch(data);
        else setLiveMatch(null);
      }
      else if (activeTab === 'schedule') {
        const { data, error } = await supabase
          .from('local_matches')
          .select('*')
          .or(`team_id.eq.${currentUser.team_id},opponent_id.eq.${currentUser.team_id}`)
          .order('match_date', { ascending: true });
        if (error) throw error;
        if (data) setLocalMatches(data);
      }
      else if (activeTab === 'activity') {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, created_by(*)')
          .eq('team_name', currentUser.team_name)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, message) => {
    setSaveStatus({ type, message });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const approvePlayer = async (playerId, playerName) => {
    try {
      const { error } = await supabase.from('profiles').update({ approval_status: 'approved' }).eq('id', playerId);
      if (error) throw error;
      setPendingPlayers(pendingPlayers.filter(p => p.id !== playerId));
      showMessage('success', 'Player approved successfully!');
      
      await logAction(currentUser.team_name, 'player_approved', `Approved player ${playerName}`, currentUser.id);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to approve player.');
    }
  };

  // Realtime subscription for Live Match updates
  useEffect(() => {
    if (activeTab === 'live' && currentUser?.team_id) {
      const channel = supabase.channel('coach_live_match_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'local_matches' },
          (payload) => {
            // Only update if it's relevant to this team
            if (payload.new && (payload.new.team_id === currentUser.team_id || payload.new.opponent_id === currentUser.team_id)) {
              if (payload.new.status === 'live') {
                setLiveMatch(payload.new);
              } else {
                setLiveMatch(null);
              }
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab, currentUser]);

  const updatePlayer = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('profiles').update({
        name: editingPlayer.name,
        age: editingPlayer.age,
        country: editingPlayer.country,
        position: editingPlayer.position,
        mobile: editingPlayer.mobile
      }).eq('id', editingPlayer.id);
      
      if (error) throw error;
      
      setApprovedPlayers(approvedPlayers.map(p => p.id === editingPlayer.id ? editingPlayer : p));
      setEditingPlayer(null);
      showMessage('success', 'Player details updated!');
      
      await logAction(currentUser.team_name, 'player_updated', `Updated details for ${editingPlayer.name}`, currentUser.id);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to update player.');
    }
  };

  const handleScheduleMatch = async (e) => {
    e.preventDefault();
    try {
      if (!matchForm.opponentId) {
        showMessage('error', 'Opponent Team ID is required.');
        return;
      }
      const { data: opponentCheck, error: opError } = await supabase
        .from('custom_teams')
        .select('*')
        .eq('team_id', matchForm.opponentId.trim().toUpperCase())
        .eq('name', matchForm.opponent.trim())
        .single();
        
      if (opError || !opponentCheck) {
         showMessage('error', 'Opponent Team not found with that Name and ID.');
         return;
      }

      // Combine date and time
      const matchDateStr = `${matchForm.date}T${matchForm.time}:00`;
      const matchDate = new Date(matchDateStr);
      
      const { error } = await supabase.from('local_matches').insert({
        team_name: currentUser.team_name,
        team_id: currentUser.team_id,
        opponent: opponentCheck.name,
        opponent_id: opponentCheck.team_id,
        creator_id: currentUser.id,
        match_date: matchDate.toISOString(),
        location: matchForm.location,
        status: 'requested'
      });
      
      if (error) throw error;
      
      setMatchForm({ opponent: '', opponentId: '', date: '', time: '', location: '' });
      showMessage('success', 'Match requested successfully!');
      
      await logAction(currentUser.team_name, 'match_requested', `Requested a match against ${matchForm.opponent} on ${matchForm.date}`, currentUser.id);
      
      fetchCoachData(); // refresh list
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to request match.');
    }
  };

  const handleAcceptMatch = async (match) => {
    try {
      const { error } = await supabase.from('local_matches').update({ status: 'scheduled' }).eq('id', match.id);
      if (error) throw error;
      showMessage('success', 'Match accepted!');
      await logAction(currentUser.team_name, 'match_accepted', `Accepted match request from ${match.team_name}`, currentUser.id);
      fetchCoachData();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to accept match.');
    }
  };

  const handleStartMatch = async (match) => {
    try {
      const { error } = await supabase.from('local_matches').update({ status: 'live' }).eq('id', match.id);
      if (error) throw error;
      setActiveLiveMatch({ ...match, status: 'live' });
      
      await logAction(currentUser.team_name, 'match_started', `Started live match against ${match.opponent}`, currentUser.id);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to start match.');
    }
  };

  const handleOpenLiveEditor = async (match) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .eq('team_name', currentUser.team_name)
        .eq('approval_status', 'approved');
      if (data) setApprovedPlayers(data);
    } catch (err) {
      console.error("Failed to load squad for editor", err);
    }
    setActiveLiveMatch(match);
  };

  if (activeLiveMatch) {
    return <LiveMatchEditor match={activeLiveMatch} squad={approvedPlayers} onClose={() => { setActiveLiveMatch(null); fetchCoachData(); }} />;
  }

  return (
    <div className="admin-container" style={{padding: '2rem'}}>
      <div className="admin-header" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="admin-title" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <Shield className="text-accent" /> Coach Hub: {currentUser.team_name}
          </h1>
          <p className="text-muted">
            Team ID: <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{currentUser.team_id}</span> | Manage your squad and schedule upcoming matches.
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem'}}>
        <button 
          onClick={() => setActiveTab('approvals')} 
          className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-outline'}`}
        >
          <CheckCircle2 size={18} style={{marginRight: '0.5rem'}} /> Pending Approvals
        </button>
        <button 
          onClick={() => setActiveTab('squad')} 
          className={`btn ${activeTab === 'squad' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Users size={18} style={{marginRight: '0.5rem'}} /> My Squad
        </button>
        <button 
          onClick={() => setActiveTab('live')} 
          className={`btn ${activeTab === 'live' ? 'btn-primary' : 'btn-outline'}`}
          style={{borderColor: activeTab !== 'live' ? '#ef4444' : '', color: activeTab !== 'live' ? '#ef4444' : ''}}
        >
          <Radio size={18} style={{marginRight: '0.5rem'}} /> Live Match
        </button>
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-outline'}`}
        >
          <CalendarDays size={18} style={{marginRight: '0.5rem'}} /> Matches & History
        </button>
        <button 
          onClick={() => setActiveTab('activity')} 
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Activity size={18} style={{marginRight: '0.5rem'}} /> Update History
        </button>
      </div>

      {saveStatus && (
        <div className="admin-notification" style={{backgroundColor: saveStatus.type === 'success' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: saveStatus.type === 'success' ? 'var(--accent-primary)' : '#ef4444', marginBottom: '1.5rem'}}>
          {saveStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {saveStatus.message}
        </div>
      )}

      {/* --- TAB: APPROVALS --- */}
      {activeTab === 'approvals' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <CheckCircle2 size={24} className="text-accent" /> Team Player Approvals
          </h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading pending players...</div>
          ) : pendingPlayers.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No pending players to approve.</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Age</th><th>Country</th><th>Position</th><th>Mobile</th><th>Actions</th></tr></thead>
                <tbody>
                  {pendingPlayers.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight: 'bold'}}>{p.name}</td>
                      <td>{p.age}</td><td>{p.country}</td><td style={{color: 'var(--accent-primary)'}}>{p.position}</td>
                      <td>{p.mobile || '-'}</td>
                      <td><button className="btn btn-primary" onClick={() => approvePlayer(p.id, p.name)}>Approve</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: MY SQUAD --- */}
      {activeTab === 'squad' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Users size={24} className="text-accent" /> Active Roster
          </h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading squad...</div>
          ) : approvedPlayers.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>Your squad is empty.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
              {approvedPlayers.map(p => (
                <div key={p.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'}}>
                  <button 
                    onClick={() => setEditingPlayer(p)}
                    style={{position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s'}}
                    onMouseOver={e => e.currentTarget.style.color = '#fff'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Edit2 size={18} />
                  </button>
                  <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>{p.name}</h3>
                  <div style={{color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem'}}>{p.position}</div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)'}}>
                    <div><span style={{color: '#fff'}}>Age:</span> {p.age}</div>
                    <div><span style={{color: '#fff'}}>Nat:</span> {p.country}</div>
                    <div style={{gridColumn: 'span 2'}}><span style={{color: '#fff'}}>Phone:</span> {p.mobile || 'N/A'}</div>
                    <div style={{gridColumn: 'span 2'}}><span style={{color: '#fff'}}>Email:</span> {p.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* --- TAB: LIVE MATCH --- */}
        {activeTab === 'live' && (
          <div>
            {loading ? (
              <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Checking for live matches...</div>
            ) : !liveMatch ? (
              <div className="card admin-card" style={{padding: '3rem', textAlign: 'center'}}>
                <Radio size={48} color="var(--text-muted)" style={{margin: '0 auto 1rem'}} />
                <h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>No Live Matches</h2>
                <p style={{color: 'var(--text-muted)'}}>There are no active live matches for your team right now.</p>
              </div>
            ) : (
              <LiveMatchViewer liveMatch={liveMatch} currentUserTeamId={currentUser.team_id} />
            )}
          </div>
        )}

      {/* --- TAB: MATCHES & SCHEDULER --- */}
      {activeTab === 'schedule' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          
          {/* Top Row: Scheduler Form and Live/Upcoming Matches */}
          <div className="coach-schedule-grid">
            <div className="card admin-card">
              <h2 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Plus size={20} className="text-accent" /> Schedule New Match
              </h2>
              <form onSubmit={handleScheduleMatch} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <div className="coach-form-grid">
                    <div>
                      <label style={labelStyle}>Opponent Team Name</label>
                      <input type="text" required value={matchForm.opponent} onChange={e => setMatchForm({...matchForm, opponent: e.target.value})} style={inputStyle} placeholder="e.g. Local City FC" />
                    </div>
                    <div>
                      <label style={labelStyle}>Opponent Team ID</label>
                      <input type="text" required value={matchForm.opponentId} onChange={e => setMatchForm({...matchForm, opponentId: e.target.value.toUpperCase()})} style={inputStyle} placeholder="e.g. CITY1234" maxLength={8} />
                    </div>
                  </div>
                <div className="coach-form-grid">
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" required value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Time</label>
                    <input type="time" required value={matchForm.time} onChange={e => setMatchForm({...matchForm, time: e.target.value})} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Location / Stadium</label>
                  <input type="text" required value={matchForm.location} onChange={e => setMatchForm({...matchForm, location: e.target.value})} style={inputStyle} placeholder="e.g. Central Pitch 1" />
                </div>
                <button type="submit" className="btn btn-primary" style={{marginTop: '1rem'}}>Request Match</button>
              </form>
            </div>

            <div className="card admin-card">
              <h2 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Play size={20} className="text-accent" /> Active & Upcoming Matches
              </h2>
              {loading ? (
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading matches...</div>
              ) : localMatches.filter(m => m.status !== 'completed').length === 0 ? (
                <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No upcoming or live matches.</div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {localMatches.filter(m => m.status !== 'completed').map(match => {
                    const mDate = new Date(match.match_date);
                    const isLive = match.status === 'live';
                    return (
                      <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderLeft: isLive ? '4px solid #ef4444' : '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div>
                            {isLive && <div style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem', animation: 'pulse 2s infinite'}}>🔴 LIVE</div>}
                            {match.status === 'requested' && <div style={{color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>PENDING APPROVAL</div>}
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>
                              vs {match.team_id === currentUser.team_id ? match.opponent : match.team_name}
                            </div>
                            <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{match.location}</div>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                              <div style={{textAlign: 'right'}}>
                                <div style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{mDate.toLocaleDateString()}</div>
                                <div style={{fontSize: '0.9rem', color: '#fff'}}>{mDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                              {match.status === 'requested' ? (
                                match.creator_id === currentUser.id ? (
                                  <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic'}}>Waiting for opponent...</span>
                                ) : (
                                  <button className="btn btn-primary" style={{padding: '0.5rem 1rem'}} onClick={() => handleAcceptMatch(match)}>Accept Match</button>
                                )
                              ) : match.creator_id === currentUser.id ? (
                                isLive ? (
                                  <button className="btn btn-primary" style={{backgroundColor: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem'}} onClick={() => handleOpenLiveEditor(match)}>Open Editor</button>
                                ) : (
                                  <button className="btn btn-outline" style={{padding: '0.5rem 1rem'}} onClick={() => handleStartMatch(match)}>Start Match</button>
                                )
                              ) : (
                                <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Manageable by {match.team_name}</span>
                              )}
                            </div>
                            {match.status !== 'requested' && match.creator_id !== currentUser.id && (
                              <div style={{fontSize: '0.75rem', color: 'var(--accent-primary)', opacity: 0.8}}>
                                ⓘ Updates managed by match creator
                              </div>
                            )}
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: History */}
          <div className="card admin-card">
            <h2 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <History size={20} className="text-accent" /> Match History
            </h2>
            {localMatches.filter(m => m.status === 'completed').length === 0 ? (
              <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No completed matches yet.</div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
                {localMatches.filter(m => m.status === 'completed').map(match => {
                  const mDate = new Date(match.match_date);
                  return (
                    <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '8px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)'}}>
                      <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem'}}>{mDate.toLocaleDateString()} - {match.location}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                        <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.team_name}</div>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{match.home_score} - {match.away_score}</div>
                        <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.opponent}</div>
                      </div>
                      <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem'}}>
                        {match.events && match.events.length > 0 ? (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem'}}>
                            <div style={{fontWeight: 'bold', marginBottom: '0.25rem', color: '#fff'}}>Match Events:</div>
                            {match.events.sort((a, b) => b.minute - a.minute).map(ev => (
                              <div key={ev.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '0.5rem', borderRadius: '4px'}}>
                                <span style={{fontWeight: 'bold', minWidth: '25px'}}>{ev.minute}'</span>
                                <span>
                                  {ev.type === 'goal' ? '⚽ Goal' : ev.type === 'yellow_card' ? '🟨 Yellow Card' : '🟥 Red Card'} - {ev.player} ({ev.team === 'home' ? match.team_name : match.opponent})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>No events logged.</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: ACTIVITY / UPDATE HISTORY --- */}
      {activeTab === 'activity' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Activity size={24} className="text-accent" /> Update History
          </h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading history...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No recent activity found.</div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {auditLogs.map(log => {
                const logDate = new Date(log.created_at);
                return (
                  <div key={log.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '8px', padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>{log.description}</div>
                      <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>By {log.created_by?.name || 'Coach'}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{color: '#fff', fontWeight: 'bold'}}>{logDate.toLocaleDateString()}</div>
                      <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{logDate.toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPlayer && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="card" style={{width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative'}}>
            <button onClick={() => setEditingPlayer(null)} style={{position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}><X size={24} /></button>
            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Edit Player Details</h2>
            
            <form onSubmit={updatePlayer} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" required value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} style={inputStyle} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input type="number" required value={editingPlayer.age} onChange={e => setEditingPlayer({...editingPlayer, age: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input type="text" required value={editingPlayer.country} onChange={e => setEditingPlayer({...editingPlayer, country: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={labelStyle}>Position</label>
                  <select required value={editingPlayer.position} onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value})} style={inputStyle}>
                    <option value="Goalkeeper">Goalkeeper</option><option value="Defender">Defender</option><option value="Midfielder">Midfielder</option><option value="Attacker">Attacker</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Mobile</label>
                  <input type="tel" value={editingPlayer.mobile || ''} onChange={e => setEditingPlayer({...editingPlayer, mobile: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{marginTop: '1rem', padding: '1rem'}}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)'};
const inputStyle = {width: '100%', padding: '0.75rem', borderRadius: '6px', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem', outline: 'none'};


