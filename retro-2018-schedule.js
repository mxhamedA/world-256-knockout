// Historical Russia 2018 fixture facts sourced from the existing World Cup match dataset.
const RETRO_2018_GROUP_SCHEDULE = Object.freeze({
  "Russia|Saudi Arabia": {
    "matchNumber": 1,
    "date": "2018-06-14",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "Egypt|Uruguay": {
    "matchNumber": 2,
    "date": "2018-06-15",
    "localTime": "17:00",
    "utcOffset": "+04:00",
    "stadium": "Central Stadium",
    "city": "Yekaterinburg"
  },
  "Morocco|Iran": {
    "matchNumber": 3,
    "date": "2018-06-15",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "Portugal|Spain": {
    "matchNumber": 4,
    "date": "2018-06-15",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "France|Australia": {
    "matchNumber": 5,
    "date": "2018-06-16",
    "localTime": "13:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "Argentina|Iceland": {
    "matchNumber": 6,
    "date": "2018-06-16",
    "localTime": "16:00",
    "utcOffset": "+03:00",
    "stadium": "Otkritie Arena",
    "city": "Moscow"
  },
  "Peru|Denmark": {
    "matchNumber": 7,
    "date": "2018-06-16",
    "localTime": "19:00",
    "utcOffset": "+03:00",
    "stadium": "Mordovia Arena",
    "city": "Saransk"
  },
  "Croatia|Nigeria": {
    "matchNumber": 8,
    "date": "2018-06-16",
    "localTime": "21:00",
    "utcOffset": "+02:00",
    "stadium": "Kaliningrad Stadium",
    "city": "Kaliningrad"
  },
  "Costa Rica|Serbia": {
    "matchNumber": 9,
    "date": "2018-06-17",
    "localTime": "16:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "Germany|Mexico": {
    "matchNumber": 10,
    "date": "2018-06-17",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "Brazil|Switzerland": {
    "matchNumber": 11,
    "date": "2018-06-17",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Rostov Arena",
    "city": "Rostov-on-Don"
  },
  "Sweden|South Korea": {
    "matchNumber": 12,
    "date": "2018-06-18",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "Belgium|Panama": {
    "matchNumber": 13,
    "date": "2018-06-18",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "Tunisia|England": {
    "matchNumber": 14,
    "date": "2018-06-18",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Volgograd Arena",
    "city": "Volgograd"
  },
  "Colombia|Japan": {
    "matchNumber": 15,
    "date": "2018-06-19",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Mordovia Arena",
    "city": "Saransk"
  },
  "Poland|Senegal": {
    "matchNumber": 16,
    "date": "2018-06-19",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Otkritie Arena",
    "city": "Moscow"
  },
  "Russia|Egypt": {
    "matchNumber": 17,
    "date": "2018-06-19",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "Portugal|Morocco": {
    "matchNumber": 18,
    "date": "2018-06-20",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "Uruguay|Saudi Arabia": {
    "matchNumber": 19,
    "date": "2018-06-20",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Rostov Arena",
    "city": "Rostov-on-Don"
  },
  "Iran|Spain": {
    "matchNumber": 20,
    "date": "2018-06-20",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "Denmark|Australia": {
    "matchNumber": 21,
    "date": "2018-06-21",
    "localTime": "16:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "France|Peru": {
    "matchNumber": 22,
    "date": "2018-06-21",
    "localTime": "20:00",
    "utcOffset": "+04:00",
    "stadium": "Central Stadium",
    "city": "Yekaterinburg"
  },
  "Argentina|Croatia": {
    "matchNumber": 23,
    "date": "2018-06-21",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "Brazil|Costa Rica": {
    "matchNumber": 24,
    "date": "2018-06-22",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "Nigeria|Iceland": {
    "matchNumber": 25,
    "date": "2018-06-22",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Volgograd Arena",
    "city": "Volgograd"
  },
  "Serbia|Switzerland": {
    "matchNumber": 26,
    "date": "2018-06-22",
    "localTime": "20:00",
    "utcOffset": "+02:00",
    "stadium": "Kaliningrad Stadium",
    "city": "Kaliningrad"
  },
  "Belgium|Tunisia": {
    "matchNumber": 27,
    "date": "2018-06-23",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Otkritie Arena",
    "city": "Moscow"
  },
  "South Korea|Mexico": {
    "matchNumber": 28,
    "date": "2018-06-23",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Rostov Arena",
    "city": "Rostov-on-Don"
  },
  "Germany|Sweden": {
    "matchNumber": 29,
    "date": "2018-06-23",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "England|Panama": {
    "matchNumber": 30,
    "date": "2018-06-24",
    "localTime": "15:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "Japan|Senegal": {
    "matchNumber": 31,
    "date": "2018-06-24",
    "localTime": "20:00",
    "utcOffset": "+04:00",
    "stadium": "Central Stadium",
    "city": "Yekaterinburg"
  },
  "Poland|Colombia": {
    "matchNumber": 32,
    "date": "2018-06-24",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "Saudi Arabia|Egypt": {
    "matchNumber": 33,
    "date": "2018-06-25",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Volgograd Arena",
    "city": "Volgograd"
  },
  "Uruguay|Russia": {
    "matchNumber": 34,
    "date": "2018-06-25",
    "localTime": "18:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "Spain|Morocco": {
    "matchNumber": 35,
    "date": "2018-06-25",
    "localTime": "20:00",
    "utcOffset": "+02:00",
    "stadium": "Kaliningrad Stadium",
    "city": "Kaliningrad"
  },
  "Iran|Portugal": {
    "matchNumber": 36,
    "date": "2018-06-25",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Mordovia Arena",
    "city": "Saransk"
  },
  "Australia|Peru": {
    "matchNumber": 37,
    "date": "2018-06-26",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "Denmark|France": {
    "matchNumber": 38,
    "date": "2018-06-26",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "Iceland|Croatia": {
    "matchNumber": 39,
    "date": "2018-06-26",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Rostov Arena",
    "city": "Rostov-on-Don"
  },
  "Nigeria|Argentina": {
    "matchNumber": 40,
    "date": "2018-06-26",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "South Korea|Germany": {
    "matchNumber": 41,
    "date": "2018-06-27",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "Mexico|Sweden": {
    "matchNumber": 42,
    "date": "2018-06-27",
    "localTime": "19:00",
    "utcOffset": "+04:00",
    "stadium": "Central Stadium",
    "city": "Yekaterinburg"
  },
  "Serbia|Brazil": {
    "matchNumber": 43,
    "date": "2018-06-27",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Otkritie Arena",
    "city": "Moscow"
  },
  "Switzerland|Costa Rica": {
    "matchNumber": 44,
    "date": "2018-06-27",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "Japan|Poland": {
    "matchNumber": 45,
    "date": "2018-06-28",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Volgograd Arena",
    "city": "Volgograd"
  },
  "Senegal|Colombia": {
    "matchNumber": 46,
    "date": "2018-06-28",
    "localTime": "18:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "England|Belgium": {
    "matchNumber": 47,
    "date": "2018-06-28",
    "localTime": "20:00",
    "utcOffset": "+02:00",
    "stadium": "Kaliningrad Stadium",
    "city": "Kaliningrad"
  },
  "Panama|Tunisia": {
    "matchNumber": 48,
    "date": "2018-06-28",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Mordovia Arena",
    "city": "Saransk"
  }
});

const RETRO_2018_KNOCKOUT_SCHEDULE = Object.freeze({
  "ko-r16-m1": {
    "matchNumber": 49,
    "date": "2018-06-30",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "ko-r16-m2": {
    "matchNumber": 50,
    "date": "2018-06-30",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "ko-r16-m5": {
    "matchNumber": 51,
    "date": "2018-07-01",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "ko-r16-m6": {
    "matchNumber": 52,
    "date": "2018-07-01",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "ko-r16-m3": {
    "matchNumber": 53,
    "date": "2018-07-02",
    "localTime": "18:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "ko-r16-m4": {
    "matchNumber": 54,
    "date": "2018-07-02",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Rostov Arena",
    "city": "Rostov-on-Don"
  },
  "ko-r16-m7": {
    "matchNumber": 55,
    "date": "2018-07-03",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "ko-r16-m8": {
    "matchNumber": 56,
    "date": "2018-07-03",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Otkritie Arena",
    "city": "Moscow"
  },
  "ko-r2-m1": {
    "matchNumber": 57,
    "date": "2018-07-06",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Nizhny Novgorod Stadium",
    "city": "Nizhny Novgorod"
  },
  "ko-r2-m2": {
    "matchNumber": 58,
    "date": "2018-07-06",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Kazan Arena",
    "city": "Kazan"
  },
  "ko-r2-m3": {
    "matchNumber": 59,
    "date": "2018-07-07",
    "localTime": "18:00",
    "utcOffset": "+04:00",
    "stadium": "Samara Arena",
    "city": "Samara"
  },
  "ko-r2-m4": {
    "matchNumber": 60,
    "date": "2018-07-07",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Fisht Olympic Stadium",
    "city": "Sochi"
  },
  "ko-r3-m1": {
    "matchNumber": 61,
    "date": "2018-07-10",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "ko-r3-m2": {
    "matchNumber": 62,
    "date": "2018-07-11",
    "localTime": "21:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  },
  "ko-third-place": {
    "matchNumber": 63,
    "date": "2018-07-14",
    "localTime": "17:00",
    "utcOffset": "+03:00",
    "stadium": "Krestovsky Stadium",
    "city": "Saint Petersburg"
  },
  "ko-final": {
    "matchNumber": 64,
    "date": "2018-07-15",
    "localTime": "18:00",
    "utcOffset": "+03:00",
    "stadium": "Luzhniki Stadium",
    "city": "Moscow"
  }
});
