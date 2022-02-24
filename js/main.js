
var winner = ""; // Gewinner Variable
var game_over = false; // Spielende
var circuit; // = new QuantumCircuit(1); // Quanten Circuit
var field_played = []; // Dokumentation, welche Felder gespielt wurden.
var field_result = []; // Resultat pro Feld
var field_fixed = []; // Feld fixiert (anzahl Züge gespielt)

var board_field = [field_played, field_result, field_fixed];
var player = 1;	// Player 1 / X / q1 / result = 1 // Player 0 / O / q0 / result = -1
var counter = 0; // Zähler für Spielzüge
var erster_zug = true; // Indikator für ersten Zug, da kein Quantezug möglich

var second_field_needed = false; // braucht es ein weiteres Feld, um den Zug abzuschliessen (z.B. bei CNOT)
var helper_field = 0; // merkt sich das letzte Feld, falls zwei Felder selektiert werden müssen
var zug = 1; // Art des Zuges ( Klassisch / CNOT = "cx" 2 Felder)
const MAX_MOVES = 3; // Züge pro Feld

var move_history = "";
var move_tactics = 0;
var bot = true; // ture to play against bot
const MAX_DEPTH_OPENING = 9;
const MAX_DEPTH_MIDGAME = 2;
const MAX_DEPTH_ENDGAME = 2;
var max_depth = MAX_DEPTH_OPENING;

const MIDGAME_IGNITION = 5; // number of unplayed fields when Midgame starts
const ENDGAME_IGNITION = 3; // number of unplayed fields when endgame starts
const INFINITY = 1000;
var bot_counter = 0;
var beginner = true;
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);


// Selektierter Zug-Button
document.getElementById("1").style.backgroundColor = "#FAD02C";

// wird aufgerufen beim laden der Seite und initialisiert alle Felder
init();

// initialisieren der Felder
function init(){
	// Liste der gespielten Felder und fixierten Felder werden auf 0 gesetzt
  var i_name = "";
	for (var k=0; k<9; k++) {
    board_field[0][k] = 0;
    board_field[1][k] = 0;
    board_field[2][k] = 0;
		i_name = "p"+(k+1);
		document.getElementById(i_name).style.backgroundColor = "#333652";
		document.getElementById(i_name).innerHTML = "\xa0"+"q"+k;
	}
  game_over = false;
	erster_zug = true;
	counter = 0; // Zähler auf 0
	winner = ""; // Gewinner leer
  move_history = "";
	player = 1; // Erster Spieler ist 1 = X
	document.getElementById("winner").innerHTML = " ";
	document.getElementById("Player").innerHTML = "X";
  // Quanten Circuit initialisiert
	circuit = init_quantum();
  // Quanten Circuit zeichnen
	document.getElementById("drawing").innerHTML = circuit.exportSVG(true);
  document.getElementById("history").innerHTML = move_history;
  bot ? document.getElementById("bot").style.backgroundColor = "#FAD02C" : document.getElementById("bot").style.backgroundColor = "#90ADC6";
  beginner ? (
    document.getElementById("beginner").style.backgroundColor = "#FAD02C",
    document.getElementById("beginner").firstChild.data = "beginner",
    document.getElementById("beginner1").style.display = "block",
    document.getElementById("beginner2").style.display = "block"
  ) : (
    document.getElementById("beginner").style.backgroundColor = "#90ADC6",
    document.getElementById("beginner").firstChild.data = "expert",
    document.getElementById("beginner1").style.display = "none",
    document.getElementById("beginner2").style.display = "none"
  );
  document.getElementById("loading").style.display = "none";
}

// initialisieren des Quanten Circuit
function init_quantum(){
  var c = new QuantumCircuit(9); // Quanten circuit initialisieren
  // alle Felder mit X-Gate vorinitialisieren
	for (var k=0; k<9; k++) {
  	beginner ? c.appendGate("x", k, {}) : c.appendGate("id", k, {});
	}

  console.log("Quantum created "); // status
  return c;
}

