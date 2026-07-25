// Historical fixture facts cross-checked against The FA schedule and OpenFootball's public-domain data.
const RETRO_2014_GROUP_SCHEDULE = Object.freeze({
  "Brazil|Croatia": {
    "matchNumber": 1,
    "date": "2014-06-12",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  },
  "Mexico|Cameroon": {
    "matchNumber": 2,
    "date": "2014-06-13",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena das Dunas",
    "city": "Natal"
  },
  "Spain|Netherlands": {
    "matchNumber": 3,
    "date": "2014-06-13",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "Chile|Australia": {
    "matchNumber": 4,
    "date": "2014-06-13",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena Pantanal",
    "city": "Cuiabá"
  },
  "Colombia|Greece": {
    "matchNumber": 5,
    "date": "2014-06-14",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "Uruguay|Costa Rica": {
    "matchNumber": 6,
    "date": "2014-06-14",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "England|Italy": {
    "matchNumber": 7,
    "date": "2014-06-14",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena da Amazônia",
    "city": "Manaus"
  },
  "Ivory Coast|Japan": {
    "matchNumber": 8,
    "date": "2014-06-14",
    "localTime": "22:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Pernambuco",
    "city": "Recife"
  },
  "Switzerland|Ecuador": {
    "matchNumber": 9,
    "date": "2014-06-15",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "France|Honduras": {
    "matchNumber": 10,
    "date": "2014-06-15",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Beira-Rio",
    "city": "Porto Alegre"
  },
  "Argentina|Bosnia and Herzegovina": {
    "matchNumber": 11,
    "date": "2014-06-15",
    "localTime": "19:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "Germany|Portugal": {
    "matchNumber": 12,
    "date": "2014-06-16",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "Iran|Nigeria": {
    "matchNumber": 13,
    "date": "2014-06-16",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Arena da Baixada",
    "city": "Curitiba"
  },
  "Ghana|USA": {
    "matchNumber": 14,
    "date": "2014-06-16",
    "localTime": "19:00",
    "utcOffset": "-03:00",
    "stadium": "Arena das Dunas",
    "city": "Natal"
  },
  "Belgium|Algeria": {
    "matchNumber": 15,
    "date": "2014-06-17",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "Brazil|Mexico": {
    "matchNumber": 16,
    "date": "2014-06-17",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "Russia|South Korea": {
    "matchNumber": 17,
    "date": "2014-06-17",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena Pantanal",
    "city": "Cuiabá"
  },
  "Australia|Netherlands": {
    "matchNumber": 18,
    "date": "2014-06-18",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Beira-Rio",
    "city": "Porto Alegre"
  },
  "Spain|Chile": {
    "matchNumber": 19,
    "date": "2014-06-18",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "Cameroon|Croatia": {
    "matchNumber": 20,
    "date": "2014-06-18",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena da Amazônia",
    "city": "Manaus"
  },
  "Colombia|Ivory Coast": {
    "matchNumber": 21,
    "date": "2014-06-19",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "Uruguay|England": {
    "matchNumber": 22,
    "date": "2014-06-19",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  },
  "Japan|Greece": {
    "matchNumber": 23,
    "date": "2014-06-19",
    "localTime": "19:00",
    "utcOffset": "-03:00",
    "stadium": "Arena das Dunas",
    "city": "Natal"
  },
  "Italy|Costa Rica": {
    "matchNumber": 24,
    "date": "2014-06-20",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Pernambuco",
    "city": "Recife"
  },
  "Switzerland|France": {
    "matchNumber": 25,
    "date": "2014-06-20",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "Honduras|Ecuador": {
    "matchNumber": 26,
    "date": "2014-06-20",
    "localTime": "19:00",
    "utcOffset": "-03:00",
    "stadium": "Arena da Baixada",
    "city": "Curitiba"
  },
  "Argentina|Iran": {
    "matchNumber": 27,
    "date": "2014-06-21",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "Germany|Ghana": {
    "matchNumber": 28,
    "date": "2014-06-21",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "Nigeria|Bosnia and Herzegovina": {
    "matchNumber": 29,
    "date": "2014-06-21",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena Pantanal",
    "city": "Cuiabá"
  },
  "Belgium|Russia": {
    "matchNumber": 30,
    "date": "2014-06-22",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "South Korea|Algeria": {
    "matchNumber": 31,
    "date": "2014-06-22",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Beira-Rio",
    "city": "Porto Alegre"
  },
  "USA|Portugal": {
    "matchNumber": 32,
    "date": "2014-06-22",
    "localTime": "18:00",
    "utcOffset": "-04:00",
    "stadium": "Arena da Amazônia",
    "city": "Manaus"
  },
  "Australia|Spain": {
    "matchNumber": 33,
    "date": "2014-06-23",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena da Baixada",
    "city": "Curitiba"
  },
  "Netherlands|Chile": {
    "matchNumber": 34,
    "date": "2014-06-23",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  },
  "Cameroon|Brazil": {
    "matchNumber": 35,
    "date": "2014-06-23",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "Croatia|Mexico": {
    "matchNumber": 36,
    "date": "2014-06-23",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Pernambuco",
    "city": "Recife"
  },
  "Costa Rica|England": {
    "matchNumber": 37,
    "date": "2014-06-24",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "Italy|Uruguay": {
    "matchNumber": 38,
    "date": "2014-06-24",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena das Dunas",
    "city": "Natal"
  },
  "Japan|Colombia": {
    "matchNumber": 39,
    "date": "2014-06-24",
    "localTime": "16:00",
    "utcOffset": "-04:00",
    "stadium": "Arena Pantanal",
    "city": "Cuiabá"
  },
  "Greece|Ivory Coast": {
    "matchNumber": 40,
    "date": "2014-06-24",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "Bosnia and Herzegovina|Iran": {
    "matchNumber": 41,
    "date": "2014-06-25",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "Nigeria|Argentina": {
    "matchNumber": 42,
    "date": "2014-06-25",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Beira-Rio",
    "city": "Porto Alegre"
  },
  "Honduras|Switzerland": {
    "matchNumber": 43,
    "date": "2014-06-25",
    "localTime": "16:00",
    "utcOffset": "-04:00",
    "stadium": "Arena da Amazônia",
    "city": "Manaus"
  },
  "Ecuador|France": {
    "matchNumber": 44,
    "date": "2014-06-25",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "Portugal|Ghana": {
    "matchNumber": 45,
    "date": "2014-06-26",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "USA|Germany": {
    "matchNumber": 46,
    "date": "2014-06-26",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Pernambuco",
    "city": "Recife"
  },
  "Algeria|Russia": {
    "matchNumber": 47,
    "date": "2014-06-26",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena da Baixada",
    "city": "Curitiba"
  },
  "South Korea|Belgium": {
    "matchNumber": 48,
    "date": "2014-06-26",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  }
});

const RETRO_2014_KNOCKOUT_SCHEDULE = Object.freeze({
  "ko-r16-m1": {
    "matchNumber": 49,
    "date": "2014-06-28",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "ko-r16-m2": {
    "matchNumber": 50,
    "date": "2014-06-28",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "ko-r16-m5": {
    "matchNumber": 51,
    "date": "2014-06-29",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "ko-r16-m6": {
    "matchNumber": 52,
    "date": "2014-06-29",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Pernambuco",
    "city": "Recife"
  },
  "ko-r16-m3": {
    "matchNumber": 53,
    "date": "2014-06-30",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "ko-r16-m4": {
    "matchNumber": 54,
    "date": "2014-06-30",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Beira-Rio",
    "city": "Porto Alegre"
  },
  "ko-r16-m7": {
    "matchNumber": 55,
    "date": "2014-07-01",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  },
  "ko-r16-m8": {
    "matchNumber": 56,
    "date": "2014-07-01",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "ko-r2-m2": {
    "matchNumber": 57,
    "date": "2014-07-04",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  },
  "ko-r2-m1": {
    "matchNumber": 58,
    "date": "2014-07-04",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Castelão",
    "city": "Fortaleza"
  },
  "ko-r2-m4": {
    "matchNumber": 59,
    "date": "2014-07-05",
    "localTime": "13:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "ko-r2-m3": {
    "matchNumber": 60,
    "date": "2014-07-05",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Fonte Nova",
    "city": "Salvador"
  },
  "ko-r3-m1": {
    "matchNumber": 61,
    "date": "2014-07-08",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Mineirão",
    "city": "Belo Horizonte"
  },
  "ko-r3-m2": {
    "matchNumber": 62,
    "date": "2014-07-09",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Arena Corinthians",
    "city": "São Paulo"
  },
  "ko-third-place": {
    "matchNumber": 63,
    "date": "2014-07-12",
    "localTime": "17:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio Nacional",
    "city": "Brasília"
  },
  "ko-final": {
    "matchNumber": 64,
    "date": "2014-07-13",
    "localTime": "16:00",
    "utcOffset": "-03:00",
    "stadium": "Estádio do Maracanã",
    "city": "Rio de Janeiro"
  }
});
