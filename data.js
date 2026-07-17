const TEAM_SOURCE = `
Albania|AL|UEFA
Andorra|AD|UEFA
Armenia|AM|UEFA
Austria|AT|UEFA
Azerbaijan|AZ|UEFA
Belarus|BY|UEFA
Belgium|BE|UEFA
Bosnia and Herzegovina|BA|UEFA
Bulgaria|BG|UEFA
Croatia|HR|UEFA
Cyprus|CY|UEFA
Czechia|CZ|UEFA
Denmark|DK|UEFA
England|GB-ENG|UEFA
Estonia|EE|UEFA
Faroe Islands|FO|UEFA
Finland|FI|UEFA
France|FR|UEFA
Georgia|GE|UEFA
Germany|DE|UEFA
Gibraltar|GI|UEFA
Greece|GR|UEFA
Hungary|HU|UEFA
Iceland|IS|UEFA
Israel|IL|UEFA
Italy|IT|UEFA
Kazakhstan|KZ|UEFA
Kosovo|XK|UEFA
Latvia|LV|UEFA
Liechtenstein|LI|UEFA
Lithuania|LT|UEFA
Luxembourg|LU|UEFA
Malta|MT|UEFA
Moldova|MD|UEFA
Montenegro|ME|UEFA
Netherlands|NL|UEFA
North Macedonia|MK|UEFA
Northern Ireland|GB-NIR|UEFA
Norway|NO|UEFA
Poland|PL|UEFA
Portugal|PT|UEFA
Republic of Ireland|IE|UEFA
Romania|RO|UEFA
Russia|RU|UEFA
San Marino|SM|UEFA
Scotland|GB-SCT|UEFA
Serbia|RS|UEFA
Slovakia|SK|UEFA
Slovenia|SI|UEFA
Spain|ES|UEFA
Sweden|SE|UEFA
Switzerland|CH|UEFA
Türkiye|TR|UEFA
Ukraine|UA|UEFA
Wales|GB-WLS|UEFA
Argentina|AR|CONMEBOL
Bolivia|BO|CONMEBOL
Brazil|BR|CONMEBOL
Chile|CL|CONMEBOL
Colombia|CO|CONMEBOL
Ecuador|EC|CONMEBOL
Paraguay|PY|CONMEBOL
Peru|PE|CONMEBOL
Uruguay|UY|CONMEBOL
Venezuela|VE|CONMEBOL
Anguilla|AI|CONCACAF
Antigua and Barbuda|AG|CONCACAF
Aruba|AW|CONCACAF
Bahamas|BS|CONCACAF
Barbados|BB|CONCACAF
Belize|BZ|CONCACAF
Bermuda|BM|CONCACAF
British Virgin Islands|VG|CONCACAF
Canada|CA|CONCACAF
Cayman Islands|KY|CONCACAF
Costa Rica|CR|CONCACAF
Cuba|CU|CONCACAF
Curaçao|CW|CONCACAF
Dominica|DM|CONCACAF
Dominican Republic|DO|CONCACAF
El Salvador|SV|CONCACAF
Grenada|GD|CONCACAF
Guatemala|GT|CONCACAF
Guyana|GY|CONCACAF
Haiti|HT|CONCACAF
Honduras|HN|CONCACAF
Jamaica|JM|CONCACAF
Mexico|MX|CONCACAF
Montserrat|MS|CONCACAF
Nicaragua|NI|CONCACAF
Panama|PA|CONCACAF
Puerto Rico|PR|CONCACAF
Saint Kitts and Nevis|KN|CONCACAF
Saint Lucia|LC|CONCACAF
Saint Vincent and the Grenadines|VC|CONCACAF
Suriname|SR|CONCACAF
Trinidad and Tobago|TT|CONCACAF
Turks and Caicos Islands|TC|CONCACAF
US Virgin Islands|VI|CONCACAF
USA|US|CONCACAF
Afghanistan|AF|AFC
Australia|AU|AFC
Bahrain|BH|AFC
Bangladesh|BD|AFC
Bhutan|BT|AFC
Brunei|BN|AFC
Cambodia|KH|AFC
China|CN|AFC
Chinese Taipei|TW|AFC
Guam|GU|AFC
Hong Kong|HK|AFC
India|IN|AFC
Indonesia|ID|AFC
Iran|IR|AFC
Iraq|IQ|AFC
Japan|JP|AFC
Jordan|JO|AFC
Kuwait|KW|AFC
Kyrgyzstan|KG|AFC
Laos|LA|AFC
Lebanon|LB|AFC
Macau|MO|AFC
Malaysia|MY|AFC
Maldives|MV|AFC
Mongolia|MN|AFC
Myanmar|MM|AFC
Nepal|NP|AFC
North Korea|KP|AFC
Oman|OM|AFC
Pakistan|PK|AFC
Palestine|PS|AFC
Philippines|PH|AFC
Qatar|QA|AFC
Saudi Arabia|SA|AFC
Singapore|SG|AFC
South Korea|KR|AFC
Sri Lanka|LK|AFC
Syria|SY|AFC
Tajikistan|TJ|AFC
Thailand|TH|AFC
Timor-Leste|TL|AFC
Turkmenistan|TM|AFC
United Arab Emirates|AE|AFC
Uzbekistan|UZ|AFC
Vietnam|VN|AFC
Yemen|YE|AFC
Algeria|DZ|CAF
Angola|AO|CAF
Benin|BJ|CAF
Botswana|BW|CAF
Burkina Faso|BF|CAF
Burundi|BI|CAF
Cameroon|CM|CAF
Cape Verde|CV|CAF
Central African Republic|CF|CAF
Chad|TD|CAF
Comoros|KM|CAF
Congo|CG|CAF
DR Congo|CD|CAF
Djibouti|DJ|CAF
Egypt|EG|CAF
Equatorial Guinea|GQ|CAF
Eritrea|ER|CAF
Eswatini|SZ|CAF
Ethiopia|ET|CAF
Gabon|GA|CAF
Gambia|GM|CAF
Ghana|GH|CAF
Guinea|GN|CAF
Guinea-Bissau|GW|CAF
Ivory Coast|CI|CAF
Kenya|KE|CAF
Lesotho|LS|CAF
Liberia|LR|CAF
Libya|LY|CAF
Madagascar|MG|CAF
Malawi|MW|CAF
Mali|ML|CAF
Mauritania|MR|CAF
Mauritius|MU|CAF
Morocco|MA|CAF
Mozambique|MZ|CAF
Namibia|NA|CAF
Niger|NE|CAF
Nigeria|NG|CAF
Rwanda|RW|CAF
São Tomé and Príncipe|ST|CAF
Senegal|SN|CAF
Seychelles|SC|CAF
Sierra Leone|SL|CAF
Somalia|SO|CAF
South Africa|ZA|CAF
South Sudan|SS|CAF
Sudan|SD|CAF
Tanzania|TZ|CAF
Togo|TG|CAF
Tunisia|TN|CAF
Uganda|UG|CAF
Zambia|ZM|CAF
Zimbabwe|ZW|CAF
American Samoa|AS|OFC
Cook Islands|CK|OFC
Fiji|FJ|OFC
New Caledonia|NC|OFC
New Zealand|NZ|OFC
Papua New Guinea|PG|OFC
Samoa|WS|OFC
Solomon Islands|SB|OFC
Tahiti|PF|OFC
Tonga|TO|OFC
Vanuatu|VU|OFC
Vatican City|VA|INVITED
Monaco|MC|INVITED
Greenland|GL|INVITED
Northern Mariana Islands|MP|INVITED
Tuvalu|TV|INVITED
Kiribati|KI|INVITED
Micronesia|FM|INVITED
Palau|PW|INVITED
Marshall Islands|MH|INVITED
Nauru|NR|INVITED
Zanzibar|TZ|INVITED
Réunion|RE|INVITED
Mayotte|YT|INVITED
Saint Barthélemy|BL|INVITED
Saint Martin|MF|INVITED
Sint Maarten|SX|INVITED
Guadeloupe|GP|INVITED
Martinique|MQ|INVITED
French Guiana|GF|INVITED
Bonaire|BQ|INVITED
Saba|BQ|INVITED
Sint Eustatius|BQ|INVITED
Saint Pierre and Miquelon|PM|INVITED
Falkland Islands|FK|INVITED
Isle of Man|IM|INVITED
Jersey|JE|INVITED
Guernsey|GG|INVITED
Åland Islands|AX|INVITED
Sealand|XX|INVITED
Sápmi|XX|INVITED
Abkhazia|XX|INVITED
South Ossetia|XX|INVITED
Artsakh|XX|INVITED
Transnistria|MD|INVITED
Somaliland|SO|INVITED
Western Sahara|EH|INVITED
Chagos Islands|IO|INVITED
Christmas Island|CX|INVITED
Cocos Islands|CC|INVITED
Norfolk Island|NF|INVITED
Pitcairn Islands|PN|INVITED
Niue|NU|INVITED
Tokelau|TK|INVITED
Wallis and Futuna|WF|INVITED
Easter Island|CL|INVITED
`.trim();