// Definieren der Art des Zuges
function define_zug(value){
  if (!second_field_needed) {
  	// alle Zugelemente zurücksetzen
  	for (var k=1; k<5; k++) {
  		document.getElementById(k.toString()).style.backgroundColor = "#90ADC6";
  	}
  	// Art des Zuges ( wechseln "x", H = "h", CNOT = "cx" 2 Felder, lassen = "id", )
  	document.getElementById(value.toString()).style.backgroundColor = "#FAD02C";
  	zug = value;
    value < 4 ? document.getElementById("combinations").src="img/"+value+".png" : document.getElementById("combinations").src="img/"+value+"_"+Math.floor(Math.random() * 4)+".png"
  }
}

function change_bot() {
  bot ? (
    bot = false,
    document.getElementById("bot").style.backgroundColor = "#90ADC6"
  ) : (
    bot = true,
    document.getElementById("bot").style.backgroundColor = "#FAD02C"
  );
}

function change_beginner() {
  beginner ? (
    beginner = false,
    document.getElementById("beginner").style.backgroundColor = "#90ADC6",
    document.getElementById("beginner").firstChild.data = "expert",
    document.getElementById("beginner1").style.display = "none",
    document.getElementById("beginner2").style.display = "none"
  ) : (
    beginner = true,
    document.getElementById("beginner").style.backgroundColor = "#FAD02C",
    document.getElementById("beginner").firstChild.data = "beginner",
    document.getElementById("beginner1").style.display = "block",
    document.getElementById("beginner2").style.display = "block"
  );
  init();
}

function write_tactics(f, move_code) {
  var text = "Last move of O was on field: "+ f + "<br>";

  switch (move_code) {
    case 10:
      text += "Two moves left on this field. At the moment X has this field.";
      break;
    case 11:
      text += "Two moves left on this field. At the moment O has this field.";
      break;
    case 12:
      text += "Two moves left on this field. At the moment the field is random.";
      break;
    case 20:
      text += "One move left on this field. Consider to close this field.";
      break;
    case 21:
      text += "One move left on this field. Consider to close this field.";
      break;
    case 22:
      text += "One move left on this field. Consider to close this field. Perhaps a H-Gate can give you an advantage if another H-Gate was already used.";
      break;
    case 30:
    case 31:
    case 32:
      text += "The field has been closed. Look at possible lines from this field.";
      break;
    case 1314:
      text += "Two moves left on both fields. At the moment they are random OX or XO.";
      break;
    case 1324:
      text += "Different moves left on the fields. Assess the outcome and consider to close the target field.";
      break;
    case 1334:
      text += "Target field has been closed. Assess the outcome.";
      break;
    case 2314:
      text += "Different moves left on the fields. Assess the outcome and consider to close the control field.";
      break;
    case 2324:
      text += "One move left on both fields. Assess the outcome and consider to close one of the fields.";
      break;
    case 2334:
      text += "Target field has been closed. Assess the outcome and consider to close the control field.";
      break;
    case 3314:
      text += "Control field has been closed. Assess the outcome.";
      break;
    case 3324:
      text += "Control field has been closed. Assess the outcome and consider to close the target field.";
      break;
    case 3334:
      text += "Both fields have been closed. Assess the outcome.";
      break;
    default:
      text += "";
  }

  switch (countOccurrences(board_field[0],0)) {
    case 2:
      text += "<br>O can finish with the next move if you use an unplayed field."
      break;
    case 1:
      text += "<br>You can finish with the next move."
      break;
    default:
  }
  document.getElementById("tactics_description").innerHTML = text;

}

