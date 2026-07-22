# Legacy Draft Data Audit

All 957 player records across 87 squads are **draft-ready** (dataStatus: "ready").

Starting XIs are each nation's first match at that World Cup, sourced from the Fjelstul World Cup Database.
Ratings use a hybrid approach: FIFA/EA Sports game data where available (high confidence), adjusted by tournament performance, with historical estimates for pre-1998 eras (low/medium confidence).

## Schema v3 (simplified)

Each player record now contains:
- `overall` (1-99 integer)
- `attack`, `control`, `defence` (derived from position + overall)
- `ratingConfidence`: "high", "medium", or "low"
- `ratingBasis`: short description of rating source

## Argentina

- **1986** (Argentina vs South Korea, draft-ready): Sergio Batista, José Luis Brown, Jorge Burruchaga, Néstor Clausen, Diego Maradona, Jorge Valdano, Oscar Garré, Ricardo Giusti, Pedro Pasculli, Nery Pumpido, Oscar Ruggeri
- **1990** (Argentina vs Cameroon, draft-ready): Nery Pumpido, Sergio Batista, Abel Balbo, José Basualdo, Jorge Burruchaga, Diego Maradona, Néstor Fabbri, Néstor Lorenzo, Roberto Néstor Sensini, Oscar Ruggeri, Juan Simón
- **1994** (Argentina vs Greece, draft-ready): José Chamot, Roberto Néstor Sensini, Fernando Redondo, Oscar Ruggeri, Claudio Caniggia, Gabriel Batistuta, Diego Maradona, Luis Islas, Fernando Cáceres, Diego Simeone, Abel Balbo
- **1998** (Argentina vs Japan, draft-ready): Carlos Roa, Roberto Ayala, Matías Almeyda, Roberto Néstor Sensini, Claudio López, Diego Simeone, Gabriel Batistuta, Ariel Ortega, Juan Sebastián Verón, Nelson Vivas, Javier Zanetti
- **2002** (Argentina vs Nigeria, draft-ready): Juan Pablo Sorín, Mauricio Pochettino, Walter Samuel, Claudio López, Javier Zanetti, Gabriel Batistuta, Ariel Ortega, Juan Sebastián Verón, Pablo Cavallero, Diego Placente, Diego Simeone
- **2006** (Argentina vs Ivory Coast, draft-ready): Roberto Abbondanzieri, Roberto Ayala, Juan Pablo Sorín, Esteban Cambiasso, Gabriel Heinze, Javier Saviola, Javier Mascherano, Hernán Crespo, Juan Román Riquelme, Maxi Rodríguez, Nicolás Burdisso
- **2010** (Argentina vs Nigeria, draft-ready): Martín Demichelis, Gabriel Heinze, Ángel Di María, Juan Sebastián Verón, Gonzalo Higuaín, Lionel Messi, Carlos Tevez, Walter Samuel, Javier Mascherano, Jonás Gutiérrez, Sergio Romero
- **2014** (Argentina vs Bosnia and Herzegovina, draft-ready): Sergio Romero, Ezequiel Garay, Hugo Campagnaro, Pablo Zabaleta, Ángel Di María, Lionel Messi, Maxi Rodríguez, Javier Mascherano, Marcos Rojo, Federico Fernández, Sergio Agüero
- **2018** (Argentina vs Iceland, draft-ready): Nicolás Tagliafico, Lucas Biglia, Lionel Messi, Ángel Di María, Maximiliano Meza, Javier Mascherano, Marcos Rojo, Nicolás Otamendi, Eduardo Salvio, Sergio Agüero, Willy Caballero
- **2022** (Argentina vs Saudi Arabia, draft-ready): Nicolás Tagliafico, Leandro Paredes, Rodrigo De Paul, Lionel Messi, Ángel Di María, Cristian Romero, Papu Gómez, Nicolás Otamendi, Lautaro Martínez, Emiliano Martínez, Nahuel Molina

## Belgium

