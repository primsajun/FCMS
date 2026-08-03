export const teamsData = {
  arsenal: {
    id: 'arsenal',
    name: 'ARSENAL FC',
    league: 'PREMIER LEAGUE',
    description: "North London's premier football club, renowned for a legacy of attacking football and tactical innovation at the Emirates Stadium.",
    manager: 'Mikel Arteta',
    founded: '1886',
    stadium: 'Emirates Stadium',
    capacity: '60,704',
    themeColor: '#dc2626',
    logoColor: '#dc2626',
    kits: [
      {
        name: 'The Classic Red',
        type: 'HOME KIT',
        desc: 'Authentic red and white primary jersey, featuring the 2024 tactical weave.',
        btnColor: '#22c55e'
      },
      {
        name: 'Midnight Gold',
        type: 'AWAY KIT',
        desc: 'Sophisticated black jersey with gold-threaded crest and trim for away matches.',
        btnColor: '#2563eb'
      }
    ],
    squad: {
      goalkeepers: [
        { number: 22, name: 'David Raya', country: 'SPAIN' },
        { number: 32, name: 'Neto', country: 'BRAZIL' }
      ],
      defenders: [
        { number: 2, name: 'William Saliba', country: 'FRANCE' },
        { number: 6, name: 'Gabriel', country: 'BRAZIL' },
        { number: 4, name: 'Ben White', country: 'ENGLAND' },
        { number: 33, name: 'R. Calafiori', country: 'ITALY' }
      ],
      midfielders: [
        { number: 8, name: 'Martin Odegaard', country: 'NORWAY' },
        { number: 41, name: 'Declan Rice', country: 'ENGLAND' },
        { number: 5, name: 'Thomas Partey', country: 'GHANA' }
      ],
      forwards: [
        { number: 7, name: 'Bukayo Saka', country: 'ENGLAND' },
        { number: 29, name: 'Kai Havertz', country: 'GERMANY' },
        { number: 11, name: 'Gabriel Martinelli', country: 'BRAZIL' }
      ]
    }
  },
  realmadrid: {
    id: 'realmadrid',
    name: 'REAL MADRID',
    league: 'LA LIGA',
    description: "The kings of Europe. A club built on a history of galacticos, unrelenting ambition, and a relentless pursuit of the Champions League.",
    manager: 'Carlo Ancelotti',
    founded: '1902',
    stadium: 'Santiago Bernabéu',
    capacity: '83,186',
    themeColor: '#f8fafc',
    logoColor: '#f8fafc',
    kits: [
      {
        name: 'Blanco Classic',
        type: 'HOME KIT',
        desc: 'The iconic pristine white jersey featuring subtle houndstooth texturing.',
        btnColor: '#22c55e'
      },
      {
        name: 'Royal Purple',
        type: 'AWAY KIT',
        desc: 'A vibrant return to the legendary purple away colors of the 90s era.',
        btnColor: '#2563eb'
      }
    ],
    squad: {
      goalkeepers: [
        { number: 1, name: 'Thibaut Courtois', country: 'BELGIUM' },
        { number: 13, name: 'Andriy Lunin', country: 'UKRAINE' }
      ],
      defenders: [
        { number: 2, name: 'Dani Carvajal', country: 'SPAIN' },
        { number: 3, name: 'Eder Militao', country: 'BRAZIL' },
        { number: 4, name: 'David Alaba', country: 'AUSTRIA' },
        { number: 22, name: 'Antonio Rüdiger', country: 'GERMANY' }
      ],
      midfielders: [
        { number: 5, name: 'Jude Bellingham', country: 'ENGLAND' },
        { number: 8, name: 'Toni Kroos', country: 'GERMANY' },
        { number: 10, name: 'Luka Modric', country: 'CROATIA' },
        { number: 15, name: 'Federico Valverde', country: 'URUGUAY' }
      ],
      forwards: [
        { number: 7, name: 'Vinícius Júnior', country: 'BRAZIL' },
        { number: 11, name: 'Rodrygo', country: 'BRAZIL' },
        { number: 9, name: 'Kylian Mbappé', country: 'FRANCE' }
      ]
    }
  },
  // Template fallback for other teams
  fallback: {
    name: 'ELITE CLUB',
    league: 'TOP DIVISION',
    description: "One of the premier football clubs in the world, renowned for excellence and a massive global fanbase.",
    manager: 'Head Coach',
    founded: 'Est. 1900',
    stadium: 'Main Stadium',
    capacity: '50,000+',
    themeColor: '#3b82f6',
    logoColor: '#3b82f6',
    kits: [
      {
        name: 'Primary Colors',
        type: 'HOME KIT',
        desc: 'The traditional home colors of the club, representing decades of history.',
        btnColor: '#22c55e'
      },
      {
        name: 'Alternate Strip',
        type: 'AWAY KIT',
        desc: 'The official away kit, designed for maximum performance on the road.',
        btnColor: '#2563eb'
      }
    ],
    squad: {
      goalkeepers: [
        { number: 1, name: 'Starting Keeper', country: 'INTL' },
        { number: 13, name: 'Backup Keeper', country: 'INTL' }
      ],
      defenders: [
        { number: 2, name: 'Right Back', country: 'INTL' },
        { number: 4, name: 'Center Back', country: 'INTL' },
        { number: 5, name: 'Center Back', country: 'INTL' },
        { number: 3, name: 'Left Back', country: 'INTL' }
      ],
      midfielders: [
        { number: 6, name: 'Defensive Mid', country: 'INTL' },
        { number: 8, name: 'Central Mid', country: 'INTL' },
        { number: 10, name: 'Attacking Mid', country: 'INTL' }
      ],
      forwards: [
        { number: 7, name: 'Right Winger', country: 'INTL' },
        { number: 9, name: 'Striker', country: 'INTL' },
        { number: 11, name: 'Left Winger', country: 'INTL' }
      ]
    }
  }
};
