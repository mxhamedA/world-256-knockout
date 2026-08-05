/*
 * Official Copa América USA 2024 match order and venue data.
 * Kickoff times are the venue-local times used by the 2024 tournament
 * calendar; the official CONMEBOL results page is retained in the source
 * notes for the fixture order and venue cross-check.
 */
const RETRO_COPA_2024_GROUP_SCHEDULE = Object.freeze({
  "Argentina|Canada": { matchNumber: 1, date: "2024-06-20", localTime: "20:00", utcOffset: "-04:00", stadium: "Mercedes-Benz Stadium", city: "Atlanta", state: "Georgia", group: "A", matchday: 1 },
  "Peru|Chile": { matchNumber: 2, date: "2024-06-21", localTime: "20:00", utcOffset: "-05:00", stadium: "AT&T Stadium", city: "Arlington", state: "Texas", group: "A", matchday: 1 },
  "Ecuador|Venezuela": { matchNumber: 3, date: "2024-06-22", localTime: "18:00", utcOffset: "-07:00", stadium: "Levi's Stadium", city: "Santa Clara", state: "California", group: "B", matchday: 1 },
  "Mexico|Jamaica": { matchNumber: 4, date: "2024-06-22", localTime: "20:00", utcOffset: "-05:00", stadium: "NRG Stadium", city: "Houston", state: "Texas", group: "B", matchday: 1 },
  "United States|Bolivia": { matchNumber: 5, date: "2024-06-23", localTime: "18:00", utcOffset: "-05:00", stadium: "AT&T Stadium", city: "Arlington", state: "Texas", group: "C", matchday: 1 },
  "Uruguay|Panama": { matchNumber: 6, date: "2024-06-23", localTime: "21:00", utcOffset: "-04:00", stadium: "Hard Rock Stadium", city: "Miami Gardens", state: "Florida", group: "C", matchday: 1 },
  "Brazil|Costa Rica": { matchNumber: 7, date: "2024-06-24", localTime: "21:00", utcOffset: "-07:00", stadium: "SoFi Stadium", city: "Inglewood", state: "California", group: "D", matchday: 1 },
  "Colombia|Paraguay": { matchNumber: 8, date: "2024-06-24", localTime: "18:00", utcOffset: "-05:00", stadium: "NRG Stadium", city: "Houston", state: "Texas", group: "D", matchday: 1 },
  "Chile|Argentina": { matchNumber: 9, date: "2024-06-25", localTime: "21:00", utcOffset: "-04:00", stadium: "MetLife Stadium", city: "East Rutherford", state: "New Jersey", group: "A", matchday: 2 },
  "Peru|Canada": { matchNumber: 10, date: "2024-06-25", localTime: "17:00", utcOffset: "-05:00", stadium: "Children's Mercy Park", city: "Kansas City", state: "Kansas", group: "A", matchday: 2 },
  "Venezuela|Mexico": { matchNumber: 11, date: "2024-06-26", localTime: "21:00", utcOffset: "-07:00", stadium: "SoFi Stadium", city: "Inglewood", state: "California", group: "B", matchday: 2 },
  "Ecuador|Jamaica": { matchNumber: 12, date: "2024-06-26", localTime: "18:00", utcOffset: "-07:00", stadium: "Allegiant Stadium", city: "Las Vegas", state: "Nevada", group: "B", matchday: 2 },
  "Panama|United States": { matchNumber: 13, date: "2024-06-27", localTime: "18:00", utcOffset: "-04:00", stadium: "Mercedes-Benz Stadium", city: "Atlanta", state: "Georgia", group: "C", matchday: 2 },
  "Uruguay|Bolivia": { matchNumber: 14, date: "2024-06-27", localTime: "21:00", utcOffset: "-04:00", stadium: "MetLife Stadium", city: "East Rutherford", state: "New Jersey", group: "C", matchday: 2 },
  "Colombia|Costa Rica": { matchNumber: 15, date: "2024-06-28", localTime: "18:00", utcOffset: "-07:00", stadium: "State Farm Stadium", city: "Glendale", state: "Arizona", group: "D", matchday: 2 },
  "Paraguay|Brazil": { matchNumber: 16, date: "2024-06-28", localTime: "21:00", utcOffset: "-07:00", stadium: "Allegiant Stadium", city: "Las Vegas", state: "Nevada", group: "D", matchday: 2 },
  "Argentina|Peru": { matchNumber: 17, date: "2024-06-29", localTime: "20:00", utcOffset: "-04:00", stadium: "Hard Rock Stadium", city: "Miami Gardens", state: "Florida", group: "A", matchday: 3 },
  "Canada|Chile": { matchNumber: 18, date: "2024-06-29", localTime: "20:00", utcOffset: "-04:00", stadium: "Inter&Co Stadium", city: "Orlando", state: "Florida", group: "A", matchday: 3 },
  "Mexico|Ecuador": { matchNumber: 19, date: "2024-06-30", localTime: "20:00", utcOffset: "-07:00", stadium: "State Farm Stadium", city: "Glendale", state: "Arizona", group: "B", matchday: 3 },
  "Jamaica|Venezuela": { matchNumber: 20, date: "2024-06-30", localTime: "20:00", utcOffset: "-05:00", stadium: "Q2 Stadium", city: "Austin", state: "Texas", group: "B", matchday: 3 },
  "United States|Uruguay": { matchNumber: 21, date: "2024-07-01", localTime: "21:00", utcOffset: "-05:00", stadium: "GEHA Field at Arrowhead Stadium", city: "Kansas City", state: "Missouri", group: "C", matchday: 3 },
  "Bolivia|Panama": { matchNumber: 22, date: "2024-07-01", localTime: "21:00", utcOffset: "-04:00", stadium: "Inter&Co Stadium", city: "Orlando", state: "Florida", group: "C", matchday: 3 },
  "Brazil|Colombia": { matchNumber: 23, date: "2024-07-02", localTime: "21:00", utcOffset: "-07:00", stadium: "Levi's Stadium", city: "Santa Clara", state: "California", group: "D", matchday: 3 },
  "Costa Rica|Paraguay": { matchNumber: 24, date: "2024-07-02", localTime: "21:00", utcOffset: "-05:00", stadium: "Q2 Stadium", city: "Austin", state: "Texas", group: "D", matchday: 3 },
});

