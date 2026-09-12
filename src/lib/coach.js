import { Chess } from "chess.js";
import { CENTER } from "./evaluate.js";
import { findAttackers, findKing, isHanging, opposite } from "./board.js";

const COACH_ARROW = "#22d3ee";
const ALERT_ARROW = "#fb7185";
const HINT_ARROW = "#a3e635";

/** Common opening names keyed by space-separated SAN from the start. */
const OPENINGS = {
  e4: { en: "King's Pawn Opening", he: "פתיחת רגלי המלך" },
  d4: { en: "Queen's Pawn Opening", he: "פתיחת רגלי המלכה" },
  c4: { en: "English Opening", he: "הפתיחה האנגלית" },
  Nf3: { en: "Réti / flexible knight", he: "רטי — פרש גמיש" },
  "e4 e5": { en: "Open Game", he: "משחק פתוח" },
  "e4 c5": { en: "Sicilian Defence", he: "הגנה סיציליאנית" },
  "e4 e6": { en: "French Defence", he: "הגנה צרפתית" },
  "e4 c6": { en: "Caro-Kann Defence", he: "הגנת קארו-קאן" },
  "e4 d5": { en: "Scandinavian Defence", he: "הגנה סקנדינבית" },
  "e4 Nf6": { en: "Alekhine Defence", he: "הגנת אלכין" },
  "e4 e5 Nf3": { en: "King's Knight Attack", he: "התקפת פרש המלך" },
  "e4 e5 Nf3 Nc6": { en: "Open Game, both knights out", he: "משחק פתוח — שני הפרשים בחוץ" },
  "e4 e5 Nf3 Nc6 Bb5": { en: "Ruy Lopez", he: "רוי לופס" },
  "e4 e5 Nf3 Nc6 Bc4": { en: "Italian Game", he: "המשחק האיטלקי" },
  "e4 e5 Nf3 Nc6 d4": { en: "Scotch Game", he: "המשחק הסקוטי" },
  "e4 e5 Nf3 Nf6": { en: "Petrov Defence", he: "הגנת פטרוב" },
  "e4 c5 Nf3": { en: "Open Sicilian setup", he: "סיציליאנית פתוחה בהכנה" },
  "e4 c5 Nf3 d6": { en: "Sicilian, Classical / Najdorf family", he: "סיציליאנית — משפחת נאידורף" },
  "e4 c5 Nf3 Nc6": { en: "Sicilian, Old / Accelerated", he: "סיציליאנית עם פרש ל-c6" },
  "d4 d5": { en: "Closed Game", he: "משחק סגור" },
  "d4 Nf6": { en: "Indian Defence family", he: "משפחת ההגנות ההודיות" },
  "d4 d5 c4": { en: "Queen's Gambit", he: "גמביט המלכה" },
  "d4 Nf6 c4": { en: "Indian systems", he: "מערכות הודיות" },
  "d4 Nf6 c4 g6": { en: "King's Indian / Grünfeld setup", he: "הודית המלך / גרינפלד" },
  "d4 Nf6 c4 e6": { en: "Nimzo / Queen's Indian path", he: "נימצו / הודית המלכה" },
};

const WELCOME = {
  id: "welcome",
  tone: "info",
  title: { en: "Welcome to Maestro", he: "ברוכים הבאים למאסטרו" },
  body: {
    en: "Click a piece to see every legal square. I highlight threats, explain ideas after each move, and can draw plan arrows. Right-drag (or Arrows mode on a phone) to sketch your own ideas.",
    he: "לחצו על כלי כדי לראות את כל המסעים החוקיים. אני מסמן איומים, מסביר רעיונות אחרי כל מסע, ויכול לצייר חצי תוכנית. גררו עם כפתור ימני (או מצב חצים בטלפון) כדי לשרטט רעיונות.",
  },
};

function text(en, he) {
  return { en, he };
}

function lookupOpening(historySan) {
  const key = historySan.join(" ");
  // Longest prefix match so "e4 e5 Nf3 Nc6 Bb5" wins over "e4".
  let found = null;
  let bestLen = 0;
  for (const [seq, name] of Object.entries(OPENINGS)) {
    const parts = seq.split(" ");
    if (parts.length > historySan.length) continue;
    if (parts.every((san, i) => historySan[i] === san) && parts.length >= bestLen) {
      found = name;
      bestLen = parts.length;
    }
  }
  return found;
}

