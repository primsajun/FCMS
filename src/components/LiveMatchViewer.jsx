import React from 'react';

export default function LiveMatchViewer({ liveMatch, currentUserTeamId }) {
  if (!liveMatch) return null;

  // Determine which name to show based on team context
  // The creator (team_name) is always "Home", the receiver (opponent) is "Away"
  const homeName = liveMatch.team_name;
  const awayName = liveMatch.opponent;

  return (
    <div className="card admin-card" style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto', width: '100%'}}>
      <div style={{color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
        <div style={{width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
        LIVE
      </div>

      {/* Scoreboard */}
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', margin: '2rem 0'}}>
        <div style={{flex: 1, textAlign: 'right'}}>
          <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>{homeName} (Home)</h2>
          <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{liveMatch.home_score}</div>
        </div>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>VS</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px'}}>{liveMatch.elapsed_time}'</div>
        </div>
        
        <div style={{flex: 1, textAlign: 'left'}}>
          <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>{awayName} (Away)</h2>
          <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{liveMatch.away_score}</div>
        </div>
      </div>

      {/* Event Timeline */}
      <div style={{marginTop: '3rem', textAlign: 'left'}}>
        <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Match Events</h3>
        {(!liveMatch.events || liveMatch.events.length === 0) ? (
          <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '1rem'}}>No events recorded yet.</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            {liveMatch.events.sort((a,b) => b.minute - a.minute).map((ev, index) => (
              <div key={index} style={{display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(18, 18, 18, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${ev.team === 'home' ? 'var(--accent-primary)' : '#fff'}`}}>
                <div style={{fontWeight: 'bold', width: '40px'}}>{ev.minute}'</div>
                <div>
                  {ev.type === 'goal' && <span>? Goal - </span>}
                  {ev.type === 'yellow_card' && <span>?? Yellow Card - </span>}
                  {ev.type === 'red_card' && <span>?? Red Card - </span>}
                  <span style={{fontWeight: 'bold'}}>{ev.player || 'Unknown'}</span>
                  <span style={{color: 'var(--text-muted)', marginLeft: '0.5rem'}}>({ev.team === 'home' ? homeName : awayName})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