// FIFA live ranking captured 17 July 2026. Points become a visible 35-100 rating,
// preserving the real gaps between elite, mid-table and developing sides.
const FIFA_RANKING_SOURCE = `
Argentina|1970.37
Spain|1965.61
France|1948.97
England|1889.42
Brazil|1804.92
Morocco|1803.99
Portugal|1787.85
Belgium|1778.36
Netherlands|1775.54
Mexico|1754.3
Colombia|1739.89
Germany|1726.22
Croatia|1723.05
Switzerland|1710.88
Italy|1704.73
USA|1690.33
Japan|1673.68
Senegal|1653.43
Norway|1651.29
Uruguay|1634.7
Denmark|1619.47
Iran|1609.85
Austria|1598.82
Egypt|1597.04
Ecuador|1592.59
Nigeria|1585.02
Türkiye|1582.54
Australia|1581.51
Algeria|1576.8
Canada|1571.34
Ivory Coast|1565.47
South Korea|1558.72
Ukraine|1549.29
Paraguay|1542.48
Russia|1529.6
Poland|1526.18
Sweden|1525.58
Wales|1516.95
Hungary|1506.39
Serbia|1502.13
DR Congo|1495.48
Scotland|1491.22
Cameroon|1481.24
Panama|1478.41
Slovakia|1473.66
Greece|1473.19
Venezuela|1469.18
Czechia|1467.26
Chile|1458.2
Peru|1457.69
Costa Rica|1456.03
Romania|1455.89
Mali|1455.59
South Africa|1451.24
Republic of Ireland|1441.1
Slovenia|1441.09
Tunisia|1426.58
Saudi Arabia|1425.52
Qatar|1411.06
Uzbekistan|1409.73
Bosnia and Herzegovina|1408.93
Burkina Faso|1406.99
Iraq|1404.17
Cape Verde|1402.97
Ghana|1387
Honduras|1378.97
Albania|1376.03
United Arab Emirates|1370.47
North Macedonia|1369.16
Northern Ireland|1365.3
Jamaica|1357.84
Georgia|1355.26
Jordan|1350.41
Iceland|1342.77
Finland|1341.92
Israel|1333.9
Bolivia|1326
Kosovo|1319.12
Oman|1306.9
Montenegro|1301.98
Guinea|1295.6
Curaçao|1285.64
Syria|1283.05
Gabon|1272.51
Bulgaria|1271.68
New Zealand|1269.8
Angola|1265.58
Haiti|1264.58
Uganda|1264.09
Zambia|1255.82
China|1254.81
Bahrain|1254.41
Benin|1252.17
Thailand|1250.8
Palestine|1243.71
Belarus|1242.88
Guatemala|1238.74
Luxembourg|1232.82
Vietnam|1225.68
El Salvador|1225.34
Tajikistan|1224.19
Trinidad and Tobago|1219.59
Mozambique|1218.62
Madagascar|1202.69
Equatorial Guinea|1195.2
Kyrgyzstan|1192.16
Armenia|1189.63
Comoros|1187.91
Kenya|1185.08
Libya|1182.08
Kazakhstan|1180.78
Tanzania|1180.27
Mauritania|1176.68
Niger|1175.33
Lebanon|1172.22
Gambia|1159.64
Sudan|1157.22
Indonesia|1157.14
Togo|1152.76
North Korea|1151.05
Namibia|1148.84
Sierra Leone|1147.56
Faroe Islands|1136.59
Cyprus|1133.25
Suriname|1132.43
Azerbaijan|1132
Estonia|1130.64
Rwanda|1126.62
Malawi|1122.05
Zimbabwe|1119.78
Nicaragua|1114.63
Guinea-Bissau|1108.38
Kuwait|1106.47
Congo|1105.96
Philippines|1100.95
Malaysia|1086.22
Latvia|1085.66
India|1084.93
Central African Republic|1080.82
Liberia|1080.44
Turkmenistan|1078.65
Burundi|1078.01
Ethiopia|1077.52
Dominican Republic|1076.5
Yemen|1065.24
Lesotho|1064.29
Botswana|1063.63
Singapore|1057.95
Lithuania|1056.85
Guyana|1049.32
New Caledonia|1036.95
Saint Kitts and Nevis|1036.33
Solomon Islands|1031.89
Puerto Rico|1024.3
Fiji|1024.17
Hong Kong|1024.16
Tahiti|1019.04
Myanmar|1010.91
Moldova|1008.24
Vanuatu|1002.53
Malta|992.79
Antigua and Barbuda|986.58
Grenada|981.82
Cuba|981.42
Eswatini|979.01
Saint Lucia|976.71
Bermuda|975.05
Papua New Guinea|974.9
South Sudan|970.94
Saint Vincent and the Grenadines|968.27
Afghanistan|968.07
Andorra|946.43
Maldives|943.92
Chinese Taipei|923.78
Cambodia|922.32
Montserrat|916.75
Nepal|914.54
Mauritius|911.49
Barbados|909.89
Belize|907
Bangladesh|902.93
Dominica|897.69
Chad|896.85
Eritrea|887.06
Laos|885.03
Cook Islands|877.53
Sri Lanka|876.86
Samoa|876.41
Aruba|875.61
Mongolia|874.47
American Samoa|871.61
Bhutan|870.81
Macau|858.03
Brunei|857.73
São Tomé and Príncipe|855.44
Djibouti|853.58
Cayman Islands|850.06
Pakistan|840.28
Somalia|839.17
Tonga|835.64
Timor-Leste|831
Gibraltar|820.26
Guam|819.54
Seychelles|804.16
Turks and Caicos Islands|803.98
Liechtenstein|797.7
Bahamas|786.82
US Virgin Islands|779.76
British Virgin Islands|777.41
Anguilla|760.25
San Marino|721.2
`.trim();