// Aufruf beim Klicken auf ein Feld
function select(z, field){
	var name = "p"+field;
	console.log("Feld "+name+ ", "+ player);
  var text = document.getElementById(name).innerHTML;
  var h_text = "";
  document.getElementById("Tipp").innerHTML = " ";

	if (game_over) {
    document.getElementById("Tipp").innerHTML = "The game is already finished.";
	}
  else if (board_field[2][field-1] == 1) { // Feld fixiert
    document.getElementById("Tipp").innerHTML = "The field cannot be selected. It is already fixed.";
  }
	else {
    if (player == 0) {
      move_history += "O"+field;
      h_text = "<span class='O'>";
    }
    else {
      move_history += "X"+field;
      h_text = "<span class='X'>";
    }


		// Wenn ein Quanten-Zug => das zweite Feld (Target Feld) muss bereits gemessen sein (hat Result)
		if (second_field_needed) {
			// CX gate
			console.log("Zweiter Zug von Quantenzug");
      move_history += "cx-t; "
      move_tactics += (board_field[0][field-1]+1) * 10; // add how many times played + this time
      move_tactics += 4;
      h_text += "\u2A02";// Zeichen für Feld
      z = 5; // for quantum move
			document.getElementById(name).style.backgroundColor = "#90ADC6";
			second_field_needed = false; // zurücksetzen für nächsten Zug
		}
		// Sonst => andere Züge
	  else if (!second_field_needed) {
      move_tactics = (board_field[0][field-1]+1) * 10; // add how many times played + this time
			switch (z) {
        // klassischer Zug => Wechseln
				case 1:
          // Qubit wird gewechselt mit X Gate
          move_history += "x; "
          move_tactics += 1;
          h_text += "\u27F2";
          second_field_needed = false; // kein zweiter Zug des Spielers
          document.getElementById(name).style.backgroundColor = "#90ADC6";
          break;
        // Klassischer Zug => beibehlaten
        case 2:
          move_history += "id; "
          //move_tactics += 0; do nothing
          h_text += "\u2B07";
          second_field_needed = false; // kein zweiter Zug des Spielers
          document.getElementById(name).style.backgroundColor = "#90ADC6";
          break;
        // H Gate => Superposition
        case 3:
          move_history += "h; "
          move_tactics += 2;
          h_text += "\u2053";
					second_field_needed = false; // kein zweiter Zug des Spielers
					document.getElementById(name).style.backgroundColor = "#90ADC6";
					break;
        // Entanglement ( H CNOT )
				case 4:
				  // zuerst Control gate => Muss H Gate sein
          //circuit.appendGate("h", field-1, {}); // H CNOT =>  / zweites X wird im nächsten Zug angehängt
          // CNOT wird erst im nächsten Zug angehängt
          move_history += "h-c; "
          move_tactics += 3;
          move_tactics = move_tactics * 100; // shift left
          h_text += "\u25CF";
          helper_field = field; // Control Feld merken
					second_field_needed = true; // zweiter Zug des Spielers
					document.getElementById(name).style.backgroundColor = "#90ADC6";
					break;
				default:
					console.log("Error 1: Zug falsch gewählt");
			}
		}
		else {
			console.log("Error 2: Feld falsch gewählt");
      document.getElementById("Tipp").innerHTML = "Wrong field chosen.";
		}
    // Feldtext setzen und Quantum Circuit zeichnen
    h_text += "</span>";
    beginner ? (board_field[0][field-1]==0 ? text = h_text : text += h_text) : text = h_text;
    document.getElementById(name).innerHTML = text;
    document.getElementById("history").innerHTML = move_history;

    // Tactics schreiben
    if (player == 0) {
      write_tactics(field, move_tactics);
    }

    game_over = quantum_move(z, circuit, field, board_field, helper_field);
    document.getElementById("drawing").innerHTML = circuit.exportSVG(true);

    // wenn max. Anzahl Züge erreicht, dann Feld einfärben und fixieren
    if (board_field[0][field-1] == MAX_MOVES) {
      document.getElementById(name).style.backgroundColor = "#FAD02C";
    }

    if (game_over) {
      document.getElementById("winner").innerHTML = check_winner(board_field[1]);
      // alle Felder durchlaufen und prüfen
      var m_name ="";
      for (var k=0; k<9; k++) {
        m_name = "p"+(k+1);
        //console.log("name: ", m_name);
      	if (board_field[1][k] == 1) {
      		// Erbesnis == 1 => X
          // Resultate zeichnen
      		document.getElementById(m_name).innerHTML = "X";
      		document.getElementById(m_name).style.backgroundColor = "#FAD02C";
      	}
      	else {
      		// Erbesnis == 0 => O
          // Resultate zeichnen
      		document.getElementById(m_name).innerHTML = "O";
      		document.getElementById(m_name).style.backgroundColor = "#FAD02C";
      	}
      }
      document.getElementById("Player").innerHTML = "The game is finished";
      document.getElementById("beginner2").style.display = "block";
    }

    if (z != 4) change_player();
	}
}

