const fs = require("fs");
const vm = require("vm");
const root = __dirname + "/..";

function el() { return { hidden: false, textContent:"", value:"", innerHTML:"", parentElement:null, parentNode:null, dataset:{}, style:{setProperty(){},removeProperty(){}}, classList:{add(){},remove(){},toggle(){},contains(){return false}}, addEventListener(){}, setAttribute(){}, querySelectorAll(){return[]}, querySelector(){return el()}, closest(){return null}, appendChild(){}, after(){}, before(){}, insertBefore(){}, remove(){}, replaceChildren(){}, scrollIntoView(){}, showModal(){}, close(){}, focus(){}, click(){}, getAttribute(){return null} }; }

const ctx = {
  console, URL, URLSearchParams, Object, Array, Map, Set, Math, Date, JSON,
  isNaN, parseInt, parseFloat, Number, String, Boolean,
  Error, TypeError, ReferenceError, Promise, Intl,
  setTimeout:()=>1, clearTimeout:()=>{}, setInterval:()=>1, clearInterval:()=>{},
  requestAnimationFrame:()=>1, cancelAnimationFrame:()=>{},
  window: { addEventListener(){}, scrollTo(){}, matchMedia(){return{matches:false}}, location:{pathname:"/",search:"",hash:"",href:"http://localhost/"}, history:{replaceState(){},pushState(){}}, setInterval:()=>1, setTimeout:()=>1 },
  _els: new Map(),
  document: {
    querySelector(s){if(!ctx._els.has(s))ctx._els.set(s,el());return ctx._els.get(s)},
    querySelectorAll(){return[]}, createElement(){return el()}, createComment(){return el()},
    addEventListener(){},
    body:{classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{},hidden:false,addEventListener(){}},
    documentElement:{classList:{add(){},remove(){},toggle(){},contains(){return false}}},
    activeElement:{tagName:"BODY"}, fullscreenElement:null
  },
  localStorage:{getItem(){return null},setItem(){}}
};
vm.createContext(ctx);

const files = ["player-pools.generated.js","data.js","retro-data.js","data/retro/2014/squads.js","data/retro/2014/schedule.js","retro-engine.js","presentation-engine.js","simulation-engine.js","legacy-data/catalog.generated.js","app.js"];
const src = files.map(f=>fs.readFileSync(root+"/"+f,"utf8")).join("\n");
vm.runInContext(src, ctx);

vm.runInContext(`
const englandId = TEAMS.find(t=>t.name==='England').id;
const teamByName = (n) => TEAMS.find(t=>t.name===n);
const england = teamByName('England');
console.log('England rating: ' + england.rating + '  Seed: #' + england.seed + '  Confed: ' + england.confed);
console.log('FIFA rank: ' + england.fifaRank + '  Points: ' + england.fifaPoints);
console.log('Sim sub-ratings: att=' + england.simulationRatings.attack + ' mid=' + england.simulationRatings.midfield + ' def=' + england.simulationRatings.defence + ' gk=' + england.simulationRatings.goalkeeper + ' depth=' + england.simulationRatings.squadDepth + ' exp=' + england.simulationRatings.experience + ' pen=' + england.simulationRatings.penalties);
console.log('');

const ALL_SCORERS = {};
let englandStageCount = {};

for (let t = 0; t < 5; t++) {
  state.drawSeed = (Date.now() + t * 777) % 2147483647;
  state.settings = { ...defaultSettings, upset: 'balanced', goals: 'normal', realNames: true, realPlayersOnly: true };
  state.rounds = [createFirstRound(state.drawSeed)];
  state.started = true;
  state.spectateTeamId = null;
  state.neutralView = true;
  state.standardTactic = 'balanced';

  for (let r = 0; r < 8; r++) {
    state.activeRound = r;
    state.rounds[r].forEach(function(m) { m.result = simulateMatch(m, r); m.result.revealed = true; });
    if (r < 7) buildNextRound(r);
  }

  let stage = 'R256';
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < state.rounds[r].length; i++) {
      var m = state.rounds[r][i];
      if (m.homeId === englandId || m.awayId === englandId) {
        if (m.result) {
          var events = m.homeId === englandId ? m.result.homeEvents : m.result.awayEvents;
          (events || []).forEach(function(e) {
            if (e.goalType === 'ownGoal') return;
            ALL_SCORERS[e.scorer] = (ALL_SCORERS[e.scorer] || 0) + 1;
          });

          var lost = m.result.winnerId !== englandId;
          var ROUNDS = ['R256','R128','R64','R32','R16','QF','SF','Final'];
          if (lost && stage === 'R256') { stage = ROUNDS[r]; }
          else if (r === 7 && !lost) { stage = 'WINNER'; }
        }
      }
    }
  }
  englandStageCount[stage] = (englandStageCount[stage] || 0) + 1;
}

console.log('England finishes:');
Object.entries(englandStageCount).sort().forEach(function(e) { console.log('  ' + e[0] + ': ' + e[1] + 'x'); });

console.log('');
var top = Object.entries(ALL_SCORERS).sort(function(a,b){return b[1]-a[1]}).slice(0, 8);
console.log('Top England scorers (5 tourneys):');
top.forEach(function(e, i) {
  var name = e[0], goals = e[1];
  var prof = england.playerProfiles ? england.playerProfiles.find(function(p){return p.name===name}) : null;
  var ovr = prof ? prof.overall : 'gen';
  var fin = prof ? prof.finishing : 'gen';
  var pos = prof ? prof.position : 'gen';
  console.log('  ' + (i+1) + '. ' + name + ' - ' + goals + ' goals  (pos:' + pos + ' ovr:' + ovr + ' fin:' + fin + ')');
});

console.log('');
console.log('--- England override profiles ---');
['Jude Bellingham','Bukayo Saka','Harry Kane','Phil Foden','Cole Palmer','Kobbie Mainoo','Declan Rice','Marcus Rashford'].forEach(function(name) {
  var p = PLAYER_PROFILE_OVERRIDES.get(name);
  if (p) console.log('  ' + name + ': ovr=' + p.overall + ' fin=' + p.finishing + ' pos=' + p.position + ' role=' + p.attackingRole + (p.scoringEmphasis ? ' emph=' + p.scoringEmphasis : '') + (p.penaltyTaker ? ' [PK]' : ''));
});
`, ctx);