function pieceName(type, lang) {
  const names = {
    p: { en: "pawn", he: "רגלי" },
    n: { en: "knight", he: "פרש" },
    b: { en: "bishop", he: "רץ" },
    r: { en: "rook", he: "צריח" },
    q: { en: "queen", he: "מלכה" },
    k: { en: "king", he: "מלך" },
  };
  return names[type]?.[lang] ?? type;
}

/**
 * Rule-based coach: inspect the last move and emit one educational card.
 * All logic is local — no Stockfish, no API keys.
 */
export function analyzeMove(prevFen, move, after, historySan) {
  const before = new Chess(prevFen);
  const ply = historySan.length;
  const opening = lookupOpening(historySan);
  const mover = move.color === "w" ? "White" : "Black";
  const moverHe = move.color === "w" ? "הלבן" : "השחור";

  if (after.isCheckmate()) {
    return {
      id: "mate",
      tone: "success",
      title: text("Checkmate", "מט"),
      body: text(
        `${mover} delivered mate with ${move.san}. The king has no legal escape — that's the goal of every game.`,
        `${moverHe} הכריז מט ב־${move.san}. למלך אין בריחה חוקית — זה היעד של כל משחק.`,
      ),
      opening,
      arrows: [],
    };
  }

  if (after.isStalemate()) {
    return {
      id: "stale",
      tone: "warn",
      title: text("Stalemate — draw", "פט — תיקו"),
      body: text(
        "The side to move is not in check but has no legal move. That's a draw, not a win. Always leave the opponent a square if you are winning.",
        "הצד שבתור אינו בשח אבל אין לו מסע חוקי. זה תיקו, לא ניצחון. כשמנצחים — תמיד השאירו משבצת בריחה.",
      ),
      opening,
      arrows: [],
    };
  }

  if (after.isDraw()) {
    return {
      id: "draw",
      tone: "warn",
      title: text("Draw", "תיקו"),
      body: text(
        "The game is drawn (repetition, fifty-move, or insufficient material). In a lesson game, reset and try a more ambitious plan.",
        "המשחק הסתיים בתיקו (חזרה, 50 מסעים, או חומר לא מספיק). במשחק לימודי — אפסו והעזו יותר.",
      ),
      opening,
      arrows: [],
    };
  }

  const arrows = buildCoachArrows(after, move, ply);

  if (after.isCheck()) {
    return {
      id: "check",
      tone: "good",
      title: text("Check!", "שח!"),
      body: text(
        `${move.san} puts the king under attack. The reply must resolve the check: capture, block, or step aside.`,
        `${move.san} מעמיד את המלך תחת התקפה. החובה: להכות, לחסום, או לזוז הצידה.`,
      ),
      opening,
      arrows,
    };
  }

  if (move.san === "O-O" || move.san === "O-O-O") {
    const side = move.san === "O-O" ? text("kingside", "צד המלך") : text("queenside", "צד המלכה");
    return {
      id: "castle",
      tone: "good",
      title: text("Castled — king safety first", "הצרחה — בטיחות המלך"),
      body: text(
        `Tucking the king ${side.en} and connecting the rooks is a classic opening goal. The rook also jumps toward the center.`,
        `המלך הוסתר ל${side.he} והצריחים מתחברים — יעד קלאסי בפתיחה. הצריח גם מתקרב למרכז.`,
      ),
      opening,
      arrows,
    };
  }

  if (move.flags.includes("e")) {
    return {
      id: "ep",
      tone: "good",
      title: text("En passant", "הכאה דרך הילוכו"),
      body: text(
        "Special pawn capture: a pawn that just leaped two squares can be taken as if it had moved only one. You must play it immediately.",
        "הכאת רגלי מיוחדת: רגלי שקפץ שתי משבצות אפשר להכות כאילו התקדם רק אחת — ורק במסע הבא.",
      ),
      opening,
      arrows,
    };
  }

  if (move.promotion) {
    return {
      id: "promo",
      tone: "success",
      title: text("Promotion", "הכתרה"),
      body: text(
        `A pawn reached the last rank and became a ${pieceName(move.promotion, "en")}. Queens are usually strongest; under-promote only for a tactic.`,
        `רגלי הגיע לשורה האחרונה והפך ל${pieceName(move.promotion, "he")}. מלכה בדרך כלל החזקה ביותר; הכתרה נחותה רק לטקטיקה.`,
      ),
      opening,
      arrows,
    };
  }

  if (move.captured) {
    const gain = ( { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[move.captured] ?? 0 )
      - ( { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[move.piece] ?? 0 );
    const hangingNow = isHanging(after, move.to);
    return {
      id: "capture",
      tone: hangingNow ? "warn" : gain >= 0 ? "good" : "warn",
      title: hangingNow
        ? text("Capture — but is it safe?", "הכאה — האם הכלי בטוח?")
        : text("Material changes hands", "החומר מתחלף"),
      body: hangingNow
        ? text(
            `${move.san} wins a ${pieceName(move.captured, "en")}, yet the piece now sits undefended. Count attackers and defenders before you linger.`,
            `${move.san} מכה ${pieceName(move.captured, "he")}, אבל הכלי כעת לא מוגן. ספרו תוקפים ומגינים לפני שנשארים שם.`,
          )
        : text(
            `${move.san} captured a ${pieceName(move.captured, "en")}. Recapture if the trade is fair; decline if you can keep extra material.`,
            `${move.san} הכה ${pieceName(move.captured, "he")}. החזירו הכאה אם החילוף הוגן; ויתרו אם נשאר לכם יתרון חומר.`,
          ),
      opening,
      arrows,
    };
  }

  if (isHanging(after, move.to) && move.piece !== "p") {
    return {
      id: "hang",
      tone: "danger",
      title: text("That piece may be hanging", "הכלי הזה עלול להיות תלוי"),
      body: text(
        `${move.san} leaves the ${pieceName(move.piece, "en")} attacked and undefended. Look for a capture on ${move.to.toUpperCase()} next.`,
        `${move.san} משאיר את ה${pieceName(move.piece, "he")} מותקף וללא הגנה. חפשו הכאה ב־${move.to.toUpperCase()}.`,
      ),
      opening,
      arrows,
    };
  }

  if (move.piece === "q" && ply <= 8) {
    return {
      id: "queen-early",
      tone: "warn",
      title: text("Careful with the queen", "זהירות עם המלכה"),
      body: text(
        "Bringing the queen out too early invites tempo-gaining attacks by minor pieces. Develop knights and bishops first, then castle.",
        "הוצאת מלכה מוקדמת מזמינה התקפות עם רווח זמן מצד הכלים הקלים. קודם פרשים ורצים, אחר כך הצרחה.",
      ),
      opening,
      arrows,
    };
  }

  if (CENTER.has(move.to) && (move.piece === "p" || move.piece === "n")) {
    return {
      id: "center",
      tone: "good",
      title: text("Fight for the center", "מאבק על המרכז"),
      body: text(
        `${move.san} claims a central square. Pawns on d4/e4 (or d5/e5) give space; knights there radiate to eight squares.`,
        `${move.san} תופס משבצת מרכזית. רגלים ב־d4/e4 (או d5/e5) נותנים מרחב; פרש שם שולט על שמונה משבצות.`,
      ),
      opening,
      arrows,
    };
  }

  if ((move.piece === "n" || move.piece === "b") && ply <= 16) {
    return {
      id: "develop",
      tone: "good",
      title: text("Development", "פיתוח"),
      body: text(
        `${move.san} develops a minor piece. In the opening, every tempo spent bringing a new piece into the game is usually worth more than a second move with the same piece.`,
        `${move.san} מפתח כלי קל. בפתיחה, כל טמפו שמוציא כלי חדש למשחק שווה בדרך כלל יותר ממסע שני באותו כלי.`,
      ),
      opening,
      arrows,
    };
  }

  if (opening && ply <= 12) {
    return {
      id: "opening",
      tone: "info",
      title: opening,
      body: text(
        `${move.san} follows a known map. Keep developing, castle early, and connect the rooks before starting a wing pawn storm.`,
        `${move.san} ממשיך מפה מוכרת. המשיכו לפתח, הצריחו מוקדם, וחברו צריחים לפני הסתערות רגלים באגף.`,
      ),
      opening,
      arrows,
    };
  }

  // Quiet improving move — still teach something concrete.
  const quiet = quietLesson(before, after, move);
  return {
    id: quiet.id,
    tone: "info",
    title: quiet.title,
    body: quiet.body,
    opening,
    arrows,
  };
}

function quietLesson(_before, after, move) {
  if (move.piece === "r") {
    return {
      id: "rook",
      title: text("Rook activity", "פעילות הצריח"),
      body: text(
        `${move.san} — rooks love open and semi-open files. Doubling them or seizing the seventh rank is a mid-game dream.`,
        `${move.san} — צריחים אוהבים טורים פתוחים וחצי-פתוחים. הכפלה או השתלטות על השורה השביעית היא חלום במרכז המשחק.`,
      ),
    };
  }

  if (move.piece === "k" && after.fen().split(" ")[5] > 20) {
    return {
      id: "king-end",
      title: text("Activate the king", "הפעילו את המלך"),
      body: text(
        "In the endgame the king is an attacking piece. Centralize it — but only after the heavy pieces have traded down.",
        "בסיום המלך הוא כלי התקפי. מרכזו אותו — אבל רק אחרי שהכלים הכבדים התחלפו.",
      ),
    };
  }

  return {
    id: "quiet",
    title: text("Prophylaxis & plans", "פרופילקסיס ותוכניות"),
    body: text(
      `${move.san} is a quiet improving move. Ask: what is my opponent threatening, and which of my pieces is worst-placed?`,
      `${move.san} הוא מסע שקט ומשפר. שאלו: במה היריב מאיים, ואיזה כלי שלי במקום הגרוע ביותר?`,
    ),
  };
}

export function buildCoachArrows(chess, lastMove, ply = 0) {
  const arrows = [];

  if (chess.isCheck()) {
    const kingSq = findKing(chess, chess.turn());
    if (kingSq) {
      const attackers = findAttackers(chess, kingSq, opposite(chess.turn()));
      for (const from of attackers.slice(0, 2)) {
        arrows.push({ startSquare: from, endSquare: kingSq, color: ALERT_ARROW });
      }
    }
  }

  // Flag hanging pieces of the side that just moved.
  if (lastMove && isHanging(chess, lastMove.to)) {
    const hunters = findAttackers(chess, lastMove.to, chess.turn());
    if (hunters[0]) {
      arrows.push({ startSquare: hunters[0], endSquare: lastMove.to, color: ALERT_ARROW });
    }
  }

  if (arrows.length) return arrows.slice(0, 2);

  // Opening plan: suggest castling if it is legal and the king is still central.
  const castle = chess.moves({ verbose: true }).find((m) => m.san === "O-O" || m.san === "O-O-O");
  if (castle && ply >= 6) {
    arrows.push({ startSquare: castle.from, endSquare: castle.to, color: COACH_ARROW });
    return arrows;
  }

  // Nudge an undeveloped knight toward a natural square.
  const natural = new Set(
    chess.turn() === "w" ? ["c3", "f3", "d2", "e2"] : ["c6", "f6", "d7", "e7"],
  );
  const undeveloped = chess.moves({ verbose: true }).find((m) => {
    if (m.piece !== "n") return false;
    const home = m.color === "w" ? ["b1", "g1"] : ["b8", "g8"];
    return home.includes(m.from) && natural.has(m.to);
  });
  if (undeveloped && ply <= 16) {
    arrows.push({ startSquare: undeveloped.from, endSquare: undeveloped.to, color: COACH_ARROW });
  }

  return arrows.slice(0, 2);
}

export function hintArrows(move) {
  if (!move) return [];
  return [{ startSquare: move.from, endSquare: move.to, color: HINT_ARROW }];
}

export function welcomeAnalysis() {
  return { ...WELCOME, opening: null, arrows: [] };
}