- **1986** (Belgium vs Mexico, draft-ready): Jean-Marie Pfaff, Eric Gerets, Franky Van der Elst, Michel De Wolf, Franky Vercauteren, René Vandereycken, Enzo Scifo, Erwin Vandenbergh, Philippe Desmet, Jan Ceulemans, Hugo Broos
- **1990** (Belgium vs South Korea, draft-ready): Michel Preud'homme, Eric Gerets, Leo Clijsters, Bruno Versavel, Marc Emmers, Stéphane Demol, Franky Van der Elst, Marc Degryse, Enzo Scifo, Michel De Wolf, Marc Van Der Linden
- **1994** (Belgium vs Morocco, draft-ready): Michel Preud'homme, Rudi Smidts, Lorenzo Staelens, Franky Van der Elst, Luc Nilis, Marc Degryse, Enzo Scifo, Georges Grün, Michel De Wolf, Danny Boffin, Josip Weber
- **1998** (Netherlands vs Belgium, draft-ready): Filip De Wilde, Bertrand Crasson, Lorenzo Staelens, Vital Borkelmans, Franky Van der Elst, Marc Wilmots, Luís Oliveira, Luc Nilis, Philippe Clement, Mike Verstraeten, Danny Boffin
- **2002** (Japan vs Belgium, draft-ready): Geert De Vlieger, Eric Van Meir, Timmy Simons, Marc Wilmots, Bart Goor, Johan Walem, Gert Verheyen, Peter Van der Heyden, Jacky Peeters, Daniel Van Buyten, Yves Vanderhaeghe
- **2014** (Belgium vs Algeria, draft-ready): Thibaut Courtois, Toby Alderweireld, Vincent Kompany, Jan Vertonghen, Axel Witsel, Kevin De Bruyne, Romelu Lukaku, Eden Hazard, Daniel Van Buyten, Mousa Dembélé, Nacer Chadli
- **2018** (Belgium vs Panama, draft-ready): Thibaut Courtois, Toby Alderweireld, Jan Vertonghen, Axel Witsel, Kevin De Bruyne, Romelu Lukaku, Eden Hazard, Yannick Carrasco, Dries Mertens, Thomas Meunier, Dedryck Boyata
- **2022** (Belgium vs Canada, draft-ready): Thibaut Courtois, Toby Alderweireld, Jan Vertonghen, Axel Witsel, Kevin De Bruyne, Youri Tielemans, Eden Hazard, Yannick Carrasco, Leander Dendoncker, Timothy Castagne, Michy Batshuayi

## Brazil

- **1986** (Spain vs Brazil, draft-ready): Carlos, Édson, Edinho, Júnior, Casagrande, Careca, Júlio César, Alemão, Branco, Sócrates, Elzo
- **1990** (Brazil vs Sweden, draft-ready): Cláudio Taffarel, Jorginho, Ricardo Gomes, Dunga, Alemão, Branco, Valdo, Careca, Carlos Mozer, Müller, Mauro Galvão
- **1994** (Brazil vs Russia, draft-ready): Cláudio Taffarel, Jorginho, Ricardo Rocha, Mauro Silva, Bebeto, Dunga, Zinho, Raí, Romário, Márcio Santos, Leonardo
- **1998** (Brazil vs Scotland, draft-ready): Cláudio Taffarel, Cafu, Aldair, Júnior Baiano, César Sampaio, Roberto Carlos, Giovanni, Dunga, Ronaldo, Rivaldo, Bebeto
- **2002** (Brazil vs Turkey, draft-ready): Marcos, Cafu, Lúcio, Roque Júnior, Edmílson, Roberto Carlos, Gilberto Silva, Ronaldo, Rivaldo, Ronaldinho, Juninho Paulista
- **2006** (Brazil vs Croatia, draft-ready): Dida, Cafu, Lúcio, Juan, Emerson, Roberto Carlos, Adriano, Kaká, Ronaldo, Ronaldinho, Zé Roberto
- **2010** (Brazil vs North Korea, draft-ready): Júlio César, Maicon, Lúcio, Juan, Felipe Melo, Michel Bastos, Elano, Gilberto Silva, Luís Fabiano, Kaká, Robinho
- **2014** (Brazil vs Croatia, draft-ready): Dani Alves, Thiago Silva, David Luiz, Marcelo, Hulk, Paulinho, Fred, Neymar, Oscar, Júlio César, Luiz Gustavo
- **2018** (Brazil vs Switzerland, draft-ready): Alisson, Thiago Silva, Miranda, Casemiro, Gabriel Jesus, Neymar, Philippe Coutinho, Marcelo, Danilo, Paulinho, Willian
- **2022** (Brazil vs Serbia, draft-ready): Alisson, Danilo, Thiago Silva, Marquinhos, Casemiro, Alex Sandro, Lucas Paquetá, Richarlison, Neymar, Raphinha, Vinícius Júnior

## England