const FIFA_RANKINGS = new Map(FIFA_RANKING_SOURCE.split("\n").map((line, index) => {
  const [name, points] = line.split("|");
  return [name, { rank: index + 1, points: Number(points) }];
}));

const FIFA_MAX_POINTS = 1970.37;
const FIFA_MIN_POINTS = 721.2;

// Small 2030 projection adjustments layered over the live ranking data.
// Argentina remain elite, but their current number-one ranking should not make
// them feel pre-selected to win a tournament taking place four years later.
const TEAM_STRENGTH_ADJUSTMENTS = new Map([
  ["Argentina", -10],
  ["Germany", 1.7],
  ["Mexico", -3.76],
  ["Norway", 4.6],
  ["Iran", -1.24],
  ["Denmark", -0.74],
  ["Ecuador", 0.66],
]);

const REAL_PLAYERS = {
  Argentina: ["Lionel Messi", "Julián Álvarez", "Lautaro Martínez", "Alexis Mac Allister", "Enzo Fernández"],
  Spain: ["Lamine Yamal", "Nico Williams", "Samu Aghehowa", "Ferran Torres", "Mikel Oyarzabal", "Víctor Muñoz", "Mikel Merino", "Fabián Ruiz"],
  France: ["Kylian Mbappé", "Ousmane Dembélé", "Marcus Thuram", "Bradley Barcola", "Michael Olise"],
  England: ["Bukayo Saka", "Cole Palmer", "Phil Foden", "Jude Bellingham", "Liam Delap", "Harry Kane", "Max Dowman", "Ethan Nwaneri", "Noni Madueke", "Rio Ngumoha", "Kobbie Mainoo"],
  Brazil: ["Vinícius Júnior", "Rodrygo", "Raphinha", "Endrick", "Bruno Guimarães"],
  Portugal: ["Cristiano Ronaldo", "Gonçalo Ramos", "João Félix", "Francisco Trincão", "Rafael Leão", "Pedro Neto", "Carlos Forbs", "Francisco Conceição"],
  Netherlands: ["Xavi Simons", "Cody Gakpo", "Memphis Depay", "Donyell Malen", "Noa Lang", "Crysencio Summerville", "Brian Brobbey", "Ryan Gravenberch", "Micky van de Ven"],
  Belgium: ["Jérémy Doku", "Leandro Trossard", "Charles De Ketelaere", "Dodi Lukébakio", "Alexis Saelemaekers", "Matias Fernandez-Pardo", "Axel Witsel", "Romelu Lukaku"],
  Germany: ["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Niclas Füllkrug", "Leroy Sané"],
  Italy: ["Francesco Camarda", "Pio Esposito", "Luca Koleosho", "Seydou Fini", "Jeff Ekhator", "Samuele Inácio", "Luca Lipani", "Alessio Cacciamani"],
  Uruguay: ["Darwin Núñez", "Federico Valverde", "Facundo Pellistri", "Maxi Araújo", "Manuel Ugarte"],
  Colombia: ["Luis Díaz", "Jhon Durán", "James Rodríguez", "Jhon Arias", "Rafael Borré"],
  Croatia: ["Bruno Durdov", "Luka Sučić", "Martin Baturina", "Petar Sučić", "Joško Gvardiol", "Luka Vušković"],
  Morocco: ["Brahim Díaz", "Ismael Saibari", "Eliesse Ben Seghir", "Bilal El Khannouss", "Amine Adli", "Soufiane Rahimi", "Ayyoub Bouaddi", "Chemsdine Talbi", "Sofyan Amrabat"],
  Japan: ["Takefusa Kubo", "Ayase Ueda", "Yuito Suzuki", "Keisuke Gotō", "Daizen Maeda", "Kōki Ogawa", "Kento Shiogai", "Shūto Machino"],
  USA: ["Christian Pulisic", "Cavan Sullivan", "Brenden Aaronson", "Haji Wright", "Folarin Balogun", "Timothy Weah", "Alejandro Zendejas", "Tyler Adams", "Ricardo Pepi"],
  Mexico: ["Santiago Giménez", "Raúl Jiménez", "Hirving Lozano", "Julián Quiñones", "Edson Álvarez"],
  Switzerland: ["Dan Ndoye", "Johan Manzambi", "Breel Embolo", "Rubén Vargas", "Noah Okafor", "Zeki Amdouni", "Denis Zakaria", "Remo Freuler"],
  Denmark: ["Rasmus Højlund", "Christian Eriksen", "Mikkel Damsgaard", "Jonas Wind", "Andreas Skov Olsen"],
  Senegal: ["Sadio Mané", "Nicolas Jackson", "Ismaïla Sarr", "Iliman Ndiaye", "Boulaye Dia"],
  Austria: ["Christoph Baumgartner", "Marcel Sabitzer", "Michael Gregoritsch", "Konrad Laimer", "Nicolas Seiwald"],
  "South Korea": ["Son Heung-min", "Lee Kang-in", "Hwang Hee-chan", "Cho Gue-sung", "Lee Jae-sung"],
  Ecuador: ["Enner Valencia", "Moisés Caicedo", "Kendry Páez", "John Yeboah", "Kevin Rodríguez"],
  Iran: ["Mehdi Ghayedi", "Ali Alipour", "Amirhossein Hosseinzadeh", "Shahriyar Moghanlou", "Dennis Eckert", "Saeid Ezatolahi", "Alireza Jahanbakhsh"],
  Ukraine: ["Artem Dovbyk", "Mykhailo Mudryk", "Viktor Tsygankov", "Georgiy Sudakov", "Roman Yaremchuk"],
  Türkiye: ["Arda Güler", "Kenan Yıldız", "Can Uzun", "Kerem Aktürkoğlu", "Orkun Kökçü", "Hakan Çalhanoğlu", "Salih Özcan", "Deniz Gül"],
  Australia: ["Mitchell Duke", "Craig Goodwin", "Ajdin Hrustic", "Martin Boyle", "Jackson Irvine"],
  Serbia: ["Aleksandar Mitrović", "Dušan Vlahović", "Dušan Tadić", "Luka Jović", "Sergej Milinković-Savić"],
  Nigeria: ["Victor Osimhen", "Ademola Lookman", "Samuel Chukwueze", "Victor Boniface", "Alex Iwobi"],
  Canada: ["Jonathan David", "Alphonso Davies", "Cyle Larin", "Tajon Buchanan", "Jacob Shaffelburg"],
  Poland: ["Robert Lewandowski", "Karol Świderski", "Nicola Zalewski", "Piotr Zieliński", "Krzysztof Piątek"],
  Norway: ["Erling Haaland", "Alexander Sørloth", "Jørgen Strand Larsen", "Antonio Nusa", "Andreas Schjelderup", "Oscar Bobb", "Jens Petter Hauge", "Morten Thorsby"],
  Egypt: ["Mohamed Salah", "Omar Marmoush", "Mostafa Mohamed", "Mahmoud Trezeguet", "Zizo"],
  Algeria: ["Riyad Mahrez", "Amine Gouiri", "Mohamed Amoura", "Saïd Benrahma", "Houssem Aouar"],
  "Ivory Coast": ["Yan Diomande", "Amad Diallo", "Karim Konaté", "Simon Adingra", "Ange-Yoan Bonny", "Elye Wahi", "Oumar Diakité", "Evann Guessand"],
  Scotland: ["Scott McTominay", "John McGinn", "Lyndon Dykes", "Che Adams", "Ryan Christie"],
  Ghana: ["Mohammed Kudus", "Jordan Ayew", "Antoine Semenyo", "Iñaki Williams", "Kamaldeen Sulemana"],
  Cameroon: ["Vincent Aboubakar", "Bryan Mbeumo", "Karl Toko Ekambi", "Frank Magri", "Georges-Kévin Nkoudou"],
  "Saudi Arabia": ["Salem Al-Dawsari", "Firas Al-Buraikan", "Saleh Al-Shehri", "Abdullah Radif", "Sami Al-Najei"],
  Jamaica: ["Leon Bailey", "Michail Antonio", "Shamar Nicholson", "Demarai Gray", "Bobby De Cordova-Reid"],
  "New Zealand": ["Chris Wood", "Sarpreet Singh", "Kosta Barbarouses", "Ben Waine", "Elijah Just"],
  Wales: ["Brennan Johnson", "Harry Wilson", "Kieffer Moore", "Daniel James", "David Brooks"],
  Sweden: ["Alexander Isak", "Viktor Gyökeres", "Dejan Kulusevski", "Anthony Elanga", "Emil Forsberg"],
  Hungary: ["Dominik Szoboszlai", "Barnabás Varga", "Roland Sallai", "Martin Ádám", "Dániel Gazdag"],
  Georgia: ["Khvicha Kvaratskhelia", "Georges Mikautadze", "Budu Zivzivadze", "Zuriko Davitashvili", "Giorgi Chakvetadze"],
};