const RETRO_COPA_2024_KNOCKOUT_SCHEDULE = Object.freeze({
  "ko-qf-m1": { matchNumber: 25, date: "2024-07-04", localTime: "20:00", utcOffset: "-05:00", stadium: "NRG Stadium", city: "Houston", state: "Texas", round: "Quarter-finals", pairing: "A1-B2", extraTime: false, directToPenalties: true },
  "ko-qf-m2": { matchNumber: 26, date: "2024-07-05", localTime: "21:00", utcOffset: "-05:00", stadium: "AT&T Stadium", city: "Arlington", state: "Texas", round: "Quarter-finals", pairing: "B1-A2", extraTime: false, directToPenalties: true },
  "ko-qf-m3": { matchNumber: 27, date: "2024-07-06", localTime: "17:00", utcOffset: "-07:00", stadium: "State Farm Stadium", city: "Glendale", state: "Arizona", round: "Quarter-finals", pairing: "C1-D2", extraTime: false, directToPenalties: true },
  "ko-qf-m4": { matchNumber: 28, date: "2024-07-06", localTime: "21:00", utcOffset: "-07:00", stadium: "Allegiant Stadium", city: "Las Vegas", state: "Nevada", round: "Quarter-finals", pairing: "D1-C2", extraTime: false, directToPenalties: true },
  "ko-sf-m1": { matchNumber: 29, date: "2024-07-09", localTime: "20:00", utcOffset: "-04:00", stadium: "MetLife Stadium", city: "East Rutherford", state: "New Jersey", round: "Semi-finals", path: "QF1-QF2", extraTime: false, directToPenalties: true },
  "ko-sf-m2": { matchNumber: 30, date: "2024-07-10", localTime: "20:00", utcOffset: "-04:00", stadium: "Bank of America Stadium", city: "Charlotte", state: "North Carolina", round: "Semi-finals", path: "QF3-QF4", extraTime: false, directToPenalties: true },
  "ko-third-place": { matchNumber: 31, date: "2024-07-13", localTime: "20:00", utcOffset: "-04:00", stadium: "Bank of America Stadium", city: "Charlotte", state: "North Carolina", round: "Third-place match", extraTime: false, directToPenalties: true },
  "ko-final": { matchNumber: 32, date: "2024-07-14", localTime: "20:00", utcOffset: "-04:00", stadium: "Hard Rock Stadium", city: "Miami Gardens", state: "Florida", round: "Final", extraTime: true, directToPenalties: false },
});