- **1986** (Portugal vs England, draft-ready): Peter Shilton, Gary Stevens, Kenny Sansom, Glenn Hoddle, Terry Butcher, Bryan Robson, Ray Wilkins, Mark Hateley, Gary Lineker, Chris Waddle, Terry Fenwick
- **1990** (England vs Republic of Ireland, draft-ready): Peter Shilton, Gary Stevens, Stuart Pearce, Des Walker, Terry Butcher, Bryan Robson, Chris Waddle, Peter Beardsley, Gary Lineker, John Barnes, Paul Gascoigne
- **1998** (England vs Tunisia, draft-ready): David Seaman, Sol Campbell, Graeme Le Saux, Paul Ince, Tony Adams, Gareth Southgate, David Batty, Alan Shearer, Teddy Sheringham, Darren Anderton, Paul Scholes
- **2002** (England vs Sweden, draft-ready): David Seaman, Danny Mills, Ashley Cole, Rio Ferdinand, Sol Campbell, David Beckham, Paul Scholes, Michael Owen, Emile Heskey, Owen Hargreaves, Darius Vassell
- **2006** (England vs Paraguay, draft-ready): Paul Robinson, Gary Neville, Ashley Cole, Steven Gerrard, Rio Ferdinand, John Terry, David Beckham, Frank Lampard, Michael Owen, Joe Cole, Peter Crouch
- **2010** (England vs United States, draft-ready): Glen Johnson, Ashley Cole, Steven Gerrard, John Terry, Aaron Lennon, Frank Lampard, Wayne Rooney, Robert Green, James Milner, Ledley King, Emile Heskey
- **2014** (England vs Italy, draft-ready): Joe Hart, Glen Johnson, Leighton Baines, Steven Gerrard, Gary Cahill, Phil Jagielka, Daniel Sturridge, Wayne Rooney, Danny Welbeck, Jordan Henderson, Raheem Sterling
- **2018** (Tunisia vs England, draft-ready): Jordan Pickford, Kyle Walker, John Stones, Harry Maguire, Jesse Lingard, Jordan Henderson, Harry Kane, Raheem Sterling, Kieran Trippier, Ashley Young, Dele Alli
- **2022** (England vs Iran, draft-ready): Jordan Pickford, Luke Shaw, Declan Rice, John Stones, Harry Maguire, Harry Kane, Raheem Sterling, Kieran Trippier, Bukayo Saka, Mason Mount, Jude Bellingham

## France

- **1986** (Canada vs France, draft-ready): Joël Bats, Manuel Amoros, Patrick Battiston, Maxime Bossis, Thierry Tusseau, Luis Fernández, Michel Platini, Alain Giresse, Jean Tigana, Jean-Pierre Papin, Dominique Rocheteau
- **1998** (France vs South Africa, draft-ready): Bixente Lizarazu, Laurent Blanc, Youri Djorkaeff, Didier Deschamps, Marcel Desailly, Stéphane Guivarc'h, Zinedine Zidane, Thierry Henry, Lilian Thuram, Fabien Barthez, Emmanuel Petit
- **2002** (France vs Senegal, draft-ready): Bixente Lizarazu, Patrick Vieira, Youri Djorkaeff, Marcel Desailly, Sylvain Wiltord, Thierry Henry, Lilian Thuram, Fabien Barthez, Emmanuel Petit, Frank Leboeuf, David Trezeguet
- **2006** (France vs Switzerland, draft-ready): Eric Abidal, Patrick Vieira, William Gallas, Claude Makélélé, Zinedine Zidane, Sylvain Wiltord, Thierry Henry, Lilian Thuram, Fabien Barthez, Willy Sagnol, Franck Ribéry
- **2010** (Uruguay vs France, draft-ready): Hugo Lloris, Bacary Sagna, Eric Abidal, William Gallas, Franck Ribéry, Yoann Gourcuff, Sidney Govou, Patrice Evra, Jérémy Toulalan, Abou Diaby, Nicolas Anelka
- **2014** (France vs Honduras, draft-ready): Hugo Lloris, Mathieu Debuchy, Patrice Evra, Raphaël Varane, Mamadou Sakho, Yohan Cabaye, Mathieu Valbuena, Karim Benzema, Antoine Griezmann, Blaise Matuidi, Paul Pogba
- **2018** (France vs Australia, draft-ready): Hugo Lloris, Benjamin Pavard, Raphaël Varane, Samuel Umtiti, Paul Pogba, Antoine Griezmann, Kylian Mbappé, Ousmane Dembélé, Corentin Tolisso, N'Golo Kanté, Lucas Hernandez
- **2022** (France vs Australia, draft-ready): Hugo Lloris, Benjamin Pavard, Antoine Griezmann, Aurélien Tchouaméni, Olivier Giroud, Kylian Mbappé, Ousmane Dembélé, Adrien Rabiot, Dayot Upamecano, Lucas Hernandez, Ibrahima Konaté

