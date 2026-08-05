// Historical Qatar 2022 fixture facts sourced from the World Cup match dataset.
const RETRO_2022_GROUP_SCHEDULE = Object.freeze({
  "Qatar|Ecuador": {
    "matchNumber": 1,
    "date": "2022-11-20",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "England|Iran": {
    "matchNumber": 2,
    "date": "2022-11-21",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "Senegal|Netherlands": {
    "matchNumber": 3,
    "date": "2022-11-21",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "USA|Wales": {
    "matchNumber": 4,
    "date": "2022-11-21",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Argentina|Saudi Arabia": {
    "matchNumber": 5,
    "date": "2022-11-22",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Denmark|Tunisia": {
    "matchNumber": 6,
    "date": "2022-11-22",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "Mexico|Poland": {
    "matchNumber": 7,
    "date": "2022-11-22",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "France|Australia": {
    "matchNumber": 8,
    "date": "2022-11-22",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "Morocco|Croatia": {
    "matchNumber": 9,
    "date": "2022-11-23",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "Germany|Japan": {
    "matchNumber": 10,
    "date": "2022-11-23",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "Spain|Costa Rica": {
    "matchNumber": 11,
    "date": "2022-11-23",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "Belgium|Canada": {
    "matchNumber": 12,
    "date": "2022-11-23",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Switzerland|Cameroon": {
    "matchNumber": 13,
    "date": "2022-11-24",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "Uruguay|South Korea": {
    "matchNumber": 14,
    "date": "2022-11-24",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "Portugal|Ghana": {
    "matchNumber": 15,
    "date": "2022-11-24",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "Brazil|Serbia": {
    "matchNumber": 16,
    "date": "2022-11-24",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Wales|Iran": {
    "matchNumber": 17,
    "date": "2022-11-25",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Qatar|Senegal": {
    "matchNumber": 18,
    "date": "2022-11-25",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "Netherlands|Ecuador": {
    "matchNumber": 19,
    "date": "2022-11-25",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "England|USA": {
    "matchNumber": 20,
    "date": "2022-11-25",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "Tunisia|Australia": {
    "matchNumber": 21,
    "date": "2022-11-26",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "Poland|Saudi Arabia": {
    "matchNumber": 22,
    "date": "2022-11-26",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "France|Denmark": {
    "matchNumber": 23,
    "date": "2022-11-26",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "Argentina|Mexico": {
    "matchNumber": 24,
    "date": "2022-11-26",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Japan|Costa Rica": {
    "matchNumber": 25,
    "date": "2022-11-27",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Belgium|Morocco": {
    "matchNumber": 26,
    "date": "2022-11-27",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "Croatia|Canada": {
    "matchNumber": 27,
    "date": "2022-11-27",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "Spain|Germany": {
    "matchNumber": 28,
    "date": "2022-11-27",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "Cameroon|Serbia": {
    "matchNumber": 29,
    "date": "2022-11-28",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "South Korea|Ghana": {
    "matchNumber": 30,
    "date": "2022-11-28",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "Brazil|Switzerland": {
    "matchNumber": 31,
    "date": "2022-11-28",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "Portugal|Uruguay": {
    "matchNumber": 32,
    "date": "2022-11-28",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Ecuador|Senegal": {
    "matchNumber": 33,
    "date": "2022-11-29",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "Netherlands|Qatar": {
    "matchNumber": 34,
    "date": "2022-11-29",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "Iran|USA": {
    "matchNumber": 35,
    "date": "2022-11-29",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "Wales|England": {
    "matchNumber": 36,
    "date": "2022-11-29",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Australia|Denmark": {
    "matchNumber": 37,
    "date": "2022-11-30",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "Tunisia|France": {
    "matchNumber": 38,
    "date": "2022-11-30",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "Poland|Argentina": {
    "matchNumber": 39,
    "date": "2022-11-30",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "Saudi Arabia|Mexico": {
    "matchNumber": 40,
    "date": "2022-11-30",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Canada|Morocco": {
    "matchNumber": 41,
    "date": "2022-12-01",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "Croatia|Belgium": {
    "matchNumber": 42,
    "date": "2022-12-01",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "Costa Rica|Germany": {
    "matchNumber": 43,
    "date": "2022-12-01",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "Japan|Spain": {
    "matchNumber": 44,
    "date": "2022-12-01",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "Ghana|Uruguay": {
    "matchNumber": 45,
    "date": "2022-12-02",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "South Korea|Portugal": {
    "matchNumber": 46,
    "date": "2022-12-02",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "Cameroon|Brazil": {
    "matchNumber": 47,
    "date": "2022-12-02",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "Serbia|Switzerland": {
    "matchNumber": 48,
    "date": "2022-12-02",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  }
});

const RETRO_2022_KNOCKOUT_SCHEDULE = Object.freeze({
  "ko-r16-m1": {
    "matchNumber": 49,
    "date": "2022-12-03",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "ko-r16-m2": {
    "matchNumber": 50,
    "date": "2022-12-03",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Ahmad bin Ali Stadium",
    "city": "Al Rayyan"
  },
  "ko-r16-m5": {
    "matchNumber": 51,
    "date": "2022-12-04",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "ko-r16-m6": {
    "matchNumber": 52,
    "date": "2022-12-04",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "ko-r16-m3": {
    "matchNumber": 53,
    "date": "2022-12-05",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Janoub Stadium",
    "city": "Al Wakrah"
  },
  "ko-r16-m4": {
    "matchNumber": 54,
    "date": "2022-12-05",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Stadium 974",
    "city": "Doha"
  },
  "ko-r16-m7": {
    "matchNumber": 55,
    "date": "2022-12-06",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "ko-r16-m8": {
    "matchNumber": 56,
    "date": "2022-12-06",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "ko-r2-m1": {
    "matchNumber": 57,
    "date": "2022-12-09",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Education City Stadium",
    "city": "Al Rayyan"
  },
  "ko-r2-m2": {
    "matchNumber": 58,
    "date": "2022-12-09",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "ko-r2-m3": {
    "matchNumber": 59,
    "date": "2022-12-10",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Al Thumama Stadium",
    "city": "Doha"
  },
  "ko-r2-m4": {
    "matchNumber": 60,
    "date": "2022-12-10",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "ko-r3-m1": {
    "matchNumber": 61,
    "date": "2022-12-13",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  },
  "ko-r3-m2": {
    "matchNumber": 62,
    "date": "2022-12-14",
    "localTime": "22:00",
    "utcOffset": "+03:00",
    "stadium": "Al Bayt Stadium",
    "city": "Al Khor"
  },
  "ko-third-place": {
    "matchNumber": 63,
    "date": "2022-12-17",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Khalifa International Stadium",
    "city": "Al Rayyan"
  },
  "ko-final": {
    "matchNumber": 64,
    "date": "2022-12-18",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Lusail Stadium",
    "city": "Lusail"
  }
});
