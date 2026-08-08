/* UEFA Euro 2020 multi-city schedule metadata (tournament played in 2021). */
const RETRO_EURO_2020_GROUPS = Object.freeze({
  A: Object.freeze(["Turkey", "Italy", "Wales", "Switzerland"]),
  B: Object.freeze(["Denmark", "Finland", "Belgium", "Russia"]),
  C: Object.freeze(["Netherlands", "Ukraine", "Austria", "North Macedonia"]),
  D: Object.freeze(["England", "Croatia", "Scotland", "Czech Republic"]),
  E: Object.freeze(["Spain", "Sweden", "Poland", "Slovakia"]),
  F: Object.freeze(["Hungary", "Portugal", "France", "Germany"]),
});

const RETRO_EURO_2020_GROUP_VENUES = Object.freeze({
  A: Object.freeze([{ stadium: "Stadio Olimpico", city: "Rome" }, { stadium: "Baku Olympic Stadium", city: "Baku" }]),
  B: Object.freeze([{ stadium: "Parken Stadium", city: "Copenhagen" }, { stadium: "Saint Petersburg Stadium", city: "Saint Petersburg" }]),
  C: Object.freeze([{ stadium: "Johan Cruyff Arena", city: "Amsterdam" }, { stadium: "Arena Nationala", city: "Bucharest" }]),
  D: Object.freeze([{ stadium: "Wembley Stadium", city: "London" }, { stadium: "Hampden Park", city: "Glasgow" }]),
  E: Object.freeze([{ stadium: "La Cartuja", city: "Seville" }, { stadium: "Saint Petersburg Stadium", city: "Saint Petersburg" }]),
  F: Object.freeze([{ stadium: "Puskas Arena", city: "Budapest" }, { stadium: "Football Arena Munich", city: "Munich" }]),
});

const RETRO_EURO_2020_GROUP_SCHEDULE = Object.freeze((() => {
  const schedule = {};
  const pairings = Object.freeze([
    Object.freeze([[0, 1], [2, 3]]),
    Object.freeze([[0, 2], [3, 1]]),
    Object.freeze([[3, 0], [1, 2]]),
  ]);
  let matchNumber = 1;
  Object.entries(RETRO_EURO_2020_GROUPS).forEach(([group, teams], groupIndex) => {
    pairings.forEach((matchday, matchdayIndex) => {
      matchday.forEach(([homeIndex, awayIndex], pairingIndex) => {
        const venue = RETRO_EURO_2020_GROUP_VENUES[group][(matchdayIndex + pairingIndex) % 2];
        const day = 11 + Math.min(12, groupIndex + matchdayIndex * 6 + pairingIndex);
        const date = day <= 30 ? `2021-06-${String(day).padStart(2, "0")}` : "2021-06-23";
        schedule[`${teams[homeIndex]}|${teams[awayIndex]}`] = Object.freeze({
          matchNumber,
          date,
          localTime: pairingIndex ? "21:00" : "18:00",
          utcOffset: "+02:00",
          stadium: venue.stadium,
          city: venue.city,
        });
        matchNumber += 1;
      });
    });
  });
  return schedule;
})());

const RETRO_EURO_2020_KNOCKOUT_SCHEDULE = Object.freeze({
  "ko-r16-m1": Object.freeze({ matchNumber: 37, date: "2021-06-26", localTime: "18:00", utcOffset: "+02:00", stadium: "Johan Cruyff Arena", city: "Amsterdam" }),
  "ko-r16-m2": Object.freeze({ matchNumber: 38, date: "2021-06-26", localTime: "21:00", utcOffset: "+01:00", stadium: "Wembley Stadium", city: "London" }),
  "ko-r16-m3": Object.freeze({ matchNumber: 39, date: "2021-06-27", localTime: "18:00", utcOffset: "+02:00", stadium: "Puskas Arena", city: "Budapest" }),
  "ko-r16-m4": Object.freeze({ matchNumber: 40, date: "2021-06-27", localTime: "21:00", utcOffset: "+02:00", stadium: "La Cartuja", city: "Seville" }),
  "ko-r16-m5": Object.freeze({ matchNumber: 41, date: "2021-06-28", localTime: "18:00", utcOffset: "+03:00", stadium: "Arena Nationala", city: "Bucharest" }),
  "ko-r16-m6": Object.freeze({ matchNumber: 42, date: "2021-06-28", localTime: "21:00", utcOffset: "+02:00", stadium: "Parken Stadium", city: "Copenhagen" }),
  "ko-r16-m7": Object.freeze({ matchNumber: 43, date: "2021-06-29", localTime: "18:00", utcOffset: "+01:00", stadium: "Wembley Stadium", city: "London" }),
  "ko-r16-m8": Object.freeze({ matchNumber: 44, date: "2021-06-29", localTime: "21:00", utcOffset: "+02:00", stadium: "Hampden Park", city: "Glasgow" }),
  "ko-r2-m1": Object.freeze({ matchNumber: 45, date: "2021-07-02", localTime: "18:00", utcOffset: "+03:00", stadium: "Saint Petersburg Stadium", city: "Saint Petersburg" }),
  "ko-r2-m2": Object.freeze({ matchNumber: 46, date: "2021-07-02", localTime: "21:00", utcOffset: "+02:00", stadium: "Football Arena Munich", city: "Munich" }),
  "ko-r2-m3": Object.freeze({ matchNumber: 47, date: "2021-07-03", localTime: "18:00", utcOffset: "+04:00", stadium: "Baku Olympic Stadium", city: "Baku" }),
  "ko-r2-m4": Object.freeze({ matchNumber: 48, date: "2021-07-03", localTime: "21:00", utcOffset: "+02:00", stadium: "Stadio Olimpico", city: "Rome" }),
  "ko-r3-m1": Object.freeze({ matchNumber: 49, date: "2021-07-06", localTime: "20:00", utcOffset: "+01:00", stadium: "Wembley Stadium", city: "London" }),
  "ko-r3-m2": Object.freeze({ matchNumber: 50, date: "2021-07-07", localTime: "20:00", utcOffset: "+01:00", stadium: "Wembley Stadium", city: "London" }),
  "ko-final": Object.freeze({ matchNumber: 51, date: "2021-07-11", localTime: "20:00", utcOffset: "+01:00", stadium: "Wembley Stadium", city: "London" }),
});