## Germany

- **1986** (Uruguay vs West Germany, draft-ready): Harald Schumacher, Hans-Peter Briegel, Andreas Brehme, Karlheinz Förster, Norbert Eder, Lothar Matthäus, Rudi Völler, Felix Magath, Thomas Berthold, Klaus Augenthaler, Klaus Allofs
- **1990** (West Germany vs Yugoslavia, draft-ready): Bodo Illgner, Stefan Reuter, Andreas Brehme, Klaus Augenthaler, Guido Buchwald, Thomas Häßler, Rudi Völler, Lothar Matthäus, Thomas Berthold, Uwe Bein, Jürgen Klinsmann
- **1994** (Germany vs Bolivia, draft-ready): Bodo Illgner, Andreas Brehme, Jürgen Kohler, Andreas Möller, Thomas Häßler, Karl-Heinz Riedle, Lothar Matthäus, Thomas Berthold, Matthias Sammer, Jürgen Klinsmann, Stefan Effenberg
- **1998** (Germany vs United States, draft-ready): Andreas Köpke, Christian Wörns, Jörg Heinrich, Jürgen Kohler, Olaf Thon, Andreas Möller, Thomas Häßler, Jens Jeremies, Jürgen Klinsmann, Stefan Reuter, Oliver Bierhoff
- **2002** (Germany vs Saudi Arabia, draft-ready): Oliver Kahn, Thomas Linke, Carsten Ramelow, Christian Ziege, Dietmar Hamann, Carsten Jancker, Miroslav Klose, Michael Ballack, Bernd Schneider, Christoph Metzelder, Torsten Frings
- **2006** (Germany vs Costa Rica, draft-ready): Jens Lehmann, Arne Friedrich, Bastian Schweinsteiger, Torsten Frings, Miroslav Klose, Philipp Lahm, Per Mertesacker, Tim Borowski, Bernd Schneider, Lukas Podolski, Christoph Metzelder
- **2010** (Germany vs Australia, draft-ready): Manuel Neuer, Arne Friedrich, Sami Khedira, Bastian Schweinsteiger, Mesut Özil, Lukas Podolski, Miroslav Klose, Thomas Müller, Holger Badstuber, Philipp Lahm, Per Mertesacker
- **2014** (Germany vs Portugal, draft-ready): Manuel Neuer, Benedikt Höwedes, Mats Hummels, Sami Khedira, Mesut Özil, Thomas Müller, Philipp Lahm, Per Mertesacker, Toni Kroos, Mario Götze, Jérôme Boateng
- **2018** (Germany vs Mexico, draft-ready): Manuel Neuer, Marvin Plattenhardt, Mats Hummels, Sami Khedira, Julian Draxler, Toni Kroos, Timo Werner, Mesut Özil, Thomas Müller, Jérôme Boateng, Joshua Kimmich
- **2022** (Germany vs Japan, draft-ready): Manuel Neuer, Antonio Rüdiger, David Raum, Joshua Kimmich, Kai Havertz, Serge Gnabry, Thomas Müller, Jamal Musiala, Niklas Süle, İlkay Gündoğan, Nico Schlotterbeck

## Italy