const GENERATED_FIRST_NAMES = [
  "Mateo", "Noah", "Luka", "Elias", "Adam", "Sami", "Leo", "Mika", "Jonas", "Kai",
  "Theo", "Rayan", "Nico", "Ibrahim", "Joel", "Tariq", "Daniel", "Milan", "Ari", "Marco",
  "Luis", "Yuki", "Amir", "Kofi", "Ben", "Rafael", "Dario", "Tane", "Omar", "Enzo",
];

const GENERATED_LAST_NAMES = [
  "Silva", "Mori", "Diallo", "Martin", "Santos", "Nielsen", "Khan", "Mensah", "Costa",
  "Ali", "Rossi", "Banda", "Kim", "Smith", "Garcia", "Petrov", "Hassan", "Müller",
  "Toure", "Williams", "Tanaka", "Anders", "Navarro", "Okoro", "Tevita", "Mifsud",
  "Larsen", "Duarte", "Marin", "Rahman",
];

const CULTURAL_NAME_POOLS = {
  british: {
    first: ["Jack", "Liam", "Callum", "Ben", "Lewis", "Daniel", "Jamie", "Connor"],
    last: ["Quayle", "Kelly", "Crocker", "Leach", "Moore", "Williams", "Ward", "Roberts"],
  },
  french: {
    first: ["Mathis", "Enzo", "Théo", "Lucas", "Yann", "Kylian", "Loïc", "Jules"],
    last: ["Hoarau", "Payet", "Fontaine", "Rivière", "Morel", "Lacroix", "Boyer", "Lebon"],
  },
  italian: {
    first: ["Luca", "Matteo", "Marco", "Alessandro", "Davide", "Andrea", "Niccolò", "Simone"],
    last: ["Rossi", "Conti", "Marini", "Ricci", "Benedetti", "Galli", "Moretti", "Fabbri"],
  },
  nordic: {
    first: ["Jón", "Mikael", "Anders", "Emil", "Nils", "Lars", "Ári", "Mikkel"],
    last: ["Olsen", "Johansen", "Lund", "Petersen", "Hansen", "Nielsen", "Heikkinen", "Koskinen"],
  },
  pacific: {
    first: ["Tane", "Sione", "Tevita", "Pita", "Manu", "Jone", "Semi", "Leka"],
    last: ["Katoa", "Tupou", "Fifita", "Taufua", "Vaea", "Ma'afu", "Talakai", "Nasilasila"],
  },
  micronesian: {
    first: ["Jensen", "Kento", "Tino", "Lyle", "Masao", "Elijah", "Joses", "Shane"],
    last: ["Otto", "Wally", "Remengesau", "Udui", "Silbanuz", "Nena", "Capelle", "Gideon"],
  },
  caribbean: {
    first: ["Jamal", "Kemar", "Shamar", "Dario", "Andre", "Javon", "Tyrese", "Ronaldo"],
    last: ["Baptiste", "Richards", "Joseph", "Williams", "Thomas", "Edwards", "Lake", "Hodge"],
  },
  dutchCaribbean: {
    first: ["Jürgen", "Raily", "Denzel", "Quincy", "Jearl", "Gino", "Rangelo", "Darryl"],
    last: ["Martis", "Windster", "Rojer", "Cicilia", "Janga", "Maria", "Martha", "Pieters"],
  },
  latin: {
    first: ["Matías", "Nicolás", "Diego", "Benjamín", "Tomás", "Lucas", "Felipe", "Santiago"],
    last: ["Rojas", "Vargas", "Navarro", "Castro", "Mendoza", "Paredes", "Fuentes", "Morales"],
  },
  caucasus: {
    first: ["Nika", "Giorgi", "Aram", "Levan", "David", "Alan", "Soslan", "Tigran"],
    last: ["Beridze", "Kvaratskhelia", "Sargsyan", "Dadiani", "Gagloev", "Arutyunyan", "Margiev", "Simonyan"],
  },
  easternEuropean: {
    first: ["Andrei", "Mihail", "Vladislav", "Igor", "Sergiu", "Alexandru", "Victor", "Dumitru"],
    last: ["Rusu", "Cojocaru", "Munteanu", "Ceban", "Rotaru", "Popescu", "Lungu", "Balan"],
  },
  eastAfrican: {
    first: ["Ali", "Hassan", "Abdalla", "Salim", "Omar", "Juma", "Hamza", "Youssouf"],
    last: ["Suleiman", "Mwinyi", "Hassan", "Abdallah", "Mbarouk", "Said", "Madi", "Ahmed"],
  },
  hornAfrican: {
    first: ["Mohamed", "Abdi", "Yusuf", "Ahmed", "Ismail", "Hassan", "Mahdi", "Bilal"],
    last: ["Warsame", "Farah", "Ali", "Hersi", "Hassan", "Omar", "Nur", "Abdi"],
  },
};

