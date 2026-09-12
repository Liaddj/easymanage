/**
 * Progressive path for players who already know the rules.
 * Each puzzle is a real FEN; the only legal replies are chess.js legal moves.
 * `solution` is SAN from the start FEN: human, (optional opponent), human, ...
 */

export const STAGES = [
  {
    id: "tactics-forks",
    track: "tactics",
    title: { en: "Forks", he: "מזלגות" },
    blurb: {
      en: "One move, two jobs. Check the king and attack a heavy piece — or fork two unprotected units.",
      he: "מסע אחד, שתי מטרות. שח למלך ותקיפת כלי כבד — או מזלג לשני כלים לא מוגנים.",
    },
    learn: {
      en: "A fork is one move that attacks two targets at the same time — often the king plus a queen or rook.",
      he: "מזלג הוא מסע אחד שתוקף שתי מטרות בבת אחת — לעיתים המלך ועוד מלכה או צריח.",
    },
    why: {
      en: "The opponent cannot save both pieces. That is how short tactics become extra material, then a won endgame.",
      he: "היריב אינו יכול להציל את שני הכלים. כך טקטיקה קצרה הופכת לחומר עודף, ואז לסיום זכייה.",
    },
    how: {
      en: "Look for a check that also hits a loose queen or rook, or a pawn push that attacks two pieces. One clean move solves each drill.",
      he: "חפשו שח שפוגע גם במלכה או צריח תלויים, או דחיפת רגלי שתוקפת שני כלים. מסע אחד נקי פותר כל תרגיל.",
    },
    goal: {
      en: "Find the fork that wins material.",
      he: "מצאו את המזלג שזוכה בחומר.",
    },
    puzzles: [
      {
        id: "fork-royal-knight",
        fen: "6k1/5ppp/8/8/3np3/8/3Q1P1P/6K1 b - - 0 1",
        title: { en: "Royal knight fork", he: "מזלג מלכותי בפרש" },
        goal: {
          en: "Black to move. Fork the king and queen.",
          he: "שחור לנוע. מזלגו את המלך ואת המלכה.",
        },
        hint: {
          en: "From d4, which check also hits the queen on d2? The e4 pawn will recapture.",
          he: "מ־d4, איזה שח פוגע גם במלכה ב־d2? רגלי e4 יכה בחזרה.",
        },
        success: {
          en: "Nf3+! A royal fork — king and queen. If the queen takes, exf3 wins her.",
          he: "פרש ל־f3! מזלג מלכותי. אם המלכה לוקחת, רגלי לוקח ב־f3.",
        },
        fail: {
          en: "Look for a check that also attacks the queen.",
          he: "חפשו שח שתוקף גם את המלכה.",
        },
        solution: ["Nf3+"],
      },
      {
        id: "fork-fried-liver",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 4",
        title: { en: "Two hanging treasures", he: "שני אוצרות תלויים" },
        goal: {
          en: "White to move. The knight can attack queen and rook at once.",
          he: "לבן לנוע. הפרש יכול לתקוף מלכה וצריח בבת אחת.",
        },
        hint: {
          en: "f7 is the weakest square in the opening. The knight on g5 already eyes it.",
          he: "f7 היא המשבצת החלשה בפתיחה. הפרש ב־g5 כבר מביט אליה.",
        },
        success: {
          en: "Nxf7! Forks the queen and the h8 rook — the Fried Liver idea.",
          he: "פרש לוקח ב־f7! מזלג למלכה ולצריח h8 — רעיון הכבד המטוגן.",
        },
        fail: {
          en: "The fork lands on f7, not a developing move.",
          he: "המזלג נוחת ב־f7, לא במסע פיתוח.",
        },
        solution: ["Nxf7"],
      },
      {
        id: "fork-queen-backrank",
        fen: "r5k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1",
        title: { en: "Queen on the back rank", he: "מלכה בשורה האחורית" },
        goal: {
          en: "White to move. Check the king and attack the rook.",
          he: "לבן לנוע. שח למלך ותקיפת הצריח.",
        },
        hint: {
          en: "The 8th rank is crowded. A queen check there hits both king and rook.",
          he: "השורה השמינית צפופה. שח של מלכה שם פוגע במלך ובצריח.",
        },
        success: {
          en: "Qc8+! The queen skewers nothing — she forks king and rook on the same rank.",
          he: "מלכה ל־c8! מזלג בשורה: מלך וצריח.",
        },
        fail: {
          en: "Check on the 8th rank is the fork.",
          he: "השח בשורה השמינית הוא המזלג.",
        },
        solution: ["Qc8+"],
      },
      {
        id: "fork-pawn",
        fen: "4k3/8/8/2n1n3/8/3P4/8/4K3 w - - 0 1",
        title: { en: "Pawn fork", he: "מזלג רגלי" },
        goal: {
          en: "White to move. One pawn push attacks both knights.",
          he: "לבן לנוע. דחיפת רגלי אחת תוקפת את שני הפרשים.",
        },
        hint: {
          en: "Pawns capture diagonally. Advance so both knights are on capture squares.",
          he: "רגלים מכים באלכסון. התקדמו כך ששני הפרשים יהיו במשבצות הכאה.",
        },
        success: {
          en: "d4! The pawn attacks c5 and e5 — both knights hang.",
          he: "d4! הרגלי תוקף c5 ו־e5 — שני הפרשים תלויים.",
        },
        fail: {
          en: "Push the d-pawn so it attacks both knights.",
          he: "דחפו את רגלי ה־d כך שיתקוף את שני הפרשים.",
        },
        solution: ["d4"],
      },
    ],
  },
  {
    id: "tactics-pins",
    track: "tactics",
    title: { en: "Pins", he: "ריתוקים" },
    blurb: {
      en: "A pinned piece cannot legally leave the line to its king. Capture it, or pile on.",
      he: "כלי רתוק אינו יכול לעזוב את הקו אל המלך. הכניסו אותו, או העמיסו עליו.",
    },
    learn: {
      en: "A pin lines up a piece with its king. If it is absolute, that piece is not allowed to move off the line.",
      he: "ריתוק מיישר כלי עם המלך שלו. בריתוק מוחלט אסור לכלי לרדת מהקו.",
    },
    why: {
      en: "Pinned pieces are weaker than they look. You can capture them, or attack them again until they fall.",
      he: "כלים רתוקים חלשים ממה שהם נראים. אפשר להכות אותם, או להעמיס עד שיפלו.",
    },
    how: {
      en: "Find the pin line (file, rank, or diagonal). Capture the stuck piece, or add a second attacker. Recapture is often illegal.",
      he: "מצאו את קו הריתוק. הכניסו את הכלי התקוע, או הוסיפו תוקף שני. הכאה בחזרה לעיתים לא חוקית.",
    },
    goal: {
      en: "Exploit the absolute pin to win material.",
      he: "נצלו את הריתוק המוחלט כדי לזכות בחומר.",
    },
    puzzles: [
      {
        id: "pin-take-queen",
        fen: "4k3/4q3/8/8/8/8/8/4RK2 w - - 0 1",
        title: { en: "Pinned queen", he: "מלכה רתוקה" },
        goal: {
          en: "White to move. The queen is glued to her king.",
          he: "לבן לנוע. המלכה דבוקה למלכה שלה — למלך.",
        },
        hint: {
          en: "The e-file is a pin line. The queen cannot recapture.",
          he: "טור e הוא קו ריתוק. המלכה אינה יכולה להכות בחזרה.",
        },
        success: {
          en: "Rxe7+! Absolute pin: capturing back with the queen would leave the king in check.",
          he: "צריח לוקח ב־e7! ריתוק מוחלט — המלכה לא יכולה להכות בחזרה.",
        },
        fail: {
          en: "Take the pinned queen. She is not allowed to recapture.",
          he: "קחו את המלכה הרתוקה. אסור לה להכות בחזרה.",
        },
        solution: ["Rxe7+"],
      },
      {
        id: "pin-bishop-knight",
        fen: "7k/5ppp/5n2/4P3/8/8/8/B5K1 w - - 0 1",
        title: { en: "Pin and pile on", he: "ריתוק והעמסה" },
        goal: {
          en: "White to move. The knight is pinned to the king. Win it.",
          he: "לבן לנוע. הפרש רתוק למלך. זכו בו.",
        },
        hint: {
          en: "A pawn can capture a piece that is not allowed to run.",
          he: "רגלי יכול להכות כלי שאסור לו לברוח.",
        },
        success: {
          en: "exf6! The knight is pinned along a1–h8, so it cannot step off the diagonal.",
          he: "רגלי לוקח ב־f6! הפרש רתוק באלכסון a1–h8 ולא יכול לרדת מהקו.",
        },
        fail: {
          en: "Use the e-pawn. The knight is stuck on the long diagonal.",
          he: "השתמשו ברגלי ה־e. הפרש תקוע באלכסון הארוך.",
        },
        solution: ["exf6"],
      },
      {
        id: "pin-attack-knight",
        fen: "4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1",
        title: { en: "Pinned and attacked", he: "רתוק ומותקף" },
        goal: {
          en: "White to move. Win the knight that cannot leave the c-file.",
          he: "לבן לנוע. זכו בפרש שאינו יכול לעזוב את טור c.",
        },
        hint: {
          en: "Either capture it now, or squeeze it with a pawn. Capturing is fastest.",
          he: "הכניסו אותו עכשיו, או לחצו ברגלי. ההכאה המהירה ביותר.",
        },
        success: {
          en: "Bxc6+! The king must recapture — the knight was absolutely pinned.",
          he: "רץ לוקח ב־c6! המלך חייב להכות בחזרה — הפרש היה רתוק לחלוטין.",
        },
        fail: {
          en: "The bishop already looks at the pinned knight.",
          he: "הרץ כבר מביט בפרש הרתוק.",
        },
        solution: ["Bxc6+"],
        alts: ["d5"],
      },
    ],
  },
  {
    id: "tactics-skewers",
    track: "tactics",
    title: { en: "Skewers", he: "שיפודים" },
    blurb: {
      en: "The opposite of a pin: the king (or a valuable piece) stands in front. Check it, take what hides behind.",
      he: "ההפך מריתוק: המלך (או כלי יקר) עומד מלפנים. תנו שח, קחו את מה שמסתתר מאחור.",
    },
    learn: {
      en: "A skewer checks (or attacks) the valuable piece in front. When it steps aside, the piece behind is taken.",
      he: "שיפוד נותן שח (או תוקף) את הכלי היקר מלפנים. כשהוא זז, הכלי מאחור נופל.",
    },
    why: {
      en: "It is the mirror of a pin and a common way to win a queen after a king is forced to move.",
      he: "זה המראה של ריתוק, ודרך נפוצה לזכות במלכה אחרי שהמלך חייב לזוז.",
    },
    how: {
      en: "Align king and queen on a file, rank, or long diagonal. Check through the king, then take the piece that was hiding.",
      he: "יישרו מלך ומלכה על טור, שורה או אלכסון. שח דרך המלך, ואז קחו את מה שהסתתר.",
    },
    goal: {
      en: "Skewer the king and win the piece behind it.",
      he: "שפדו את המלך וזכו בכלי שמאחוריו.",
    },
    puzzles: [
      {
        id: "skewer-rook",
        fen: "6kq/8/8/8/8/8/4R3/4K3 w - - 0 1",
        title: { en: "Rook skewer", he: "שיפוד צריח" },
        goal: {
          en: "White to move. Check the king; the queen hides behind it on the 8th rank.",
          he: "לבן לנוע. שח למלך; המלכה מסתתרת מאחוריו בשורה השמינית.",
        },
        hint: {
          en: "Slide the rook to the 8th rank with check.",
          he: "החליקו את הצריח לשורה השמינית עם שח.",
        },
        success: {
          en: "Re8+! The king must step aside and the queen on h8 falls.",
          he: "צריח ל־e8! המלך חייב לזוז והמלכה ב־h8 נופלת.",
        },
        fail: {
          en: "Check on e8 — that is the skewer.",
          he: "שח ב־e8 — זה השיפוד.",
        },
        solution: ["Re8+"],
      },
      {
        id: "skewer-bishop",
        fen: "7q/8/5k2/8/8/8/8/B5K1 w - - 0 1",
        title: { en: "Bishop skewer", he: "שיפוד רץ" },
        goal: {
          en: "White to move. Check the king; the queen sits behind it on the long diagonal.",
          he: "לבן לנוע. שח למלך; המלכה יושבת מאחוריו באלכסון הארוך.",
        },
        hint: {
          en: "Step onto the long diagonal with check. The king is in front of the queen.",
          he: "היכנסו לאלכסון הארוך עם שח. המלך לפני המלכה.",
        },
        success: {
          en: "Bb2+! The king must move and Bxh8 wins the queen.",
          he: "רץ ל־b2! המלך חייב לזוז ורץ לוקח ב־h8.",
        },
        fail: {
          en: "Check on the long diagonal, in front of the queen.",
          he: "שח באלכסון הארוך, לפני המלכה.",
        },
        solution: ["Bb2+"],
      },
    ],
  },
  {
    id: "tactics-discovered",
    track: "tactics",
    title: { en: "Discovered attacks", he: "התקפות נגלות" },
    blurb: {
      en: "Move the front piece and the piece behind it suddenly attacks. Double checks are often decisive.",
      he: "הזיזו את הכלי הקדמי — והכלי מאחוריו תוקף בבת אחת. שח כפול מכריע לעיתים קרובות.",
    },
    learn: {
      en: "A discovered attack unmasks a rook, bishop, or queen by moving the piece that stood in front of it.",
      he: "התקפה נגלית חושפת צריח, רץ או מלכה על ידי הזזת הכלי שחסם אותם.",
    },
    why: {
      en: "Two threats appear in one tempo. If the front piece also checks, the opponent rarely has time to save everything.",
      he: "שני איומים במסע אחד. אם הכלי הקדמי גם נותן שח, ליריב כמעט אין זמן להציל הכול.",
    },
    how: {
      en: "See which friendly piece is masked. Step the front unit off the line — preferably with a check or a second hit on the target.",
      he: "ראו איזה כלי ידידותי מוסתר. הורידו את הכלי הקדמי מהקו — עדיף עם שח או פגיעה שנייה במטרה.",
    },
    goal: {
      en: "Unmask the piece behind and win material or give a crushing check.",
      he: "חשפו את הכלי מאחור וזכו בחומר או בשח קשה.",
    },
    puzzles: [
      {
        id: "discovered-win-queen",
        fen: "4k3/4q3/8/8/8/4N3/4R3/4K3 w - - 0 1",
        title: { en: "Unmask the rook", he: "חשפו את הצריח" },
        goal: {
          en: "White to move. The rook stares at the queen — if the knight steps aside.",
          he: "לבן לנוע. הצריח מביט במלכה — אם הפרש יזוז הצידה.",
        },
        hint: {
          en: "Move the knight with tempo. A square that also attacks the queen is strongest.",
          he: "הזיזו את הפרש עם טמפו. משבצת שתוקפת גם את המלכה היא החזקה.",
        },
        success: {
          en: "Nf5! Discovered attack on the queen, and the knight hits e7 as well.",
          he: "פרש ל־f5! התקפה נגלית על המלכה, והפרש גם פוגע ב־e7.",
        },
        fail: {
          en: "Step the knight off the e-file so the rook sees the queen.",
          he: "הורידו את הפרש מטור e כדי שהצריח יראה את המלכה.",
        },
        solution: ["Nf5"],
        alts: ["Nd5", "Nc4", "Ng4", "Nc2", "Nf1", "Ng2", "Nd1"],
      },
      {
        id: "discovered-check",
        fen: "4k3/8/8/8/8/4N3/4Q3/4K3 w - - 0 1",
        title: { en: "Discovered check", he: "שח נגלה" },
        goal: {
          en: "White to move. Any knight hop off the e-file discovers check. Pick a strong one.",
          he: "לבן לנוע. כל קפיצת פרש מחוץ לטור e חושפת שח. בחרו קפיצה חזקה.",
        },
        hint: {
          en: "Nf5 covers escape squares around the king.",
          he: "פרש ל־f5 סוגר ריבועי בריחה סביב המלך.",
        },
        success: {
          en: "The queen is unmasked. Discovered check forces the king to run.",
          he: "המלכה נחשפה. שח נגלה מכריח את המלך לברוח.",
        },
        fail: {
          en: "The knight must leave the e-file so the queen checks.",
          he: "הפרש חייב לעזוב את טור e כדי שהמלכה תיתן שח.",
        },
        solution: ["Nf5"],
        alts: ["Nd5", "Nc4", "Ng4", "Nc2", "Nf1", "Ng2", "Nd1"],
      },
    ],
  },
  {
    id: "middlegame",
    track: "middlegame",
    title: { en: "Middlegame motifs", he: "מוטיבים במרכז המשחק" },
    blurb: {
      en: "Outposts, back-rank geometry, and classic sacrifices — plans, not just one-move tricks.",
      he: "מוצבים, גאומטריית שורה אחורית, והקרבות קלאסיות — תוכניות, לא רק טריקים של מסע אחד.",
    },
    learn: {
      en: "Middlegames are about plans: weak back ranks, outpost squares, and classic king-side sacrifices.",
      he: "מרכז המשחק הוא תוכניות: שורה אחורית חלשה, משבצות מוצב, והקרבות קלאסיות על המלך.",
    },
    why: {
      en: "Tactics win games, but motifs tell you where to look. The same ideas repeat in real play vs the computer.",
      he: "טקטיקה מנצחת משחקים, אבל מוטיבים אומרים איפה לחפש. אותם רעיונות חוזרים במשחק אמיתי נגד המחשב.",
    },
    how: {
      en: "Name the motif first (mate, outpost, sacrifice), then play the one move that makes that plan real.",
      he: "תנו שם למוטיב קודם (מט, מוצב, הקרבה), ואז בצעו את המסע היחיד שהופך את התוכנית למציאות.",
    },
    goal: {
      en: "Play the thematic move that defines the position.",
      he: "בצעו את המסע התמטי שמגדיר את העמדה.",
    },
    puzzles: [
      {
        id: "mid-backrank",
        fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
        title: { en: "Back-rank mate", he: "מט בשורה האחורית" },
        goal: {
          en: "White to move. The king has no luft. Finish it.",
          he: "לבן לנוע. למלך אין חלון. סיימו זאת.",
        },
        hint: {
          en: "The 8th rank is empty. A rook belongs there.",
          he: "השורה השמינית ריקה. צריח שייך לשם.",
        },
        success: {
          en: "Rb8# — the classic back-rank mate. Always leave a flight square (luft).",
          he: "צריח ל־b8 מט — מט שורה אחורית קלאסי. תמיד השאירו חלון.",
        },
        fail: {
          en: "Mate is on the back rank.",
          he: "המט בשורה האחורית.",
        },
        solution: ["Rb8#"],
      },
      {
        id: "mid-outpost",
        fen: "r2q1rk1/pp2ppbp/2n3p1/8/3P1B2/2N2N2/PP2PPPP/R2Q1RK1 w - - 0 12",
        title: { en: "Knight outpost", he: "מוצב פרש" },
        goal: {
          en: "White to move. Occupy the hole in Black's camp.",
          he: "לבן לנוע. תפסו את החור במחנה השחור.",
        },
        hint: {
          en: "d5 cannot be challenged by a black c- or e-pawn. A knight dreams of that square.",
          he: "d5 לא יכול להיות מאותגר על ידי רגלי c או e שחור. פרש חולם על המשבצת הזו.",
        },
        success: {
          en: "Nd5! An outpost knight — supported by a pawn, immune to pawn kicks.",
          he: "פרש ל־d5! מוצב — נתמך ברגלי, חסין בעיטות רגלים.",
        },
        fail: {
          en: "Plant a knight on d5, the hole in the d-file.",
          he: "שתלו פרש ב־d5, החור בטור d.",
        },
        solution: ["Nd5"],
      },
      {
        id: "mid-greek-gift",
        fen: "rnbq1rk1/pppp1ppp/8/2b1p3/8/3B1N2/PPPP1PPP/RNBQK2R w KQ - 0 5",
        title: { en: "Greek gift idea", he: "רעיון המתנה היוונית" },
        goal: {
          en: "White to move. Sacrifice on h7 to rip the king's cover.",
          he: "לבן לנוע. הקרבה ב־h7 כדי לקרוע את כיסוי המלך.",
        },
        hint: {
          en: "The bishop on c4 points at h7. Black's knight is not on f6 to defend it.",
          he: "הרץ ב־c4 מכוון ל־h7. פרש שחור אינו ב־f6 להגן.",
        },
        success: {
          en: "Bxh7+! The Greek gift — after Kxh7, Ng5+ and the queen swings to h5.",
          he: "רץ לוקח ב־h7! המתנה היוונית — אחרי המלך לוקח, פרש ל־g5 והמלכה ל־h5.",
        },
        fail: {
          en: "The sacrifice is on h7.",
          he: "ההקרבה היא ב־h7.",
        },
        solution: ["Bxh7+"],
      },
    ],
  },
  {
    id: "endgames",
    track: "endgame",
    title: { en: "Endgame basics", he: "יסודות הסיום" },
    blurb: {
      en: "Opposition, a rook mate, and escorting a pawn. Endgames are where extra material becomes a point.",
      he: "אופוזיציה, מט צריח, וליווי רגלי. בסיום חומר עודף הופך לנקודה.",
    },
    learn: {
      en: "Endgames are precise: cut the king off with a rook, take the opposition, and escort a pawn with your king.",
      he: "סיומים דורשים דיוק: חתכו את המלך בצריח, קחו אופוזיציה, וליוו רגלי עם המלך.",
    },
    why: {
      en: "A one-pawn advantage only counts if you know how to promote. Most club games are decided here.",
      he: "יתרון רגלי נספר רק אם יודעים להכתיר. רוב משחקי המועדון מוכרעים כאן.",
    },
    how: {
      en: "Do not rush the pawn. Use the king first, keep opposition, and mate on the edge when the rook can cut the file or rank.",
      he: "אל תמהרו את הרגלי. השתמשו במלך קודם, שמרו אופוזיציה, ותנו מט על הקצה כשהצריח חותך טור או שורה.",
    },
    goal: {
      en: "Play the precise endgame move.",
      he: "בצעו את המסע המדויק בסיום.",
    },
    puzzles: [
      {
        id: "end-rook-mate",
        fen: "7k/6R1/8/8/8/8/8/4K3 w - - 0 1",
        title: { en: "Rook on the edge", he: "צריח על הקצה" },
        goal: {
          en: "White to move. Mate the boxed-in king.",
          he: "לבן לנוע. מט למלך הכלוא.",
        },
        hint: {
          en: "The king is already on the edge. One rook check on the 8th rank ends it.",
          he: "המלך כבר על הקצה. שח צריח אחד בשורה השמינית מסיים.",
        },
        success: {
          en: "Rg8# — cut the king off on the edge. The rook needs the king's help in longer mates.",
          he: "צריח ל־g8 מט — חתכו את המלך על הקצה.",
        },
        fail: {
          en: "Mate is on g8.",
          he: "המט ב־g8.",
        },
        solution: ["Rg8#"],
      },
      {
        id: "end-opposition",
        fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",
        title: { en: "Take the opposition", he: "קחו אופוזיציה" },
        goal: {
          en: "White to move. Shoulder the black king and escort the pawn.",
          he: "לבן לנוע. דחקו את המלך השחור וליוו את הרגלי.",
        },
        hint: {
          en: "Step beside the pawn's file so you own the key squares (d5/f5).",
          he: "צעד לצד טור הרגלי כדי להחזיק במשבצות המפתח (d5/f5).",
        },
        success: {
          en: "Outflanking — the king seizes a key square so the pawn can march.",
          he: "איגוף — המלך תופס משבצת מפתח והרגלי יכול לצעוד.",
        },
        fail: {
          en: "Do not push the pawn yet. First take the king to d5 or f5.",
          he: "אל תדחפו את הרגלי עדיין. קודם המלך ל־d5 או f5.",
        },
        solution: ["Kd4"],
        alts: ["Kf4"],
      },
      {
        id: "end-pawn-escort",
        fen: "8/8/8/8/8/6k1/4K1P1/8 w - - 0 1",
        title: { en: "Escort the pawn", he: "ליווי הרגלי" },
        goal: {
          en: "White to move. Shoulder Black away and free the g-pawn.",
          he: "לבן לנוע. דחקו את השחור ושחררו את רגלי g.",
        },
        hint: {
          en: "Kf1 or Kf3 keeps the enemy king from sitting on the pawn.",
          he: "מלך ל־f1 או f3 מונע מהמלך היריב לשבת על הרגלי.",
        },
        success: {
          en: "The king shoulders. After that the pawn can run.",
          he: "המלך דוחק. אחר כך הרגלי יכול לרוץ.",
        },
        fail: {
          en: "Use the king first — a naked pawn push can be blocked or captured.",
          he: "השתמשו במלך קודם — דחיפת רגלי חשוף עלולה להיחסם.",
        },
        solution: ["Kf1"],
        alts: ["Kf3", "Kf2"],
      },
    ],
  },
];