- **1986** (Bulgaria vs Italy, draft-ready): Giovanni Galli, Giuseppe Bergomi, Antonio Cabrini, Gaetano Scirea, Pietro Vierchowod, Salvatore Bagni, Fernando De Napoli, Antonio Di Gennaro, Bruno Conti, Alessandro Altobelli, Giuseppe Galderisi
- **1990** (Italy vs Austria, draft-ready): Walter Zenga, Franco Baresi, Giuseppe Bergomi, Riccardo Ferri, Paolo Maldini, Carlo Ancelotti, Fernando De Napoli, Giuseppe Giannini, Andrea Carnevale, Roberto Donadoni, Gianluca Vialli
- **1994** (Italy vs Republic of Ireland, draft-ready): Gianluca Pagliuca, Alessandro Costacurta, Paolo Maldini, Franco Baresi, Mauro Tassotti, Roberto Baggio, Demetrio Albertini, Dino Baggio, Roberto Donadoni, Alberigo Evani, Giuseppe Signori
- **1998** (Italy vs Chile, draft-ready): Paolo Maldini, Fabio Cannavaro, Alessandro Costacurta, Alessandro Nesta, Demetrio Albertini, Dino Baggio, Gianluca Pagliuca, Angelo Di Livio, Roberto Di Matteo, Roberto Baggio, Christian Vieri
- **2002** (Italy vs Ecuador, draft-ready): Gianluigi Buffon, Christian Panucci, Paolo Maldini, Fabio Cannavaro, Francesco Totti, Cristiano Doni, Alessandro Nesta, Luigi Di Biagio, Damiano Tommasi, Gianluca Zambrotta, Christian Vieri
- **2006** (Italy vs Ghana, draft-ready): Gianluigi Buffon, Cristian Zaccardo, Fabio Grosso, Daniele De Rossi, Fabio Cannavaro, Luca Toni, Francesco Totti, Alberto Gilardino, Alessandro Nesta, Simone Perrotta, Andrea Pirlo
- **2010** (Italy vs Paraguay, draft-ready): Gianluigi Buffon, Domenico Criscito, Giorgio Chiellini, Fabio Cannavaro, Daniele De Rossi, Simone Pepe, Vincenzo Iaquinta, Alberto Gilardino, Claudio Marchisio, Gianluca Zambrotta, Riccardo Montolivo
- **2014** (England vs Italy, draft-ready): Giorgio Chiellini, Matteo Darmian, Antonio Candreva, Claudio Marchisio, Mario Balotelli, Salvatore Sirigu, Andrea Barzagli, Daniele De Rossi, Gabriel Paletta, Andrea Pirlo, Marco Verratti

## Netherlands

- **1990** (Netherlands vs Egypt, draft-ready): Hans van Breukelen, Berry van Aerle, Frank Rijkaard, Ronald Koeman, Adri van Tiggelen, Jan Wouters, Erwin Koeman, Gerald Vanenburg, Marco van Basten, Ruud Gullit, Graeme Rutjes
- **1994** (Netherlands vs Saudi Arabia, draft-ready): Ed de Goey, Frank de Boer, Frank Rijkaard, Ronald Koeman, Jan Wouters, Marc Overmars, Wim Jonk, Ronald de Boer, Dennis Bergkamp, Bryan Roy, Ulrich van Gobbel
- **1998** (Netherlands vs Belgium, draft-ready): Edwin van der Sar, Jaap Stam, Frank de Boer, Arthur Numan, Ronald de Boer, Patrick Kluivert, Clarence Seedorf, Phillip Cocu, Marc Overmars, Aron Winter, Jimmy Floyd Hasselbaink
- **2006** (Serbia and Montenegro vs Netherlands, draft-ready): Edwin van der Sar, Joris Mathijsen, Giovanni van Bronckhorst, Phillip Cocu, Ruud van Nistelrooy, Arjen Robben, André Ooijer, John Heitinga, Robin van Persie, Mark van Bommel, Wesley Sneijder
- **2010** (Netherlands vs Denmark, draft-ready): Maarten Stekelenburg, Gregory van der Wiel, John Heitinga, Joris Mathijsen, Giovanni van Bronckhorst, Mark van Bommel, Dirk Kuyt, Nigel de Jong, Robin van Persie, Wesley Sneijder, Rafael van der Vaart
- **2014** (Spain vs Netherlands, draft-ready): Jasper Cillessen, Ron Vlaar, Stefan de Vrij, Bruno Martins Indi, Daley Blind, Nigel de Jong, Daryl Janmaat, Jonathan de Guzmán, Robin van Persie, Wesley Sneijder, Arjen Robben
- **2022** (Senegal vs Netherlands, draft-ready): Matthijs de Ligt, Virgil van Dijk, Nathan Aké, Steven Bergwijn, Cody Gakpo, Steven Berghuis, Daley Blind, Vincent Janssen, Frenkie de Jong, Denzel Dumfries, Andries Noppert

## Portugal

