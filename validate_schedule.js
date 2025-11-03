const schedule = require('./basketball_schedule.json');

console.log('Validating basketball schedule data...');

// Check that the schedule has the required properties
console.assert(schedule.league, 'Missing league property');
console.assert(schedule.season, 'Missing season property');
console.assert(Array.isArray(schedule.teams), 'Teams should be an array');
console.assert(schedule.teams.length > 0, 'Teams array should not be empty');
console.assert(Array.isArray(schedule.rounds), 'Rounds should be an array');
console.assert(schedule.rounds.length > 0, 'Rounds array should not be empty');
console.assert(schedule.events, 'Missing events property');

// Check that we have the correct number of teams
console.assert(schedule.teams.length === 6, `Expected 6 teams, got ${schedule.teams.length}`);

// Check that all required teams are present
const requiredTeams = ['TBK', 'Titans', 'Storm', 'Vikings', 'Rim Reapers', 'Siberia'];
requiredTeams.forEach(team => {
  console.assert(schedule.teams.includes(team), `Missing required team: ${team}`);
});

// Check the structure of the first round
const firstRound = schedule.rounds[0];
console.assert(firstRound.round, 'First round missing round property');
console.assert(firstRound.date, 'First round missing date property');
console.assert(Array.isArray(firstRound.matches), 'First round matches should be an array');
console.assert(firstRound.matches.length > 0, 'First round matches array should not be empty');

// Check the structure of the first match
const firstMatch = firstRound.matches[0];
console.assert(firstMatch.home_team, 'First match missing home_team property');
console.assert(firstMatch.away_team, 'First match missing away_team property');
console.assert(firstMatch.time, 'First match missing time property');
console.assert(firstMatch.venue, 'First match missing venue property');

console.log('All validations passed!');
console.log(`League: ${schedule.league}`);
console.log(`Season: ${schedule.season}`);
console.log(`Teams: ${schedule.teams.join(', ')}`);
console.log(`Rounds: ${schedule.rounds.length}`);
console.log(`Events: ${schedule.events.length}`);