const TEAM_NAME_CULTURE = {
  "Vatican City": "italian", Monaco: "french", Greenland: "nordic",
  "Northern Mariana Islands": "micronesian", Tuvalu: "pacific", Kiribati: "micronesian",
  Micronesia: "micronesian", Palau: "micronesian", "Marshall Islands": "micronesian", Nauru: "pacific",
  Zanzibar: "eastAfrican", Réunion: "french", Mayotte: "eastAfrican",
  "Saint Barthélemy": "french", "Saint Martin": "french", "Sint Maarten": "dutchCaribbean",
  Guadeloupe: "caribbean", Martinique: "caribbean", "French Guiana": "french",
  Bonaire: "dutchCaribbean", Saba: "dutchCaribbean", "Sint Eustatius": "dutchCaribbean",
  "Saint Pierre and Miquelon": "french", "Falkland Islands": "british", "Isle of Man": "british",
  Jersey: "british", Guernsey: "british", "Åland Islands": "nordic", Sealand: "british", Sápmi: "nordic",
  Abkhazia: "caucasus", "South Ossetia": "caucasus", Artsakh: "caucasus", Transnistria: "easternEuropean",
  Somaliland: "hornAfrican", "Western Sahara": "hornAfrican", "Chagos Islands": "eastAfrican",
  "Christmas Island": "british", "Cocos Islands": "british", "Norfolk Island": "british",
  "Pitcairn Islands": "british", Niue: "pacific", Tokelau: "pacific", "Wallis and Futuna": "pacific",
  "Easter Island": "latin",
};