// quanten operationen von Zug
function quantum_move(z, c, f, b_field, h_field) {
  // Wenn ein Quanten-Zug => das zweite Feld (Target Feld) muss bereits gemessen sein (hat Result)

  switch (z) {
    // klassischer Zug => Wechseln
    case 1:
      // Qubit wird gewechselt mit X Gate
      c.appendGate("x", f-1, {}); // X Gate
      b_field[0][f-1] += 1; // Zähler für Feld hochsetzen
      break;
    // Klassischer Zug => beibehlaten
    case 2:
      c.appendGate("id", f-1, {}); // identity Gate
      b_field[0][f-1] += 1; // Zähler für Feld hochsetzen
      break;
    // H Gate => Superposition
    case 3:
      c.appendGate("h", f-1, {}); // H Gate
      b_field[0][f-1] += 1; // Zähler für Feld hochsetzen
      break;
    // Entanglement ( H CNOT )
    case 4:
      // zuerst Control gate => Muss H Gate sein
      c.appendGate("h", f-1, {}); // H CNOT =>  / zweites X wird im nächsten Zug angehängt
      // CNOT wird erst im nächsten Zug angehängt
      b_field[0][f-1] += 1; // Zähler für Feld hochsetzen
      break;

    case 5:
      // CX gate
      c.appendGate("cx", [h_field-1, f-1], {}); // CNOT Gate
      b_field[0][f-1] += 1; // Zähler für Feld hochsetzen
      break;
    default:
      console.log("xx");
  }

  if (b_field[0][f-1] == MAX_MOVES) {
    b_field[2][f-1] = 1; // Feld fixieren
  }
  // wenn alles gespielt ist, dann wird gemessen
  if (countOccurrences(b_field[0], 0) == 0) {
    // all played
    measure(c, b_field); // messen
    return true; // Game Over => keine Selektion mehr möglich
  }
  else {
    return false;
  }
}


// alle Qbits messen
function measure(c, b_field) {
  c.run(); // Circuit starten
	var measure = c.measureAll(); // alle Qubits messen
  // console.log("measure: ", measure);

	// alle Felder durchlaufen und prüfen
  for (var k=0; k<9; k++) {
  	if (measure[k] == 1) {
  		// Erbesnis == 1 => X
  		b_field[1][k] = 1; // Ergebnis setzen
      // Resultate zeichnen
  	}
  	else if (measure[k] == 0) {
  		// Erbesnis == 0 => O
  		b_field[1][k] = -1;// Ergebnis setzen
      // Resultate zeichnen
  	}
  	else {
  		console.log("Error3 : sollte nicht vorkommen");
  	}
  }
}


// Prüft ob es einen Gewinner gibt
function check_winner(f_result) {
  var x = false;
  var o = false;
	var a = f_result[0] + f_result[1] + f_result[2];
	var b = f_result[3] + f_result[4] + f_result[5];
	var c = f_result[6] + f_result[7] + f_result[8];
	var d = f_result[0] + f_result[3] + f_result[6];
	var e = f_result[1] + f_result[4] + f_result[7];
	var f = f_result[2] + f_result[5] + f_result[8];
	var g = f_result[0] + f_result[4] + f_result[8];
	var h = f_result[2] + f_result[4] + f_result[6];

	if (a == 3 || b == 3 || c == 3 || d == 3 || e == 3 || f == 3 || g == 3 || h == 3) {
		x = true;
	}
	if (a == -3 || b == -3 || c == -3 || d == -3 || e == -3 || f == -3 || g == -3 || h == -3) {
		o = true;
	}

  if ( (x && o) || (!x && !o) ) { // unentschieden
		return "draw"
	}
  else if (x) { // X Gewinner
    return "X"; // Spieler X  hat gewonnen
  }
  else { // O Gewinner
    return "O"; // Spieler O  hat gewonnen
  }
}


