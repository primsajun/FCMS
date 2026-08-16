import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  ChevronLeft, ChevronRight, Bell, 
  BarChart2, Users, Shield, Globe, AtSign, Trophy,
  Clock, BellPlus, Filter, AlignLeft,
  MapPin, Thermometer
} from 'lucide-react';
import { teamsData } from './teamsData';
import { matchData } from './matchData';
import { supabase } from './supabaseClient';
import AdminDashboard from './AdminDashboard';
import { PREDEFINED_TEAMS } from './predefinedTeams';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CoachHub from './components/CoachHub';
import PlayerHub from './components/PlayerHub';

// --- HOME COMPONENT ---
function Home({ onMatchClick, onViewTables, onRegisterClick, liveMatches, isLoadingLive, standingsData, isLoadingStandings, fixturesData, isLoadingFixtures, leagueStats, activeStatsLeague, setActiveStatsLeague }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderLiveCards = () => {
    if (isLoadingLive) {
      return (
        <div className="empty-state-message" style={{padding: '2rem', color: 'var(--text-muted)'}}>
          <div className="live-dot-small" style={{display: 'inline-block', marginRight: '8px'}}></div>
          Loading live matches from Supabase...
        </div>
      );
    }

      if (!liveMatches || liveMatches.length === 0) {
        return (
          <div className="empty-state-video" style={{width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '280px', flex: '0 0 auto', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0c10'}}>
             <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
             >
                <source src="/videos/live-placeholder.mp4" type="video/mp4" />
             </video>
             <div style={{position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2}}>
                <div className="live-dot-small" style={{backgroundColor: '#fff', boxShadow: 'none'}}></div>
                Waiting for matches to kick off...
             </div>
          </div>
        );
      }

    return liveMatches.map((match) => (
      <div key={match.id} className="card match-card" style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}>
        <div className="flex justify-between items-center">
          <span className="match-league">
            {match.league_name.toUpperCase()} 
            <span className="match-league-time text-accent">
              {match.elapsed}'
            </span>
          </span>
        </div>
        <div className="match-teams">
          <div className="match-team">
            <div className="team-info">
              <div className="team-logo" style={{backgroundImage: `url(${match.home_team_logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
              <span>{match.home_team_name}</span>
            </div>
            <span className={`score ${match.home_winner ? 'score-win' : ''}`}>{match.home_goals}</span>
          </div>
          <div className="match-team">
            <div className="team-info">
              <div className="team-logo" style={{backgroundImage: `url(${match.away_team_logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
              <span>{match.away_team_name}</span>
            </div>
            <span className={`score ${match.away_winner ? 'score-win' : ''}`}>{match.away_goals}</span>
          </div>
        </div>
        <div className="match-footer">
          <span className="text-muted" style={{fontSize: '0.65rem'}}>Live API Data</span>
        </div>
      </div>
    ));
  };

  const renderStandingsTable = (leagueId, title) => {
    if (isLoadingStandings) {
      return (
        <div className="card table-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
           <span className="text-muted">Loading {title}...</span>
        </div>
      );
    }

    const tableData = standingsData[leagueId] || [];

    const top5 = tableData.slice(0, 5);

    return (
      <div className="card table-card">
        <div className="table-header">
          <Trophy size={16} className="table-icon" />
          {title}
        </div>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>GD</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((row) => (
              <tr key={row.id}>
                <td>{row.rank}</td>
                <td style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <img src={row.team_logo} alt={row.team_name} style={{width: '16px', height: '16px'}} />
                  {row.team_name}
                </td>
                <td>{row.played}</td>
                <td>{row.goals_diff}</td>
                <td style={{fontWeight: 'bold'}}>{row.custom_points || row.points || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTodayFixtures = () => {
    if (isLoadingFixtures) {
      return <div className="text-muted" style={{padding: '1rem'}}>Loading fixtures...</div>;
    }

      const upcomingFixtures = fixturesData ? fixturesData.filter(f => !f.goals || f.goals.home === null) : [];

      if (upcomingFixtures.length === 0) {
        return <div className="text-muted" style={{padding: '1rem'}}>No upcoming fixtures.</div>;
      }

    const displayFixtures = upcomingFixtures.slice(0, 3);

    return (
      <div className="fixtures-list">
        {displayFixtures.map(fixture => {
          const dateObj = new Date(fixture.fixture.date);
          const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          return (
            <div key={fixture.fixture.id} className="fixture-item">
              <div className="fixture-time" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.4', minWidth: '80px', whiteSpace: 'nowrap'}}>
                <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{dateStr}</span>
                <span>{time}</span>
              </div>
              <div className="fixture-teams">
                <div className="fixture-team-left">
                  {fixture.teams.home.name}
                  <div className="team-logo" style={{backgroundImage: `url(${fixture.teams.home.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                </div>
                <div className="fixture-vs">VS</div>
                <div className="fixture-team-right">
                  <div className="team-logo" style={{backgroundImage: `url(${fixture.teams.away.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                  {fixture.teams.away.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Live Center <div className="live-dot"></div>
            </h2>
          </div>
          <div className="nav-arrows">
            <button className="nav-arrow" onClick={() => scroll('left')}><ChevronLeft size={20} /></button>
            <button className="nav-arrow" onClick={() => scroll('right')}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="live-scroll" ref={scrollRef}>
          {renderLiveCards()}
        </div>
      </section>

      <div style={{display: 'flex', flexDirection: 'column', gap: '3.5rem', marginTop: '2rem'}}>
        <section>
          <div className="section-header">
            <h2 className="section-title">League Standings</h2>
            <button className="match-details-link" onClick={onViewTables} style={{background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0}}>View All Tables</button>
          </div>
          <div className="standings-grid">
            {renderStandingsTable(39, "Premier League")}
            {renderStandingsTable(140, "La Liga")}
            {renderStandingsTable(2, "Champions League")}
          </div>
        </section>

        <section>
          <div className="section-header">
            <h2 className="section-title">Upcoming Fixtures</h2>
          </div>
          {renderTodayFixtures()}
        </section>



        <section>
          <h2 className="section-title" style={{marginBottom: '1rem'}}>Top Leagues</h2>
            <div className="features-grid">
              <div className="card feature-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{backgroundColor: '#fff', borderRadius: '50%', padding: '0.5rem', marginBottom: '1rem', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{backgroundImage: 'url(https://media.api-sports.io/football/leagues/39.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '60px', height: '60px'}}></div>
                </div>
                <h3 className="feature-title">Premier League</h3>
                <p className="feature-desc" style={{marginTop: '0.5rem'}}>The pinnacle of English football, known globally for its intense rivalries, fast-paced action, and legendary superstars.</p>
              </div>
              <div className="card feature-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{backgroundColor: '#fff', borderRadius: '50%', padding: '0.5rem', marginBottom: '1rem', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{backgroundImage: 'url(https://media.api-sports.io/football/leagues/140.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '60px', height: '60px'}}></div>
                </div>
                <h3 className="feature-title">La Liga</h3>
                <p className="feature-desc" style={{marginTop: '0.5rem'}}>Spain's premier competition, celebrated for its technical brilliance, tactical depth, and the legendary El Clásico.</p>
              </div>
              <div className="card feature-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{backgroundColor: '#fff', borderRadius: '50%', padding: '0.5rem', marginBottom: '1rem', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{backgroundImage: 'url(https://media.api-sports.io/football/leagues/2.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '60px', height: '60px'}}></div>
                </div>
                <h3 className="feature-title">Champions League</h3>
                <p className="feature-desc" style={{marginTop: '0.5rem'}}>Europe's elite tournament where the absolute best clubs on the continent battle for ultimate football supremacy.</p>
              </div>
            </div>
          </section>

        <section>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', gap: '1rem'}}>
            <h2 className="section-title" style={{marginBottom: 0}}>Player Stats</h2>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              {['Premier League', 'La Liga', 'Champions League'].map(league => (
                <button 
                  key={league}
                  onClick={() => setActiveStatsLeague(league)}
                  className={`btn ${activeStatsLeague === league ? 'btn-primary' : 'btn-outline'}`}
                  style={{padding: '0.25rem 0.75rem', fontSize: '0.8rem'}}
                >
                  {league === 'Champions League' ? 'UCL' : league}
                </button>
              ))}
            </div>
          </div>
          <div className="trending-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
            <div className="card trending-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', height: 'auto', justifySelf: 'stretch', width: '100%'}}>
              <h3 style={{fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)'}}><Trophy size={18} className="text-accent" /> Top Scorers</h3>
              <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {leagueStats.filter(s => s.league === activeStatsLeague && s.stat_type === 'goals').slice(0, 3).map((stat, index) => (
                  <div key={stat.id} style={{display: 'flex', justifyContent: 'space-between', borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: index < 2 ? '0.5rem' : 0}}>
                    <span style={{fontWeight: '600', color: 'var(--text-secondary)'}}>{index + 1}. {stat.player_name}</span>
                    <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{stat.stat_value} Goals</span>
                  </div>
                ))}
                {leagueStats.filter(s => s.league === activeStatsLeague && s.stat_type === 'goals').length === 0 && (
                  <span className="text-muted" style={{fontSize: '0.85rem'}}>No goals stats yet.</span>
                )}
              </div>
            </div>
            
            <div className="card trending-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', height: 'auto', justifySelf: 'stretch', width: '100%'}}>
              <h3 style={{fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)'}}><Trophy size={18} className="text-accent" /> Top Assists</h3>
              <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {leagueStats.filter(s => s.league === activeStatsLeague && s.stat_type === 'assists').slice(0, 3).map((stat, index) => (
                  <div key={stat.id} style={{display: 'flex', justifyContent: 'space-between', borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: index < 2 ? '0.5rem' : 0}}>
                    <span style={{fontWeight: '600', color: 'var(--text-secondary)'}}>{index + 1}. {stat.player_name}</span>
                    <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{stat.stat_value} Assists</span>
                  </div>
                ))}
                {leagueStats.filter(s => s.league === activeStatsLeague && s.stat_type === 'assists').length === 0 && (
                  <span className="text-muted" style={{fontSize: '0.85rem'}}>No assists stats yet.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title" style={{marginBottom: '1rem'}}>How FCMS Works</h2>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Users size={24} />
              </div>
              <h3 className="feature-title">1. Register & Join</h3>
              <p className="feature-desc">Sign up as a Coach to create a custom team, or register as a Player to join an existing local squad.</p>
              <Users size={80} className="feature-bg-icon" />
            </div>
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">2. Manage Your Squad</h3>
              <p className="feature-desc">Coaches can approve pending players, organize their roster, schedule matches, and record match events.</p>
              <Shield size={80} className="feature-bg-icon" />
            </div>
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Clock size={24} />
              </div>
              <h3 className="feature-title">Real-Time Tracking</h3>
              <p className="feature-desc">Simulate live match events, track goals and cards minute-by-minute, and broadcast live scores instantly.</p>
              <Clock size={80} className="feature-bg-icon" />
            </div>
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <BarChart2 size={24} />
              </div>
              <h3 className="feature-title">God-View Analytics</h3>
              <p className="feature-desc">Maintain a permanent history of all completed matches, full team rosters, and Super Admin audit logs.</p>
              <BarChart2 size={80} className="feature-bg-icon" />
            </div>
          </div>
        </section>
      </div>

        <section className="cta-section">
          <h1 className="cta-title">FCMS</h1>
          <p className="cta-desc">
            Experience real-time football scores, instant match updates, and professional-grade team management all in one platform.
          </p>
        <div className="cta-buttons">
          <button className="btn btn-primary btn-large" onClick={onRegisterClick}>Register as Player</button>
          <button className="btn btn-outline btn-large" style={{borderColor: 'rgba(255,255,255,0.2)'}} onClick={onRegisterClick}>Register as Coach</button>
        </div>
      </section>
      </>
    );
}

// --- LIVE MATCHES COMPONENT ---
function LiveMatches({ onMatchClick, liveMatches, isLoadingLive }) {
  const [activeLeague, setActiveLeague] = useState('all');

  const filteredMatches = activeLeague === 'all' 
    ? liveMatches 
    : liveMatches?.filter(m => m.league_id === activeLeague);

  const renderLiveGrid = () => {
    if (isLoadingLive) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           <div className="live-dot-small" style={{display: 'inline-block', marginRight: '8px'}}></div>
           Connecting to Supabase...
        </div>
      );
    }

    if (!filteredMatches || filteredMatches.length === 0) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           No live matches available for this selection right now.
        </div>
      );
    }

    return (
      <div className="live-grid">
        {filteredMatches.map((match) => (
          <div key={match.id} className="large-match-card" style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}>
            <div className="card-top">
              <div className="league-badge">{match.league_name.toUpperCase()}</div>
              <div className="live-time">{match.elapsed}' <div className="live-dot-small" style={{backgroundColor: '#22c55e'}}></div></div>
            </div>
            
            <div className="match-center">
              <div className="team-col">
                <div className="big-team-logo" style={{backgroundImage: `url(${match.home_team_logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                <span className="team-name">{match.home_team_name}</span>
              </div>
              <div className="score-col">
                <div className="big-score">
                  <span className={match.home_winner ? 'score-win' : ''}>{match.home_goals}</span> 
                  <span style={{margin: '0 8px', color: 'var(--text-muted)'}}>-</span> 
                  <span className={match.away_winner ? 'score-win' : ''}>{match.away_goals}</span>
                </div>
                <div className="score-subtext text-accent">{match.status}</div>
              </div>
              <div className="team-col">
                <div className="big-team-logo" style={{backgroundImage: `url(${match.away_team_logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                <span className="team-name">{match.away_team_name}</span>
              </div>
            </div>

            <div className="match-events empty-events" style={{justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem'}}>
              <span className="text-muted" style={{fontSize: '0.75rem'}}>Powered by Supabase</span>
            </div>

            <button className="btn btn-primary view-details-btn" onClick={() => onMatchClick('madrid_v_city')}>View Details</button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="live-page">
      <div className="live-header">
        <div className="live-header-top">
          <div className="global-status">
            <div className="live-dot-small"></div>
            GLOBAL STATUS: {liveMatches?.length || 0} MATCHES LIVE
          </div>
        </div>
        <div className="live-header-main">
          <h1 className="live-title">Live Matches</h1>
          <div className="league-filters" style={{flexWrap: 'wrap'}}>
            <button className={`filter-pill ${activeLeague === 'all' ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague('all')}>All Leagues</button>
            <button className={`filter-pill ${activeLeague === 39 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(39)}>Premier League</button>
            <button className={`filter-pill ${activeLeague === 140 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(140)}>La Liga</button>
            <button className={`filter-pill ${activeLeague === 2 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(2)}>Champions League</button>
          </div>
        </div>
      </div>

      {renderLiveGrid()}
    </div>
  );
}

// --- FIXTURES COMPONENT ---
function Fixtures({ onMatchClick, fixturesData, isLoadingFixtures }) {
  const [activeLeague, setActiveLeague] = useState('all');
  
  const groupedFixtures = React.useMemo(() => {
    if (!fixturesData) return {};

    // Filter out completed matches (only show upcoming)
    const upcomingFixtures = fixturesData.filter(f => !f.goals || f.goals.home === null);

    const filteredFixtures = activeLeague === 'all' 
      ? upcomingFixtures 
      : upcomingFixtures.filter(f => f.league.id === activeLeague);

    return filteredFixtures.reduce((acc, fixture) => {
      const leagueId = fixture.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          name: fixture.league.name,
          logo: fixture.league.logo,
          matches: []
        };
      }
      acc[leagueId].matches.push(fixture);
      return acc;
    }, {});
  }, [fixturesData, activeLeague]);

  const renderLeagueGroups = () => {
    if (isLoadingFixtures) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           Loading fixtures...
        </div>
      );
    }

    const leagueIds = Object.keys(groupedFixtures);
    if (leagueIds.length === 0) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           No fixtures scheduled for today in the selected leagues.
        </div>
      );
    }

    return leagueIds.map(leagueId => {
      const league = groupedFixtures[leagueId];
      return (
        <div key={leagueId} className="league-group">
          <div className="league-group-header">
            <div className="league-group-logo">
               <div className="tiny-logo" style={{backgroundImage: `url(${league.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
            </div>
            <div className="league-group-info">
              <span className="league-group-name">{league.name}</span>
              <span className="league-group-matchday">SUPABASE DATA</span>
            </div>
          </div>

          <div className="fixture-cards-grid">
            {league.matches.map(fixture => {
              const dateObj = new Date(fixture.fixture.date);
              const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div key={fixture.fixture.id} className="fixture-card">
                  <div className="fixture-card-header">
                    <div className="fixture-time-badge" style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                      <span style={{color: 'rgba(255,255,255,0.6)'}}>{dateStr}</span>
                      <span>{time}</span>
                    </div>
                    <span className="text-muted" style={{fontSize: '0.65rem'}}>{fixture.fixture.status.short}</span>
                  </div>
                  <div className="fixture-card-teams">
                    <div className="fixture-team">
                      <div className="fixture-team-logo" style={{backgroundImage: `url(${fixture.teams.home.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                      <span className="fixture-team-name">{fixture.teams.home.name}</span>
                    </div>
                    <div className="fixture-vs-text">VS</div>
                    <div className="fixture-team">
                      <div className="fixture-team-logo" style={{backgroundImage: `url(${fixture.teams.away.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                      <span className="fixture-team-name">{fixture.teams.away.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixtures-page">
      <div className="fixtures-header">
        <div className="fixtures-header-left">
          <div className="global-status">
            <div className="live-dot-small"></div>
            {fixturesData?.length || 0} MATCHES SCHEDULED
          </div>
          <h1 className="live-title">Fixtures</h1>
        </div>
      </div>

      <div className="league-filters" style={{marginTop: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap'}}>
        <button className={`filter-pill ${activeLeague === 'all' ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague('all')}>ALL LEAGUES</button>
        <button className={`filter-pill ${activeLeague === 39 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(39)}>PREMIER LEAGUE</button>
        <button className={`filter-pill ${activeLeague === 140 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(140)}>LA LIGA</button>
        <button className={`filter-pill ${activeLeague === 2 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(2)}>CHAMPIONS LEAGUE</button>
      </div>

      {renderLeagueGroups()}

    </div>
  );
}

// --- HISTORY COMPONENT ---
function History({ fixturesData, isLoadingFixtures }) {
  const [activeLeague, setActiveLeague] = useState('all');
  
  const groupedFixtures = React.useMemo(() => {
    if (!fixturesData) return {};

    // Filter to ONLY completed matches
    const completedFixtures = fixturesData.filter(f => f.goals && f.goals.home !== null);
    
    const filteredFixtures = activeLeague === 'all' 
      ? completedFixtures 
      : completedFixtures.filter(f => f.league.id === activeLeague);

    return filteredFixtures.reduce((acc, fixture) => {
      const leagueId = fixture.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          name: fixture.league.name,
          logo: fixture.league.logo,
          matches: []
        };
      }
      acc[leagueId].matches.push(fixture);
      return acc;
    }, {});
  }, [fixturesData, activeLeague]);

  const renderLeagueGroups = () => {
    if (isLoadingFixtures) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           Loading history...
        </div>
      );
    }

    const leagueIds = Object.keys(groupedFixtures);
    if (leagueIds.length === 0) {
      return (
        <div className="empty-state-message" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
           No completed matches found in the selected leagues.
        </div>
      );
    }

    return leagueIds.map(leagueId => {
      const league = groupedFixtures[leagueId];
      // Sort matches by date descending (most recent first)
      const sortedMatches = [...league.matches].sort((a,b) => new Date(b.fixture.date) - new Date(a.fixture.date));
      
      return (
        <div key={leagueId} className="league-group">
          <div className="league-group-header">
            <div className="league-group-logo">
               <div className="tiny-logo" style={{backgroundImage: `url(${league.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
            </div>
            <div className="league-group-info">
              <span className="league-group-name">{league.name}</span>
              <span className="league-group-matchday">COMPLETED MATCHES</span>
            </div>
          </div>

          <div className="fixture-cards-grid">
            {sortedMatches.map(fixture => {
              const dateObj = new Date(fixture.fixture.date);
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              
              const homeWinner = fixture.goals.home > fixture.goals.away;
              const awayWinner = fixture.goals.away > fixture.goals.home;
              
              return (
                <div key={fixture.fixture.id} className="card match-card" style={{ borderColor: 'rgba(255,255,255,0.1)', padding: '1rem' }}>
                  <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
                    <span className="match-league" style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)'}}>
                      {dateStr}
                    </span>
                    <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px'}}>
                      FT
                    </span>
                  </div>
                  <div className="match-teams">
                    <div className="match-team">
                      <div className="team-info">
                        <div className="team-logo" style={{backgroundImage: `url(${fixture.teams.home.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                        <span style={{fontWeight: homeWinner ? 'bold' : 'normal'}}>{fixture.teams.home.name}</span>
                      </div>
                      <span className={`score ${homeWinner ? 'score-win' : ''}`}>{fixture.goals.home}</span>
                    </div>
                    <div className="match-team">
                      <div className="team-info">
                        <div className="team-logo" style={{backgroundImage: `url(${fixture.teams.away.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#fff'}}></div>
                        <span style={{fontWeight: awayWinner ? 'bold' : 'normal'}}>{fixture.teams.away.name}</span>
                      </div>
                      <span className={`score ${awayWinner ? 'score-win' : ''}`}>{fixture.goals.away}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixtures-page">
      <div className="fixtures-header">
        <div className="fixtures-header-left">
          <h1 className="live-title">Match History</h1>
          <p className="text-muted">Completed Matches & Results</p>
        </div>
      </div>
      
      <div className="league-filters">
        <button className={`filter-pill ${activeLeague === 'all' ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague('all')}>ALL LEAGUES</button>
        <button className={`filter-pill ${activeLeague === 39 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(39)}>PREMIER LEAGUE</button>
        <button className={`filter-pill ${activeLeague === 140 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(140)}>LA LIGA</button>
        <button className={`filter-pill ${activeLeague === 2 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(2)}>CHAMPIONS LEAGUE</button>
      </div>

      <div className="fixtures-container">
        {renderLeagueGroups()}
      </div>
    </div>
  );
}

// --- TEAMS COMPONENT (Directory) ---
function Teams({ onTeamClick }) {
  const [expandedLeague, setExpandedLeague] = useState(null);

  const premierLeagueTeams = PREDEFINED_TEAMS.filter(t => t.league_id === 39);
  const laLigaTeams = PREDEFINED_TEAMS.filter(t => t.league_id === 140);
  
  const renderLeagueSection = (title, country, teamsList, leagueId) => {
    const isExpanded = expandedLeague === leagueId;
    const displayTeams = isExpanded ? teamsList : teamsList.slice(0, 3);
    
    return (
      <section className="teams-league-section" style={{marginBottom: '3rem'}}>
        <div className="teams-section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
          <div className="teams-section-header-left">
            <h2 className="teams-league-name">{title}</h2>
            <span className="teams-league-country">{country}</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div className="teams-count-pill" style={{margin: 0}}>
              {teamsList.length} CLUBS TOTAL
            </div>
            <button 
              className="btn btn-outline" 
              style={{padding: '6px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap'}}
              onClick={() => setExpandedLeague(isExpanded ? null : leagueId)}
            >
              {isExpanded ? 'Show Less' : 'View More'}
            </button>
          </div>
        </div>

        <div className="teams-grid">
          {displayTeams.map(team => (
            <div key={team.api_team_id} className="team-card">
              <div className="team-card-logo" style={{backgroundColor: '#fff', backgroundImage: `url(${team.team_logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center'}}></div>
              <div className="team-card-info">
                <h3 className="team-card-name">{team.team_name}</h3>
                <span className="team-card-stadium" style={{fontSize: '0.75rem'}}>ID: {team.api_team_id}</span>
              </div>
              <button className="btn btn-blue view-squad-btn" onClick={() => onTeamClick(team.api_team_id)}>View Squad &rarr;</button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div className="global-status" style={{marginBottom: '0.5rem'}}>
          GLOBAL DIRECTORY
        </div>
        <h1 className="live-title" style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>Explore Elite Teams</h1>
        <p className="leagues-subtitle" style={{maxWidth: '600px', margin: 0}}>
          Deep dive into tactical setups, squad depth, and performance metrics for the world's most prestigious football clubs.
        </p>
      </div>

      {renderLeagueSection("Premier League", "England • Tier 1 Division", premierLeagueTeams, 39)}
      {renderLeagueSection("La Liga", "Spain • Primera División", laLigaTeams, 140)}
    </div>
  );
}

// --- TEAM DETAILS COMPONENT ---
function TeamDetails({ teamId, onBack }) {
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('team_details')
          .select('*')
          .eq('api_team_id', teamId)
          .single();

        if (error) {
          console.error("Error fetching team details:", error);
        } else {
          setTeam(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="team-details-page">
        <button className="btn btn-outline back-to-teams-btn" onClick={onBack}>
          <ChevronLeft size={16} /> Back to Directory
        </button>
        <div style={{padding: '4rem', textAlign: 'center', color: 'var(--text-muted)'}}>
          <div className="live-dot-small" style={{display: 'inline-block', marginRight: '8px'}}></div>
          Loading rich team data from Supabase...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-details-page">
        <button className="btn btn-outline back-to-teams-btn" onClick={onBack}>
          <ChevronLeft size={16} /> Back to Directory
        </button>
        <div style={{padding: '4rem', textAlign: 'center', color: 'var(--text-muted)'}}>
          <h2 style={{color: '#fff', marginBottom: '1rem'}}>Team Data Not Synced</h2>
          <p>This team's data hasn't been synced from API-Sports to Supabase yet.</p>
          <p>Run the sync script for team ID {teamId} to populate this team's squad.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-details-page">
      <button className="btn btn-outline back-to-teams-btn" onClick={onBack}>
        <ChevronLeft size={16} /> Back to Directory
      </button>

      <section className="td-hero" style={{backgroundImage: `linear-gradient(to right, var(--bg-primary) 20%, transparent 100%), url(${team.venue_image})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '300px', padding: '3rem', position: 'relative', borderRadius: '16px', marginBottom: '2rem'}}>
        <div className="td-hero-overlay" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,12,16,0.7)', borderRadius: '16px'}}></div>
        <div className="td-hero-content" style={{position: 'relative', display: 'flex', alignItems: 'center', gap: '2rem', height: '100%', flexWrap: 'wrap'}}>
          <div className="td-logo-box" style={{backgroundColor: '#fff', backgroundImage: `url(${team.logo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '120px', height: '120px', borderRadius: '24px'}}></div>
          <div className="td-hero-text">
            <div className="td-league-pill" style={{backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '0.75rem'}}>
              <span className="td-dot" style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)'}}></span> {team.country}
            </div>
            <h1 className="td-title" style={{fontSize: '3rem', margin: '0 0 0.5rem 0', fontWeight: '800'}}>{team.name}</h1>
            <p className="td-description" style={{color: 'rgba(255,255,255,0.8)', margin: 0}}>
              Founded in {team.founded} • Managed by {team.coach_name}
            </p>
          </div>
        </div>
      </section>

      <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
        <div className="card" style={{flex: '1 1 300px', backgroundColor: 'rgba(255,255,255,0.03)'}}>
          <h3 style={{fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Stadium</h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <MapPin size={24} className="text-accent" />
            <div>
              <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{team.venue_name}</div>
              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>{team.venue_city} • Capacity: {team.venue_capacity?.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className="card" style={{flex: '1 1 300px', backgroundColor: 'rgba(255,255,255,0.03)'}}>
          <h3 style={{fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Manager</h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2a2d36', backgroundImage: `url(${team.coach_photo})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0}}></div>
            <div>
              <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{team.coach_name}</div>
              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Head Coach</div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>First Team Squad ({team.squad?.length || 0})</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem'}}>
          {team.squad?.map((player) => (
            <div key={player.id} className="card" style={{padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
               <div style={{width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', backgroundImage: `url(${player.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0}}></div>
               <div style={{minWidth: 0}}>
                 <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{player.name}</div>
                 <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap'}}>
                   <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{player.number ? `#${player.number}` : '-'}</span> 
                   • 
                   <span>{player.position}</span>
                   • 
                   <span>{player.age}y</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- MATCH DETAILS COMPONENT ---
function MatchDetails({ matchId, onBack }) {
  const match = matchData[matchId] || matchData.fallback;
  const { homeTeam, awayTeam } = match;

  return (
    <div className="match-details-page">
      {/* Back Button */}
      <button className="btn back-to-live-btn" onClick={onBack}>
        &larr; BACK TO LIVE SCORES
      </button>

      {/* Match Header (Scoreboard) */}
      <div className="md-header">
        <div className="md-team md-team-home">
          <h2 className="md-team-name">{homeTeam.name}</h2>
          <span className="md-team-meta">{homeTeam.league} • {homeTeam.type}</span>
        </div>
        
        <div className="md-score-center">
          <div className="md-logos-scores">
            <div className="md-logo" style={{backgroundColor: homeTeam.logoBg}}></div>
            <div className="md-score-box">
              <span className="md-score-num">{homeTeam.score}</span>
              <span className="md-score-divider">:</span>
              <span className="md-score-num">{awayTeam.score}</span>
            </div>
            <div className="md-logo" style={{backgroundColor: awayTeam.logoBg}}></div>
          </div>
          <div className="md-time-pill">
            <div className="live-dot-small"></div>
            {match.time}
          </div>
          <div className="md-half-text">{match.half}</div>
        </div>
        
        <div className="md-team md-team-away">
          <h2 className="md-team-name">{awayTeam.name}</h2>
          <span className="md-team-meta">{awayTeam.league} • {awayTeam.type}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="md-tabs">
        <button className="md-tab active">Overview</button>
        <button className="md-tab">Lineups</button>
        <button className="md-tab">Live Stats</button>
      </div>

      <div className="md-content-grid">
        {/* Left Column */}
        <div className="md-left-col">
          {/* Tactical Heatmap */}
          <div className="md-card">
            <div className="md-card-header">
              <div className="md-card-title">
                <Globe size={16} /> Tactical Heatmap
              </div>
              <div className="md-possession-pill">
                POSSESSION: {match.possession.home}% - {match.possession.away}%
              </div>
            </div>
            
            <div className="md-pitch-container">
              <div className="md-pitch">
                {/* Pitch Lines (simplified with borders in CSS) */}
                <div className="pitch-center-line"></div>
                <div className="pitch-center-circle"></div>
                <div className="pitch-box pitch-box-left"></div>
                <div className="pitch-box pitch-box-right"></div>
                
                {/* Nodes */}
                {match.heatmapNodes.map((node, i) => (
                  <div 
                    key={i} 
                    className="pitch-node" 
                    style={{ 
                      left: `${node.x}%`, 
                      top: `${node.y}%`,
                      backgroundColor: node.team === 'home' ? homeTeam.color : awayTeam.color 
                    }}
                  >
                    {node.id}
                  </div>
                ))}
              </div>
              
              <div className="md-heatmap-legend">
                <div className="md-legend-item">
                  <div className="td-dot" style={{backgroundColor: homeTeam.color}}></div> {homeTeam.name.toUpperCase()}
                </div>
                <div className="md-legend-item">
                  <div className="td-dot" style={{backgroundColor: awayTeam.color}}></div> {awayTeam.name.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Pressure Index */}
          <div className="md-card">
            <div className="md-card-header">
              <div className="md-card-title">Pressure Index</div>
            </div>
            <div className="md-pressure-chart">
               <div className="md-pressure-bars">
                 {match.pressureData.map((d, i) => (
                   <div className="md-pressure-col" key={i}>
                     <div className="md-bar-wrapper">
                        {/* If home pressure is higher, show home bar, else show away bar - simplified visualization */}
                        {d.home >= d.away ? (
                          <div className="md-bar md-bar-home" style={{height: `${d.home}%`, background: `linear-gradient(to top, rgba(34, 197, 94, 0.1), ${homeTeam.color})`}}></div>
                        ) : (
                          <div className="md-bar md-bar-away" style={{height: `${d.away}%`, background: `linear-gradient(to top, rgba(96, 165, 250, 0.1), ${awayTeam.color})`}}></div>
                        )}
                     </div>
                     <span className="md-bar-label">{d.minute}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md-right-col">
          {/* Win Probability */}
          <div className="md-card">
            <div className="md-card-header">
              <div className="md-card-title">Win Probability</div>
            </div>
            <div className="md-win-prob">
              <div className="md-prob-labels">
                <span style={{color: homeTeam.color}}>{homeTeam.short} {match.winProbability.home}%</span>
                <span className="text-muted">DRAW {match.winProbability.draw}%</span>
                <span style={{color: awayTeam.color}}>{awayTeam.short} {match.winProbability.away}%</span>
              </div>
              <div className="md-prob-bar">
                <div className="md-prob-segment" style={{width: `${match.winProbability.home}%`, backgroundColor: homeTeam.color}}></div>
                <div className="md-prob-segment" style={{width: `${match.winProbability.draw}%`, backgroundColor: '#475569'}}></div>
                <div className="md-prob-segment" style={{width: `${match.winProbability.away}%`, backgroundColor: awayTeam.color}}></div>
              </div>
              <p className="md-prob-text">{match.winProbability.text}</p>
            </div>
          </div>

          {/* Match Info */}
          <div className="md-card">
            <div className="md-card-header">
              <div className="md-card-title">Match Info</div>
            </div>
            <div className="md-info-list">
              <div className="md-info-item">
                <div className="md-info-icon"><MapPin size={16} /></div>
                <div className="md-info-text">
                  <span className="md-info-label">VENUE</span>
                  <span className="md-info-value">{match.matchInfo.venue.name}</span>
                  <span className="md-info-sub">{match.matchInfo.venue.location}</span>
                </div>
              </div>
              <div className="md-info-item">
                <div className="md-info-icon"><AtSign size={16} /></div>
                <div className="md-info-text">
                  <span className="md-info-label">REFEREE</span>
                  <span className="md-info-value">{match.matchInfo.referee.name}</span>
                  <span className="md-info-sub">{match.matchInfo.referee.stats}</span>
                </div>
              </div>
              <div className="md-info-item">
                <div className="md-info-icon"><Thermometer size={16} /></div>
                <div className="md-info-text">
                  <span className="md-info-label">CONDITIONS</span>
                  <span className="md-info-value">{match.matchInfo.conditions.weather}</span>
                  <span className="md-info-sub">{match.matchInfo.conditions.details}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- FULL TABLES COMPONENT ---
function FullTables({ standingsData }) {
  const [activeLeague, setActiveLeague] = useState(39); // default PL

  const renderFullTable = (leagueId, title) => {
    const tableData = standingsData[leagueId] || [];
    if (tableData.length === 0) return null;

    return (
      <div className="card table-card" style={{marginBottom: '2rem', animation: 'fadeIn 0.3s ease'}}>
        <div className="table-header" style={{fontSize: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
          <Trophy size={20} className="table-icon" />
          {title}
        </div>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GD</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.api_team_id || row.id}>
                <td>{row.rank}</td>
                <td style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <img src={row.team_logo} alt={row.team_name} style={{width: '20px', height: '20px'}} />
                  <span style={{fontWeight: '500'}}>{row.team_name}</span>
                </td>
                <td>{row.played || 0}</td>
                <td>{row.win || 0}</td>
                <td>{row.draw || 0}</td>
                <td>{row.lose || 0}</td>
                <td>{row.goals_diff || 0}</td>
                <td style={{fontWeight: 'bold', color: 'var(--accent-primary)'}}>{row.custom_points || row.points || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixtures-page">
      <div className="fixtures-header" style={{alignItems: 'center'}}>
        <div className="fixtures-header-left">
          <h1 className="live-title">League Standings</h1>
          <p className="text-muted">Full 2026/2027 Season Tables</p>
        </div>
      </div>
      
      <div className="league-filters" style={{marginTop: '1.5rem', marginBottom: '2.5rem', justifyContent: 'center'}}>
        <button className={`filter-pill ${activeLeague === 39 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(39)}>PREMIER LEAGUE</button>
        <button className={`filter-pill ${activeLeague === 140 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(140)}>LA LIGA</button>
        <button className={`filter-pill ${activeLeague === 2 ? 'active' : 'outline-pill'}`} onClick={() => setActiveLeague(2)}>CHAMPIONS LEAGUE</button>
      </div>

      <div className="admin-grid" style={{gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto'}}>
        {activeLeague === 39 && renderFullTable(39, "Premier League")}
        {activeLeague === 140 && renderFullTable(140, "La Liga")}
        {activeLeague === 2 && renderFullTable(2, "Champions League")}
      </div>
    </div>
    );
  }
  

// --- MAIN APP COMPONENT ---
function App() {
  const [currentPage, _setCurrentPage] = useState(() => {
    return sessionStorage.getItem('fcms_current_page') || 'home';
  });
  const setCurrentPage = (page) => {
    if (page === currentPage) return;
    
    _setCurrentPage(page);
    sessionStorage.setItem('fcms_current_page', page);
    window.scrollTo(0,0);
  };

  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    return sessionStorage.getItem('fcms_selected_team') || null;
  });
  const [selectedMatchId, setSelectedMatchId] = useState(() => {
    return sessionStorage.getItem('fcms_selected_match') || null;
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Supabase Data State
  const [liveMatches, setLiveMatches] = useState([]);
  const [standingsData, setStandingsData] = useState([]);
  const [fixturesData, setFixturesData] = useState([]);
  const [leagueStats, setLeagueStats] = useState([]);
  const [activeStatsLeague, setActiveStatsLeague] = useState('Premier League');
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(true);


  // --- Session Persistence ---
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile && profile.approval_status === 'approved') {
          setCurrentUser(profile);
        } else {
          await supabase.auth.signOut();
        }
      }
    };
    
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('home');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  // ---------------------------

  // Fetch Logic from Supabase
  useEffect(() => {
    // 1. Fetch Standings
    const fetchStandings = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_standings')
          .select('*')
          .order('rank', { ascending: true });

        if (error) throw error;
        
        if (data || PREDEFINED_TEAMS) {
          const dbData = data || [];
          
          // Merge with PREDEFINED_TEAMS
          const merged = PREDEFINED_TEAMS.map((team, index) => {
            const savedTeam = dbData.find(s => s.api_team_id === team.api_team_id && s.league_id === team.league_id);
            if (savedTeam) {
              return savedTeam;
            } else {
              return {
                ...team,
                rank: index + 1,
                played: 0, win: 0, draw: 0, lose: 0, goals_diff: 0, points: 0, custom_points: 0
              };
            }
          });

          // Sort by points (custom_points first, then points)
          merged.sort((a, b) => {
            const aPts = a.custom_points || a.points || 0;
            const bPts = b.custom_points || b.points || 0;
            return bPts - aPts;
          });

          // Group by league
          const grouped = merged.reduce((acc, row) => {
            if (!acc[row.league_id]) acc[row.league_id] = [];
            acc[row.league_id].push(row);
            return acc;
          }, {});
          
          // Re-assign ranks within each league group
          Object.keys(grouped).forEach(lid => {
            grouped[lid].forEach((team, idx) => {
              team.rank = idx + 1;
            });
          });

          setStandingsData(grouped);
        }
      } catch (error) {
        console.error("Error fetching standings from Supabase:", error);
      } finally {
        setIsLoadingStandings(false);
      }
    };

    // 2. Fetch Live Matches
    const fetchLiveMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('live_fixtures')
          .select('*')
          .order('elapsed', { ascending: false });

        if (error) throw error;
        if (data) setLiveMatches(data);
      } catch (error) {
        console.error("Error fetching live matches from Supabase:", error);
      } finally {
        setIsLoadingLive(false);
      }
    };

    // 3. Fetch Scheduled Fixtures
    const fetchFixtures = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_fixtures')
          .select('*')
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true });

        if (error) throw error;
        
        if (data) {
          // Transform to the structure expected by the UI
          const transformed = data.map(row => {
            let leagueName = '';
            let leagueLogo = '';
            if (row.league_id === 39) { leagueName = 'Premier League'; leagueLogo = 'https://media.api-sports.io/football/leagues/39.png'; }
            if (row.league_id === 140) { leagueName = 'La Liga'; leagueLogo = 'https://media.api-sports.io/football/leagues/140.png'; }
            if (row.league_id === 2) { leagueName = 'Champions League'; leagueLogo = 'https://media.api-sports.io/football/leagues/2.png'; }

            return {
              league: { id: row.league_id, name: leagueName, logo: leagueLogo },
              fixture: { 
                id: row.id, 
                date: `${row.match_date}T${row.match_time}Z`, 
                status: { short: row.home_goals !== null ? 'FT' : 'NS' } 
              },
              teams: {
                home: { name: row.home_team_name, logo: row.home_team_logo },
                away: { name: row.away_team_name, logo: row.away_team_logo }
              },
              goals: { home: row.home_goals, away: row.away_goals }
            };
          });
          setFixturesData(transformed);
        }
      } catch (error) {
        console.error("Error fetching custom fixtures:", error);
      } finally {
        setIsLoadingFixtures(false);
      }
    };

    // 4. Fetch Player Stats
    const fetchPlayerStats = async () => {
      try {
        const { data, error } = await supabase
          .from('player_stats')
          .select('*')
          .order('stat_value', { ascending: false });
        if (error) throw error;
        if (data) setLeagueStats(data);
      } catch (error) {
        console.error("Error fetching player stats:", error);
      }
    };

    fetchStandings();
    fetchLiveMatches();
    fetchFixtures();
    fetchPlayerStats();

    // 3. Supabase Realtime Subscription for Live Matches and Scheduled Fixtures
    const subscription = supabase
      .channel('live-matches-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_fixtures' }, payload => {
        console.log('Realtime update received!', payload);
        fetchLiveMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_fixtures' }, payload => {
        console.log('Realtime fixture update received!', payload);
        fetchFixtures();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, payload => {
        console.log('Realtime player stats update received!', payload);
        fetchPlayerStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleTeamClick = (teamId) => {
    setSelectedTeamId(teamId);
    sessionStorage.setItem('fcms_selected_team', teamId);
    setCurrentPage('team_details');
  };

  const handleMatchClick = (matchId) => {
    setSelectedMatchId(matchId);
    sessionStorage.setItem('fcms_selected_match', matchId);
    setCurrentPage('match_details');
  };

  const handleBackToTeams = () => {
    setSelectedTeamId(null);
    sessionStorage.removeItem('fcms_selected_team');
    setCurrentPage('teams');
  };

  const handleBackToLiveScores = () => {
    setSelectedMatchId(null);
    sessionStorage.removeItem('fcms_selected_match');
    setCurrentPage('live'); 
  };

  const isFullScreenPage = currentPage === 'match_details';

  return (
    <div className="app-container">

      {!isFullScreenPage && (
        <nav className="navbar">
          <div className="nav-left">
            <div className="logo">
              <img src="/logo.png" alt="FCMS Logo" style={{height: '48px'}} />
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage('home')} className={`nav-link ${currentPage === 'home' ? 'active-underline' : ''}`}>Home</button>
              <button onClick={() => setCurrentPage('live')} className={`nav-link ${currentPage === 'live' ? 'active-underline' : ''}`}>Live</button>
              <button onClick={() => setCurrentPage('fixtures')} className={`nav-link ${currentPage === 'fixtures' ? 'active-underline' : ''}`}>Fixtures</button>
              <button onClick={() => setCurrentPage('history')} className={`nav-link ${currentPage === 'history' ? 'active-underline' : ''}`}>History</button>
              <button onClick={() => setCurrentPage('tables')} className={`nav-link ${currentPage === 'tables' ? 'active-underline' : ''}`}>Tables</button>
              <button onClick={() => { setSelectedTeamId(null); setCurrentPage('teams'); }} className={`nav-link ${currentPage === 'teams' || currentPage === 'team_details' ? 'active-underline' : ''}`}>Teams</button>
              
              {currentUser && currentUser.role === 'super_admin' && (
                <button onClick={() => setCurrentPage('admin')} className={`nav-link ${currentPage === 'admin' ? 'active-underline' : ''}`} style={{color: 'var(--accent-primary)'}}>Admin</button>
              )}
              
              {currentUser && currentUser.role === 'coach' && (
                <button onClick={() => setCurrentPage('coach_hub')} className={`nav-link ${currentPage === 'coach_hub' ? 'active-underline' : ''}`} style={{color: 'var(--accent-primary)'}}>Coach Hub</button>
              )}
              
              {currentUser && currentUser.role === 'player' && (
                <button onClick={() => setCurrentPage('player_hub')} className={`nav-link ${currentPage === 'player_hub' ? 'active-underline' : ''}`} style={{color: 'var(--accent-primary)'}}>Player Hub</button>
              )}
            </div>
          </div>
          <div className="nav-right">
            {!currentUser ? (
              <>
                <button className="login-btn" onClick={() => setCurrentPage('login')}>Login</button>
                <button className="btn btn-primary" onClick={() => setCurrentPage('register')}>Register</button>
              </>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <span className="nav-user-badge">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button className="btn btn-outline" onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setCurrentPage('home'); }}>Logout</button>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className="main-content" style={isFullScreenPage ? { paddingTop: '2rem' } : {}}>
        {currentPage === 'login' && <LoginPage onLoginSuccess={(profile) => { setCurrentUser(profile); setCurrentPage('home'); }} onGoToRegister={() => setCurrentPage('register')} />}
        {currentPage === 'register' && <RegisterPage onRegisterSuccess={() => setCurrentPage('login')} onBackToLogin={() => setCurrentPage('login')} />}
        {currentPage === 'coach_hub' && currentUser && currentUser.role === 'coach' && <CoachHub currentUser={currentUser} />}
        {currentPage === 'player_hub' && currentUser && currentUser.role === 'player' && <PlayerHub currentUser={currentUser} />}
        {currentPage === 'home' && (
          <Home 
            onMatchClick={handleMatchClick}
            onViewTables={() => { setCurrentPage('tables'); window.scrollTo(0,0); }}
            onRegisterClick={() => { setCurrentPage('register'); window.scrollTo(0,0); }}
            liveMatches={liveMatches} 
            isLoadingLive={isLoadingLive}
            standingsData={standingsData}
            isLoadingStandings={isLoadingStandings}
            fixturesData={fixturesData}
            isLoadingFixtures={isLoadingFixtures}
            leagueStats={leagueStats}
            activeStatsLeague={activeStatsLeague}
            setActiveStatsLeague={setActiveStatsLeague}
          />
        )}
        {currentPage === 'live' && (
          <LiveMatches 
            onMatchClick={handleMatchClick} 
            liveMatches={liveMatches} 
            isLoadingLive={isLoadingLive} 
          />
        )}
        {currentPage === 'fixtures' && (
          <Fixtures 
            onMatchClick={handleMatchClick} 
            fixturesData={fixturesData}
            isLoadingFixtures={isLoadingFixtures}
          />
        )}
        {currentPage === 'history' && (
          <History 
            fixturesData={fixturesData}
            isLoadingFixtures={isLoadingFixtures}
          />
        )}
        {currentPage === 'teams' && <Teams onTeamClick={handleTeamClick} />}
        {currentPage === 'team_details' && <TeamDetails teamId={selectedTeamId} onBack={handleBackToTeams} />}
        {currentPage === 'match_details' && <MatchDetails matchId={selectedMatchId} onBack={handleBackToLiveScores} />}
        {currentPage === 'admin' && <AdminDashboard />}
        {currentPage === 'tables' && <FullTables standingsData={standingsData} />}
      </main>
    </div>
  );
}

export default App;


