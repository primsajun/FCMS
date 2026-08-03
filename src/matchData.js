export const matchData = {
  madrid_v_city: {
    id: 'madrid_v_city',
    status: 'LIVE',
    time: '84:20',
    half: '2nd Half',
    homeTeam: {
      name: 'Real Madrid',
      short: 'RM',
      league: 'LALIGA',
      type: 'HOME',
      color: '#22c55e', // Using green as per mockup for Madrid's stats here
      logoBg: '#1e293b',
      score: 2
    },
    awayTeam: {
      name: 'Man City',
      short: 'MC',
      league: 'PREMIER LEAGUE',
      type: 'AWAY',
      color: '#60a5fa', // Blue for City
      logoBg: '#1e293b',
      score: 2
    },
    possession: { home: 48, away: 52 },
    heatmapNodes: [
      { id: 9, team: 'home', x: 25, y: 35 }, // Green node
      { id: 10, team: 'home', x: 35, y: 55 },
      { id: 20, team: 'away', x: 65, y: 40 }, // Blue node
      { id: 17, team: 'away', x: 75, y: 65 }
    ],
    pressureData: [
      { minute: "0'", home: 40, away: 20 },
      { minute: "15'", home: 50, away: 25 },
      { minute: "30'", home: 35, away: 30 },
      { minute: "HT", home: 45, away: 45 },
      { minute: "60'", home: 60, away: 50 },
      { minute: "75'", home: 30, away: 40 },
      { minute: "LIVE", home: 40, away: 35 }
    ],
    winProbability: {
      home: 32,
      draw: 44,
      away: 24,
      text: "Probability shifted +12% towards Real Madrid after the equalizing goal."
    },
    matchInfo: {
      venue: {
        name: 'Santiago Bernabéu',
        location: 'Madrid, Spain (81,044 capacity)'
      },
      referee: {
        name: 'Szymon Marciniak',
        stats: 'Poland • Avg. 4.2 cards/match'
      },
      conditions: {
        weather: 'Clear Sky • 18°C',
        details: 'Humidity: 45% • Wind: 8km/h'
      }
    },
    standings: [
      { pos: 1, team: 'Man City', pl: 4, pts: 10, isTarget: false },
      { pos: 2, team: 'Real Madrid', pl: 4, pts: 8, isTarget: true }, // Highlighted green
      { pos: 3, team: 'Inter Milan', pl: 4, pts: 4, isTarget: false }
    ]
  },
  
  fallback: {
    status: 'FT',
    time: '90:00',
    half: 'Full Time',
    homeTeam: {
      name: 'Home Team',
      short: 'HOME',
      league: 'LEAGUE',
      type: 'HOME',
      color: '#22c55e',
      logoBg: '#1e293b',
      score: 1
    },
    awayTeam: {
      name: 'Away Team',
      short: 'AWAY',
      league: 'LEAGUE',
      type: 'AWAY',
      color: '#60a5fa',
      logoBg: '#1e293b',
      score: 0
    },
    possession: { home: 50, away: 50 },
    heatmapNodes: [
      { id: 9, team: 'home', x: 30, y: 50 },
      { id: 10, team: 'away', x: 70, y: 50 }
    ],
    pressureData: [
      { minute: "0'", home: 20, away: 20 },
      { minute: "45'", home: 30, away: 30 },
      { minute: "90'", home: 40, away: 40 }
    ],
    winProbability: {
      home: 33,
      draw: 34,
      away: 33,
      text: "Data not fully available for this match."
    },
    matchInfo: {
      venue: { name: 'Main Stadium', location: 'City, Country' },
      referee: { name: 'TBD', stats: 'N/A' },
      conditions: { weather: 'Clear', details: 'Normal conditions' }
    },
    standings: [
      { pos: 1, team: 'Home Team', pl: 1, pts: 3, isTarget: true },
      { pos: 2, team: 'Away Team', pl: 1, pts: 0, isTarget: false }
    ]
  }
};