// Welchselt den Spieler und startet bot
function change_player(){
	if (game_over) { // Anzeigen, dass neu gestartet werden muss
		document.getElementById("Player").innerHTML = "The game is finished";
	}
  else {
		if (player == 1) { // Spieler 1 war dran => Spieler 0
			player = 0;
			document.getElementById("Player").innerHTML = "O";

      // flag is set and unplayed
      if (bot) {
        bot_counter = 0;
        document.getElementById("Tipp").innerHTML = "Calculating move.";
        document.getElementById("loading").style.display = "block";
        setTimeout(function(){
          // copy array
          var copy_board_field = board_field.map(function(arr) {
              return arr.slice();
          });
          // copy Circuit
          var copy_circuit = new QuantumCircuit(9);
          copy_circuit.load(circuit.save());

          // decide which game
          if (countOccurrences(board_field[0],0) > MIDGAME_IGNITION) {
            // OPEING
            console.log("Start BOT - OPENING !!!!!!!!");
            max_depth = MAX_DEPTH_OPENING;
            opening(copy_circuit, copy_board_field);
          }
          else if (countOccurrences(board_field[0],0) <= ENDGAME_IGNITION) {
            // ENDGAME
            console.log("Start BOT - ENDGAME!!!!!!!!");
            max_depth = MAX_DEPTH_ENDGAME;
            endgame(copy_circuit, copy_board_field);
          }
          else {
            // MIDGAME
            console.log("Start BOT - MIDGAME!!!!!!!!");
            max_depth = MAX_DEPTH_MIDGAME;
            midgame(copy_circuit, copy_board_field);
          }
          copy_circuit = null;
          document.getElementById("Tipp").innerHTML = bot_counter+" calculations done.";
          document.getElementById("loading").style.display = "none";
        },100);
      }
		}
		else { // Spieler 0 war dran => Spieler 1
			player = 1;
			document.getElementById("Player").innerHTML = "X";
		}
	}
}

function opening(c, b_field) {
  var bestScore = -INFINITY;
  var bestMove = 0;
  var score = 0;

  measure(c, b_field);
  var k = 0;
  for (k=0; k<9; k++) {
    b_field[0][k] == 0 && (b_field[1][k] = 0); // if first then init result to avoid measured X
  }

  //console.log("opening result", b_field, " ");
  for (k=0; k<9; k++) {
    //console.log("op measure result: ", b_field[1][k]);

    if (b_field[1][k] == 0) { // if not played / no result
      // copy array
      var copy_b_field = b_field.map(function(arr) {
          return arr.slice();
      });
      copy_b_field[1][k] = -1; // set -1 => O
      score = opening_minimax( copy_b_field, 0, false, -INFINITY, INFINITY);
      if (score > bestScore) {
        bestScore = score;
        bestMove = k;
      }
    }
  }
  console.log("Opening Score: ", bestScore);
  console.log("Opening Move: ", bestMove);
  beginner ? select(1, bestMove+1) : select(2, bestMove+1);
  return;
}

function opening_minimax(b_field, depth, isMaximizing, alpha, beta) {
  bot_counter++;
  var score = 0;
  var k = 0;
  var winner = "";
  var bestScore = 0;

  winner = check_winner(b_field[1]);
  //console.log(winner," wins minmax ", depth, " ", isMaximizing);

  if (winner == "X") {
    return (-10);
  }
  else if (winner == "O") {
    return (10);
  }
  else {
    if (countOccurrences(b_field[1],0) == 0) {
      return 0; // better than nothing
    }
  }

  if (isMaximizing) {
    bestScore = -INFINITY;
    for (k=0; k<9; k++) {
      if (b_field[1][k] == 0) { // if not fixed
        // copy array
        var copy_b_field = b_field.map(function(arr) {
            return arr.slice();
        });

        // move
        copy_b_field[1][k] = -1; // = bot
        score = opening_minimax(copy_b_field, depth + 1, false, alpha, beta);

        bestScore = Math.max( bestScore, score);
        alpha = Math.max( alpha, bestScore);
        if (beta <= alpha) break;
      }
    }
  }
  else { // minimizing
    bestScore = INFINITY;
    for (var k=0; k<9; k++) {
      if (b_field[1][k] == 0) { // if not fixed
        // copy array
        var copy_b_field = b_field.map(function(arr) {
            return arr.slice();
        });

        // move
        copy_b_field[1][k] = 1; // = bot
        score = opening_minimax(copy_b_field, depth + 1, true, alpha, beta);

        bestScore = Math.min( bestScore, score);
        beta = Math.min( beta, bestScore);
        if (beta <= alpha) break;
      }
    }
  }
  return bestScore;
}


