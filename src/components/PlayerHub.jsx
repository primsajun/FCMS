import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Users, CalendarDays, Radio, History, Activity } from 'lucide-react';
import LiveMatchViewer from './LiveMatchViewer';

export default function PlayerHub({ currentUser }) {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('fcms_player_tab') || 'squad'); // 'squad', 'live', 'schedule', 'history'
  
  useEffect(() => {
    sessionStorage.setItem('fcms_player_tab', activeTab);
  }, [activeTab]);
  
  const [squad, setSquad] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);
  const [localMatches, setLocalMatches] = useState([]);
  const [liveMatch, setLiveMatch] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.team_id) {
      fetchPlayerData();
    }
  }, [currentUser, activeTab]);

  // Realtime subscription for the Live Match
  useEffect(() => {
    let subscription = null;
    
    if (liveMatch) {
      subscription = supabase
        .channel('public:local_matches')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'local_matches', filter: `id=eq.${liveMatch.id}` }, (payload) => {
          setLiveMatch(payload.new);
        })
        .subscribe();
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [liveMatch]);

  const fetchPlayerData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'squad') {
        const { data: squadData, error: squadError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player')
          .eq('team_id', currentUser.team_id)
          .eq('approval_status', 'approved');
        if (squadError) throw squadError;
        if (squadData) setSquad(squadData);

        const { data: coachData, error: coachError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'coach')
          .eq('team_id', currentUser.team_id)
          .single();
        if (coachError && coachError.code !== 'PGRST116') console.error(coachError);
        if (coachData) setCoachProfile(coachData);
      }
      else if (activeTab === 'schedule' || activeTab === 'history') {
        const { data, error } = await supabase
          .from('local_matches')
          .select('*')
          .or(`team_id.eq.${currentUser.team_id},opponent_id.eq.${currentUser.team_id}`)
          .neq('status', 'requested')
          .order('match_date', { ascending: true });
        if (error) throw error;
        if (data) setLocalMatches(data);
      }
      else if (activeTab === 'live') {
        // Fetch any currently live match for this team
        const { data, error } = await supabase
          .from('local_matches')
          .select('*')
          .eq('team_name', currentUser.team_name)
          .eq('status', 'live')
          .single(); // assuming only 1 live match at a time
        
        if (error && error.code !== 'PGRST116') {
          console.error(error);
        }
        if (data) setLiveMatch(data);
        else setLiveMatch(null);
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

  return (
    <div className="admin-container" style={{padding: '2rem'}}>
      <div className="admin-header" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="admin-title" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <Shield className="text-accent" /> Player Hub: {currentUser.team_name}
          </h1>
          <p className="text-muted">
            Team ID: <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{currentUser.team_id}</span> | View your team roster and follow live matches.
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', overflowX: 'auto'}}>
        <button onClick={() => setActiveTab('squad')} className={`btn ${activeTab === 'squad' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <Users size={18} style={{marginRight: '0.5rem'}} /> My Squad
        </button>
        <button onClick={() => setActiveTab('live')} className={`btn ${activeTab === 'live' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap', borderColor: activeTab !== 'live' ? '#ef4444' : '', color: activeTab !== 'live' ? '#ef4444' : ''}}>
          <Radio size={18} style={{marginRight: '0.5rem'}} /> Live Match
        </button>
        <button onClick={() => setActiveTab('schedule')} className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <CalendarDays size={18} style={{marginRight: '0.5rem'}} /> Upcoming
        </button>
        <button onClick={() => setActiveTab('history')} className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <History size={18} style={{marginRight: '0.5rem'}} /> History
        </button>
        <button onClick={() => setActiveTab('activity')} className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`} style={{whiteSpace: 'nowrap'}}>
          <Activity size={18} style={{marginRight: '0.5rem'}} /> Update History
        </button>
      </div>

      {/* --- TAB: MY SQUAD --- */}
      {activeTab === 'squad' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          {coachProfile && (
            <div className="card admin-card" style={{borderLeft: '4px solid #f59e0b', padding: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.05)'}}>
              <h2 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Shield size={20} /> Team Coach
              </h2>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
                <div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Name</div>
                  <div style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{coachProfile.name}</div>
                </div>
                <div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Mobile Number</div>
                  <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{coachProfile.mobile_number || coachProfile.mobile || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Email</div>
                  <div style={{fontSize: '1.1rem'}}>{coachProfile.email}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card admin-card">
            <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Users size={24} className="text-accent" /> Teammates
            </h2>
            {loading ? (
              <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading squad...</div>
            ) : squad.length === 0 ? (
              <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>Your squad is empty.</div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem'}}>
              {squad.map(p => (
                <div key={p.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'}}>
                  {p.id === currentUser.id && (
                    <span style={{position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--accent-primary)', color: '#000', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold'}}>YOU</span>
                  )}
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
              <p style={{color: 'var(--text-muted)'}}>Your coach hasn't started any matches yet.</p>
            </div>
          ) : (
            <LiveMatchViewer liveMatch={liveMatch} currentUserTeamId={currentUser.team_id} />
          )}
        </div>
      )}

      {/* --- TAB: UPCOMING --- */}
      {activeTab === 'schedule' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <CalendarDays size={24} className="text-accent" /> Upcoming Matches
          </h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading matches...</div>
          ) : localMatches.filter(m => m.status === 'scheduled').length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No scheduled matches.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
              {localMatches.filter(m => m.status === 'scheduled').map(match => {
                const mDate = new Date(match.match_date);
                return (
                  <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '4px solid var(--accent-primary)'}}>
                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Upcoming</div>
                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>vs {match.team_id === currentUser.team_id ? match.opponent : match.team_name}</div>
                    
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

      {/* --- TAB: HISTORY --- */}
      {activeTab === 'history' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <History size={24} className="text-accent" /> Match History
          </h2>
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading history...</div>
          ) : localMatches.filter(m => m.status === 'completed').length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No completed matches yet.</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
              {localMatches.filter(m => m.status === 'completed').map(match => {
                const mDate = new Date(match.match_date);
                return (
                  <div key={match.id} style={{background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem'}}>{mDate.toLocaleDateString()} - {match.location}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.team_id === currentUser.team_id ? match.team_name : match.opponent}</div>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{match.home_score} - {match.away_score}</div>
                      <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{match.team_id === currentUser.team_id ? match.opponent : match.team_name}</div>
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

      {/* --- TAB: ACTIVITY / UPDATE HISTORY --- */}
      {activeTab === 'activity' && (
        <div className="card admin-card">
          <h2 style={{fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Activity size={24} className="text-accent" /> Team Update History
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
    </div>
  );
}