export const FREE_PLAY_STAGE = {
  id: "free-computer",
  track: "play",
  title: { en: "Play vs Computer", he: "משחק נגד המחשב" },
  blurb: {
    en: "You have the motifs. Now play a full game with real rules and a thinking opponent.",
    he: "יש לכם את המוטיבים. עכשיו משחק מלא עם חוקים אמיתיים ויריב שחושב.",
  },
};

export function allPuzzles() {
  return STAGES.flatMap((stage) => stage.puzzles.map((puzzle) => ({ ...puzzle, stageId: stage.id })));
}

export function getStage(stageId) {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export function getPuzzle(stageId, puzzleId) {
  const stage = getStage(stageId);
  const puzzle = stage.puzzles.find((item) => item.id === puzzleId) ?? stage.puzzles[0];
  return { stage, puzzle };
}

export function nextPuzzle(stageId, puzzleId) {
  const stageIndex = STAGES.findIndex((stage) => stage.id === stageId);
  const stage = STAGES[Math.max(0, stageIndex)];
  const index = stage.puzzles.findIndex((item) => item.id === puzzleId);
  if (index >= 0 && index < stage.puzzles.length - 1) {
    return { stageId: stage.id, puzzleId: stage.puzzles[index + 1].id, doneStage: false, donePath: false };
  }
  const nextStage = STAGES[stageIndex + 1];
  if (nextStage) {
    return { stageId: nextStage.id, puzzleId: nextStage.puzzles[0].id, doneStage: true, donePath: false };
  }
  return { stageId: stage.id, puzzleId, doneStage: true, donePath: true };
}

export function puzzleHumanColor(fen) {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}