function midgame(c, b_field) {
  var bestScore = -INFINITY;
  var bestMove = 0;
  var bestMethod = 1;
  var bestRand = 0;
  var score = 0;
  var j = 1;
  var k = 0;
  for (j=4; j>0; j--) {  // different moves
    for (k=0; k<9; k++) {
      if (b_field[2][k] == 0) { // if not fixed
        // copy array
        var copy_b_field = b_field.map(function(arr) {
            return arr.slice();
        });
        // copy Circuit
        var copy_c = new QuantumCircuit(9);
        copy_c.load(c.save());

        // if entaglement look for a random target field
        if (j == 4) {
          do {
            rand = Math.floor(Math.random() * 9);
          } while ((rand == k) || (copy_b_field[2][rand] > 0));
          //console.log("rand ",rand);
          //copy_b_field[0][rand] += 1; // = bot
          quantum_move(j, copy_c, k+1, copy_b_field, 0);
          quantum_move(5, copy_c, rand+1, copy_b_field, k+1);
        }
        else {
          quantum_move(j, copy_c, k+1, copy_b_field, 0);
        }
        score = midgame_minimax(copy_c, b_field, 0, false, -INFINITY, INFINITY);
        //console.log("Score-m: ", score);
        // free Circuit
        copy_c = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = k;
          bestMethod = j;
          bestRand = rand;
        }
      }
    }
  }
  console.log("Mid Score: ", bestScore);
  console.log("Mid Method: ", bestMethod);
  console.log("Mid Move: ", bestMove);
  if (bestMethod == 4) {
    select(bestMethod, bestMove+1);
    select(bestMethod, bestRand+1);
  }
  else {
    select(bestMethod, bestMove+1);
  }
  return;
}


function midgame_minimax(c, b_field, depth, isMaximizing, alpha, beta) {
  bot_counter++;
  var score = 0;
  var j = 1;
  var k = 0;
  var rand = 0;
  var winner = "";
  var bestScore = 0;
  if (depth == max_depth) {
    //console.log("depth ", depth, "md ",max_depth);
    measure(c, b_field);
    return (countOccurrences(b_field[1],-1)+countOccurrences(b_field[0],0)- countOccurrences(b_field[1],1));
  }

  if (isMaximizing) {
    this.bestScore = -INFINITY;
    for (j=1; j<4; j++) {  // different moves
      for (k=0; k<9; k++) {
        if (b_field[2][k] == 0) { // if not fixed
          // copy array
          var copy_b_field = b_field.map(function(arr) {
              return arr.slice();
          });
          // copy Circuit
          var copy_c = new QuantumCircuit(9);
          copy_c.load(c.save());

          // move
          quantum_move(j, copy_c, k+1, copy_b_field, 0); // todo entaglement
          score = midgame_minimax(copy_c, copy_b_field, depth + 1, false, alpha, beta);
          // free Circuit
          copy_c = null;
          this.bestScore = Math.max( this.bestScore, score);
          alpha = Math.max( alpha, this.bestScore);
          if (beta <= alpha) break;
        }
      }
    }
  }
  else { // minimizing
    this.bestScore = INFINITY;
    for (var j=1; j<4; j++) {  // different moves
      for (var k=0; k<9; k++) {
        if (b_field[2][k] == 0) { // if not fixed

          // copy array
          var copy_b_field = b_field.map(function(arr) {
              return arr.slice();
          });
          // copy Circuit
          var copy_c = new QuantumCircuit(9);
          copy_c.load(c.save());

          // move
          quantum_move(j, copy_c, k+1, copy_b_field, 0);
          score = midgame_minimax(copy_c, copy_b_field, depth + 1, true, alpha, beta);
          // free Circuit
          copy_c = null;
          this.bestScore = Math.min( this.bestScore, score);
          beta = Math.min( beta, this.bestScore);
          if (beta <= alpha) break;
        }
      }
    }
  }
  //console.log("Score-m10: ", this.bestScore);
  return this.bestScore;
}




