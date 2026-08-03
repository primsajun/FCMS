import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Play, Square, RefreshCw, Save, Clock, X, ChevronLeft, Plus, Flag, FileWarning, Edit2 } from 'lucide-react';
import { logAction } from '../utils/logger';

export default function LiveMatchEditor({ match, squad, onClose }) {
  const [homeScore, setHomeScore] = useState(match.home_score || 0);
  const [awayScore, setAwayScore] = useState(match.away_score || 0);
  const [elapsedTime, setElapsedTime] = useState(match.elapsed_time || 0);
  const [events, setEvents] = useState(match.events || []);
  
  const [isRunning, setIsRunning] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  const timerRef = useRef(null);

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ type: 'goal', team: 'home', player: '', minute: elapsedTime });

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 60000); // tick every minute
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  useEffect(() => {
    // Keep event form minute in sync when opening
    setEventForm(prev => ({ ...prev, minute: elapsedTime }));
  }, [elapsedTime]);

  const handleCompleteMatch = async () => {
    if(!confirm("Are you sure you want to end this match? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('local_matches').update({
        status: 'completed',
        home_score: homeScore,
        away_score: awayScore,
        elapsed_time: elapsedTime,
        events: events
      }).eq('id', match.id);
      
      if(error) throw error;
      
      await logAction(match.team_name, 'match_completed', `Ended match against ${match.opponent} with score ${homeScore}-${awayScore}`, null);
      
      onClose(); // go back to hub
    } catch(err) {
      console.error(err);
      setSyncStatus('Error saving');
    }
  };

  const syncToSupabase = async (updates) => {
    setSyncStatus('Syncing...');
    try {
      const { error } = await supabase
        .from('local_matches')
        .update(updates)
        .eq('id', match.id);
        
      if (error) throw error;
      setSyncStatus('Saved');
      setTimeout(() => setSyncStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setSyncStatus('Error saving');
    }
  };

  const handleScoreChange = (team, delta) => {
    if (team === 'home') {
      const newScore = Math.max(0, homeScore + delta);
      setHomeScore(newScore);
      syncToSupabase({ home_score: newScore });
    } else {
      const newScore = Math.max(0, awayScore + delta);
      setAwayScore(newScore);
      syncToSupabase({ away_score: newScore });
    }
  };

  const toggleTimer = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    // When stopping, sync the exact time to DB
    if (!newRunning) {
      syncToSupabase({ elapsed_time: elapsedTime });
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    syncToSupabase({ elapsed_time: 0 });
  };

  const fixTime = () => {
    const newTime = prompt("Enter correct elapsed time in minutes:", elapsedTime);
    if (newTime !== null && !isNaN(newTime)) {
      const parsedTime = parseInt(newTime, 10);
      setElapsedTime(parsedTime);
      syncToSupabase({ elapsed_time: parsedTime });
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now().toString() };
    const updatedEvents = [...events, newEvent].sort((a, b) => b.minute - a.minute); // sort newest first
    
    setEvents(updatedEvents);
    setShowEventModal(false);
    
    // Auto increment score if goal
    let hScore = homeScore;
    let aScore = awayScore;
    if (newEvent.type === 'goal') {
      if (newEvent.team === 'home') {
        hScore++;
        setHomeScore(hScore);
      } else {
        aScore++;
        setAwayScore(aScore);
      }
    }

    await syncToSupabase({ events: updatedEvents, home_score: hScore, away_score: aScore, elapsed_time: elapsedTime });
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm("Delete this event?")) {
      const updatedEvents = events.filter(ev => ev.id !== eventId);
      setEvents(updatedEvents);
      
      // We don't auto-decrement score here to avoid complexity, coach can fix score manually if needed.
      await syncToSupabase({ events: updatedEvents });
    }
  };

  const completeMatch = async () => {
    if (window.confirm("Are you sure you want to END this match? It will be moved to History.")) {
      await syncToSupabase({ status: 'completed', elapsed_time: elapsedTime });
      onClose();
    }
  };

  return (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-dark)', zIndex: 1000, overflowY: 'auto', padding: '2rem'}}>
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <button className="btn btn-outline" onClick={onClose}><ChevronLeft size={18} /> Back to Hub</button>
          <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>{syncStatus}</div>
          <button className="btn btn-primary" onClick={completeMatch} style={{backgroundColor: '#ef4444', borderColor: '#ef4444'}}>End Match</button>
        </div>

        <div className="card admin-card" style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div style={{color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
            <div style={{width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
            LIVE MATCH
          </div>

          {/* Scoreboard */}
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', margin: '2rem 0'}}>
            <div style={{flex: 1, textAlign: 'right'}}>
              <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>{match.team_name} (Home)</h2>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'}}>
                <button className="btn btn-outline" onClick={() => handleScoreChange('home', -1)}>-</button>
                <div style={{fontSize: '3rem', fontWeight: 'bold', width: '80px', textAlign: 'center', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px'}}>{homeScore}</div>
                <button className="btn btn-outline" onClick={() => handleScoreChange('home', 1)}>+</button>
              </div>
            </div>
            
            <div style={{fontSize: '2rem', color: 'var(--text-muted)'}}>VS</div>
            
            <div style={{flex: 1, textAlign: 'left'}}>
              <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>{match.opponent} (Away)</h2>
              <div style={{display: 'flex', justifyContent: 'flex-start', gap: '0.5rem'}}>
                <button className="btn btn-outline" onClick={() => handleScoreChange('away', -1)}>-</button>
                <div style={{fontSize: '3rem', fontWeight: 'bold', width: '80px', textAlign: 'center', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px'}}>{awayScore}</div>
                <button className="btn btn-outline" onClick={() => handleScoreChange('away', 1)}>+</button>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div style={{backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '1rem', color: isRunning ? 'var(--accent-primary)' : '#fff'}}>
              {elapsedTime}'
            </div>
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
              <button className={`btn ${isRunning ? 'btn-outline' : 'btn-primary'}`} onClick={toggleTimer}>
                {isRunning ? <><Square size={16} style={{marginRight: '0.25rem'}}/> Stop</> : <><Play size={16} style={{marginRight: '0.25rem'}}/> Start Time</>}
              </button>
              <button className="btn btn-outline" onClick={fixTime}><Edit2 size={16} style={{marginRight: '0.25rem'}}/> Fix Time</button>
              <button className="btn btn-outline" onClick={resetTimer}><RefreshCw size={16} style={{marginRight: '0.25rem'}}/> Reset</button>
            </div>
          </div>
        </div>

        {/* Events Timeline Editor */}
        <div className="card admin-card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Flag size={20} className="text-accent" /> Match Events
            </h2>
            <button className="btn btn-primary" style={{padding: '0.5rem 1rem'}} onClick={() => setShowEventModal(true)}>
              <Plus size={16} style={{marginRight: '0.5rem'}} /> Add Event
            </button>
          </div>

          {events.length === 0 ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No events recorded yet.</div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {events.map(ev => (
                <div key={ev.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${ev.team === 'home' ? 'var(--accent-primary)' : '#fff'}`}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{fontWeight: 'bold', width: '40px'}}>{ev.minute}'</div>
                    <div>
                      {ev.type === 'goal' && <span>⚽ Goal - </span>}
                      {ev.type === 'yellow_card' && <span>🟨 Yellow Card - </span>}
                      {ev.type === 'red_card' && <span>🟥 Red Card - </span>}
                      <span style={{fontWeight: 'bold'}}>{ev.player || 'Unknown Player'}</span>
                      <span style={{color: 'var(--text-muted)', marginLeft: '0.5rem'}}>({ev.team === 'home' ? match.team_name : match.opponent})</span>
                    </div>
                  </div>
                  <button style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}} onClick={() => deleteEvent(ev.id)}><X size={18} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Event Modal */}
        {showEventModal && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100}}>
            <div className="card" style={{width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative'}}>
              <button onClick={() => setShowEventModal(false)} style={{position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}><X size={24} /></button>
              <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>Log Event</h2>
              
              <form onSubmit={handleAddEvent} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div>
                  <label style={labelStyle}>Event Type</label>
                  <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} style={inputStyle}>
                    <option value="goal">⚽ Goal</option>
                    <option value="yellow_card">🟨 Yellow Card</option>
                    <option value="red_card">🟥 Red Card</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>Team</label>
                  <select value={eventForm.team} onChange={e => setEventForm({...eventForm, team: e.target.value})} style={inputStyle}>
                    <option value="home">{match.team_name} (Home)</option>
                    <option value="away">{match.opponent} (Away)</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>Player Name</label>
                  {eventForm.team === 'home' ? (
                    <select value={eventForm.player} onChange={e => setEventForm({...eventForm, player: e.target.value})} style={inputStyle} required>
                      <option value="">-- Select Player --</option>
                      {squad.map(p => <option key={p.id} value={p.name}>{p.name} ({p.position})</option>)}
                      <option value="Own Goal">Own Goal</option>
                    </select>
                  ) : (
                    <input type="text" value={eventForm.player} onChange={e => setEventForm({...eventForm, player: e.target.value})} style={inputStyle} placeholder="Opponent player name" required />
                  )}
                </div>
                
                <div>
                  <label style={labelStyle}>Minute</label>
                  <input type="number" required value={eventForm.minute} onChange={e => setEventForm({...eventForm, minute: parseInt(e.target.value)})} style={inputStyle} />
                </div>
                
                <button type="submit" className="btn btn-primary" style={{marginTop: '1rem', padding: '1rem'}}>Save Event</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const labelStyle = {display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)'};
const inputStyle = {width: '100%', padding: '0.75rem', borderRadius: '6px', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem', outline: 'none'};


