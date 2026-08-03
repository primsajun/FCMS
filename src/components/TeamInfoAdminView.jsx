import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Users, CalendarDays, History, Activity, Shield, Trash2 } from 'lucide-react';

export default function TeamInfoAdminView({ teamName, teamId, coachName, onBack }) {
  const [activeTab, setActiveTab] = useState('squad'); // 'squad', 'schedule', 'history', 'activity'
  const [squad, setSquad] = useState([]);
  const [localMatches, setLocalMatches] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, [teamName, activeTab]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'squad') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player')
          .eq('team_id', teamId)
          .eq('approval_status', 'approved');
        if (error) throw error;
        if (data) setSquad(data);
      }
      else if (activeTab === 'schedule' || activeTab === 'history') {
        const { data, error } = await supabase
          .from('local_matches')
          .select('*')
          .eq('team_name', teamName)
          .order('match_date', { ascending: true });
        if (error) throw error;
        if (data) setLocalMatches(data);
      }
      else if (activeTab === 'activity') {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, created_by(*)')
          .eq('team_name', teamName)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm("Are you sure you want to permanently delete this match history?")) return;
    try {
      const { error } = await supabase.from('local_matches').delete().eq('id', matchId);
      if (error) throw error;
      setLocalMatches(localMatches.filter(m => m.id !== matchId));
      alert("Match deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete match.");
    }
  };

  return (
    <div className="admin-container" style={{padding: '2rem'}}>
      <div className="admin-header" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="admin-title" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <Shield className="text-accent" /> Team Info: {teamName} <span style={{fontSize: '1rem', color: 'var(--accent-primary)', fontWeight: 'normal'}}>({teamId})</span>
          </h1>
          <p className="text-muted">Coach: {coachName}</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={18} style={{marginRight: '0.5rem'}} /> Back to Directory
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', overflowX: 'auto'}}>
        <button onClick={() => setActiveTab('squad')} className={`btn ${activeTab === 'squad' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <Users size={18} style={{marginRight: '0.5rem'}} /> Squad
        </button>
        <button onClick={() => setActiveTab('schedule')} className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <CalendarDays size={18} style={{marginRight: '0.5rem'}} /> Upcoming Matches
        </button>
        <button onClick={() => setActiveTab('history')} className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <History size={18} style={{marginRight: '0.5rem'}} /> Match History
        </button>
        <button onClick={() => setActiveTab('activity')} className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <Activity size={18} style={{marginRight: '0.5rem'}} /> Update History
        </button>
      </div>

      {/* --- SQUAD --- */}
      {activeTab === 'squad' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Team Roster</h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading...</div>
          ) : squad.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No approved players on this team.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem'}}>
              {squad.map(p => (
                <div key={p.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)'}}>
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

      {/* --- SCHEDULE --- */}
      {activeTab === 'schedule' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Upcoming / Live Matches</h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading...</div>
          ) : localMatches.filter(m => m.status !== 'completed').length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No upcoming matches scheduled.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
              {localMatches.filter(m => m.status !== 'completed').map(match => {
                const mDate = new Date(match.match_date);
                const isLive = match.status === 'live';
                return (
                  <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderLeft: isLive ? '4px solid #ef4444' : '4px solid var(--accent-primary)'}}>
                    <div style={{color: isLive ? '#ef4444' : 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>
                      {isLive ? '● LIVE' : 'Upcoming'}
                    </div>
                    <div style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem'}}>vs {match.opponent}</div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{color: 'var(--text-muted)'}}>Date:</span>
                        <span style={{color: '#fff'}}>{mDate.toLocaleDateString()}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{color: 'var(--text-muted)'}}>Time:</span>
                        <span style={{color: '#fff'}}>{mDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                        <span style={{color: 'var(--text-muted)'}}>Location:</span>
                        <span style={{color: '#fff', textAlign: 'right'}}>{match.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- HISTORY --- */}
      {activeTab === 'history' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Match History</h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading...</div>
          ) : localMatches.filter(m => m.status === 'completed').length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No completed matches.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
              {localMatches.filter(m => m.status === 'completed').map(match => {
                const mDate = new Date(match.match_date);
                return (
                  <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'}}>
                    <button onClick={() => deleteMatch(match.id)} style={{position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', zIndex: 10}} title="Delete Match">
                      <Trash2 size={20} />
                    </button>
                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem'}}>{mDate.toLocaleDateString()} - {match.location}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingRight: '2.5rem'}}>
                      <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.team_name}</div>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{match.home_score} - {match.away_score}</div>
                      <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.opponent}</div>
                    </div>
                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem'}}>
                      {match.events && match.events.length > 0 ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem'}}>
                          <div style={{fontWeight: 'bold', marginBottom: '0.25rem', color: '#fff'}}>Match Events:</div>
                          {match.events.sort((a, b) => b.minute - a.minute).map(ev => (
                            <div key={ev.id || Math.random()} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '0.5rem', borderRadius: '4px'}}>
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
      )}

      {/* --- ACTIVITY LOGS --- */}
      {activeTab === 'activity' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Audit Logs</h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading logs...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No recent activity found for this team.</div>
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
    </div>
  );
}


