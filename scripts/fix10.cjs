const fs = require('fs');
let code = fs.readFileSync('src/predefinedTeams.js', 'utf8');

const map = {
  '1. FC KA ln': 192,
  'FC Schalke 04': 174,
  'Hamburger SV': 175,
  'SC Paderborn 07': 185,
  'SV 07 Elversberg': 1660,
  'Frosinone Calcio': 512,
  'US Sassuolo Calcio': 488,
  'FC Lorient': 97,
  'ES Troyes AC': 110,
  'Le Mans FC': 1298
};

Object.keys(map).forEach(name => {
  const regex = new RegExp('api_team_id: \\\\d+, team_name: \'' + name + '\'');
  code = code.replace(regex, 'api_team_id: ' + map[name] + ', team_name: \'' + name + '\'');
});

fs.writeFileSync('src/predefinedTeams.js', code);
console.log('Fixed the remaining 10 teams!');