function endgame(c, b_field) {
  var bestScore = -INFINITY;
  var bestMove = 0;
  var bestMethod = 1;
  var score = 0;
  var j = 1;
  var k = 0;
  for (j=1; j<4; j++) {  // different moves
    for (k=0; k<9; k++) {
      if (b_field[2][k] == 0) { // if not fixed
        // copy array
        var copy_b_field = b_field.map(function(arr) {
            return arr.slice();
        });
        // copy Circuit
        var copy_c = new QuantumCircuit(9);
        copy_c.load(c.save());

        if (quantum_move(j, copy_c, k+1, copy_b_field, 0)) {
          winner = check_winner(copy_b_field[1]);
          //console.log(winner, " wins  ",j, " ", k);
          if (winner == "X") {
            score = -max_depth-1;
          }
          else if (winner == "O") {
            score = max_depth+1;
          }
          else {
            score = 0; // better than nothing
          }
        }
        else {
          score = endgame_minimax(copy_c, copy_b_field, 0, false);
        }
        //console.log("Score-e: ", score);

        // free Circuit
        copy_c = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = k;
          bestMethod = j;
        }
      }
    }
  }
  console.log("End Score: ", bestScore);
  console.log("End Method: ", bestMethod);
  console.log("End Move: ", bestMove);
  select(bestMethod, bestMove+1);
  return;
}

function endgame_minimax(c, b_field, depth, isMaximizing) {
  bot_counter++;
  var score = 0;
  var j = 1;
  var k = 0;
  var winner = "";
  var bestScore = 0;
  if (depth == max_depth) {
    measure(c, b_field);
    winner = check_winner(b_field[1]);
    //console.log(winner," wins minmax ", depth, " ", isMaximizing);
    if (winner == "X") {
      return (depth - (max_depth+1));
    }
    else if (winner == "O") {
      return (max_depth+1 - depth);
    }
    else {
      return 0; // better than nothing
    }
  }

  if (isMaximizing) {
    bestScore = -INFINITY;
    for (j=1; j<4; j++) {  // different moves
      for (k=0; k<9; k++) {
        if (b_field[2][k] == 0) { // if not fixed

          // copy array
          var copy_b_field = b_field.map(function(arr) {
              return arr.slice();
          });
          // copy Circuit
          var copy_c = new QuantumCircuit(9);
          copy_c.load(c.save());

          // move
          quantum_move(j, copy_c, k+1, copy_b_field, 0);
          score = endgame_minimax(copy_c, copy_b_field, depth + 1, false);
          // free Circuit
          copy_c = null;
          score > bestScore && (bestScore = score);
        }
      }
    }
  }
  else { // minimizing
    bestScore = INFINITY;
    for (var j=1; j<4; j++) {  // different moves
      for (var k=0; k<9; k++) {
        if (b_field[2][k] == 0) { // if not fixed
          // copy array
          var copy_b_field = b_field.map(function(arr) {
              return arr.slice();
          });
          // copy Circuit
          var copy_c = new QuantumCircuit(9);
          copy_c.load(c.save());

          // move
          quantum_move(j, copy_c, k+1, copy_b_field, 0)
          score = endgame_minimax(copy_c, copy_b_field, depth + 1, true);
          // free Circuit
          copy_c = null;
          score < bestScore && (bestScore = score);
        }
      }
    }
  }
  return bestScore;
}