- **1986** (Portugal vs England, draft-ready): Manuel Bento, António Sousa, Álvaro, Carlos Manuel, Jaime Pacheco, Frederico, Fernando Gomes, António Oliveira, Diamantino, Augusto Inácio, António André
- **2002** (United States vs Portugal, draft-ready): Vítor Baía, Jorge Costa, Fernando Couto, Luís Figo, João Pinto, Pauleta, Rui Costa, Sérgio Conceição, Petit, Beto, Rui Jorge
- **2006** (Angola vs Portugal, draft-ready): Ricardo, Fernando Meira, Luís Figo, Petit, Pauleta, Simão, Miguel, Nuno Valente, Ricardo Carvalho, Cristiano Ronaldo, Tiago
- **2010** (Ivory Coast vs Portugal, draft-ready): Eduardo, Bruno Alves, Paulo Ferreira, Ricardo Carvalho, Cristiano Ronaldo, Pedro Mendes, Liédson, Danny, Raul Meireles, Deco, Fábio Coentrão
- **2014** (Germany vs Portugal, draft-ready): Bruno Alves, Pepe, Miguel Veloso, Fábio Coentrão, Cristiano Ronaldo, João Moutinho, Hugo Almeida, Rui Patrício, Raul Meireles, Nani, João Pereira
- **2018** (Portugal vs Spain, draft-ready): Rui Patrício, Pepe, Raphaël Guerreiro, José Fonte, Cristiano Ronaldo, João Moutinho, Bernardo Silva, William Carvalho, Bruno Fernandes, Gonçalo Guedes, Cédric
- **2022** (Portugal vs Ghana, draft-ready): Rúben Dias, Raphaël Guerreiro, Cristiano Ronaldo, Bruno Fernandes, Bernardo Silva, João Félix, Danilo Pereira, Rúben Neves, João Cancelo, Diogo Costa, Otávio

## Spain

- **1986** (Spain vs Brazil, draft-ready): Andoni Zubizarreta, Tomás, José Antonio Camacho, Antonio Maceda, Víctor, Andoni Goikoetxea, Emilio Butragueño, Julio Alberto, Francisco, Julio Salinas, Míchel
- **1990** (Uruguay vs Spain, draft-ready): Andoni Zubizarreta, Chendo, Manuel Jiménez, Genar Andrinúa, Manuel Sanchís, Rafael Martín Vázquez, Emilio Butragueño, Francisco Villarroya, Roberto, Manolo, Míchel
- **1994** (Spain vs South Korea, draft-ready): Albert Ferrer, Abelardo, Fernando Hierro, Andoni Goikoetxea, Julen Guerrero, Sergi, Santiago Cañizares, Rafael Alkorta, Julio Salinas, Miguel Ángel Nadal, Luis Enrique
- **1998** (Spain vs Nigeria, draft-ready): Andoni Zubizarreta, Albert Ferrer, Rafael Alkorta, Fernando Hierro, Raúl, Alfonso, Sergi, Iván Campo, Kiko, Miguel Ángel Nadal, Luis Enrique
- **2002** (Spain vs Slovenia, draft-ready): Iker Casillas, Juanfran, Carles Puyol, Fernando Hierro, Raúl, Rubén Baraja, Diego Tristán, Javier de Pedro, Juan Carlos Valerón, Miguel Ángel Nadal, Luis Enrique
- **2006** (Spain vs Ukraine, draft-ready): Iker Casillas, Mariano Pernía, Carles Puyol, Xavi, Fernando Torres, Luis García, Xabi Alonso, Sergio Ramos, Marcos Senna, David Villa, Pablo Ibáñez
- **2010** (Spain vs Switzerland, draft-ready): Iker Casillas, Gerard Piqué, Carles Puyol, Andrés Iniesta, David Villa, Xavi, Joan Capdevila, Xabi Alonso, Sergio Ramos, Sergio Busquets, David Silva
- **2014** (Spain vs Netherlands, draft-ready): Iker Casillas, Gerard Piqué, Andrés Iniesta, Xavi, Xabi Alonso, Sergio Ramos, Sergio Busquets, Jordi Alba, Diego Costa, David Silva, César Azpilicueta
- **2018** (Portugal vs Spain, draft-ready): David de Gea, Gerard Piqué, Nacho, Sergio Busquets, Andrés Iniesta, Koke, Sergio Ramos, Jordi Alba, Diego Costa, David Silva, Isco
- **2022** (Spain vs Costa Rica, draft-ready): César Azpilicueta, Sergio Busquets, Gavi, Marco Asensio, Ferran Torres, Rodri, Jordi Alba, Dani Olmo, Unai Simón, Aymeric Laporte, Pedri