const CONFED_NAME_CULTURE = {
  UEFA: "easternEuropean", CONMEBOL: "latin", CONCACAF: "caribbean",
  AFC: "easternEuropean", CAF: "eastAfrican", OFC: "pacific", INVITED: "british",
};

const SPECIAL_FLAGS = {
  "GB-ENG": "🏴", "GB-SCT": "🏴", "GB-WLS": "🏴", "GB-NIR": "🇬🇧",
  XK: "🇽🇰", XX: "🏳️",
};

const ROUND_NAMES = [
  "Round of 256", "Round of 128", "Round of 64", "Round of 32",
  "Round of 16", "Quarter-Final", "Semi-Final", "Final",
];

function codeToFlag(code) {
  if (SPECIAL_FLAGS[code]) return SPECIAL_FLAGS[code];
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt()));
}

function stableHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

const TEAMS = TEAM_SOURCE.split("\n").map((line, sourceIndex) => {
  const [name, code, confed] = line.split("|");
  const fifa = FIFA_RANKINGS.get(name);
  const fifaScale = fifa
    ? (fifa.points - FIFA_MIN_POINTS) / (FIFA_MAX_POINTS - FIFA_MIN_POINTS)
    : 0;
  const baseStrength = fifa
    ? 35 + fifaScale * 65
    : 18 + (stableHash(name) % 1600) / 100;
  const strength = baseStrength + (TEAM_STRENGTH_ADJUSTMENTS.get(name) || 0);
  return {
    id: `team-${sourceIndex + 1}`,
    name,
    code,
    confed,
    flag: codeToFlag(code),
    strength: Number(strength.toFixed(2)),
    rating: Math.round(strength),
    fifaRank: fifa?.rank || null,
    fifaPoints: fifa?.points || null,
    sourceIndex,
    players: RECENT_NATIONAL_TEAM_PLAYERS[name] || REAL_PLAYERS[name] || null,
    nameCulture: TEAM_NAME_CULTURE[name] || CONFED_NAME_CULTURE[confed],
  };
}).sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name))
  .map((team, index) => ({ ...team, seed: index + 1 }));

if (TEAMS.length !== 256) {
  throw new Error(`World 256 requires exactly 256 teams; found ${TEAMS.length}.`);
}
