/** General basketball curriculum. Fictional scenarios; no film or external AI required. */
const COACH_TRAINING_VERSION = 1;
const COACH_TRAINING_MODULES = [
  {
    "id": "offense",
    "title": "Offensive decisions",
    "description": "Create advantages, preserve spacing, and choose counters."
  },
  {
    "id": "defense",
    "title": "Defensive adjustments",
    "description": "Choose coverages and teach connected team defense."
  },
  {
    "id": "analytics",
    "title": "Basketball analytics",
    "description": "Separate evidence from noise and measure the right outcome."
  },
  {
    "id": "management",
    "title": "Game management",
    "description": "Manage clock, personnel, fouls, and late-game decisions."
  },
  {
    "id": "practice",
    "title": "Practice design",
    "description": "Turn game problems into purposeful learning."
  },
  {
    "id": "leadership",
    "title": "Coach communication",
    "description": "Make clear calls and develop players and staff."
  }
];
const COACH_TRAINING_LESSONS = [
  {
    "id": "offense-1",
    "module": "offense",
    "title": "Punish the ball-screen blitz",
    "level": "Foundation",
    "scenario": "Your point guard is being trapped above the arc. The screener is open near the foul line; both corners are occupied. Your screener can pass, but is not a strong three-point shooter. What is the best first counter?",
    "options": [
      {
        "text": "Hit the short roll and play four-on-three",
        "score": 100,
        "feedback": "The short roll uses the open passing window. Teach the screener to read the low defender: finish if nobody helps, pass to the corner if help commits."
      },
      {
        "text": "Slip the screen before contact",
        "score": 70,
        "feedback": "A well-timed slip can beat an early blitz. It still needs a clear passing window and coordinated spacing."
      },
      {
        "text": "Have the screener pop deep for threes",
        "score": 30,
        "feedback": "A pop can punish some coverages, but it does not fit this screener’s stated skill and moves away from the available advantage."
      },
      {
        "text": "Keep dribbling toward the sideline",
        "score": 0,
        "feedback": "The sideline gives the trap another defender and reduces escape angles. Move the ball before the trap closes."
      }
    ],
    "reflection": "If the low defender rotates early, where is the next pass?",
    "measure": "Track clean short-roll catches and resulting paint touches or open shots, alongside turnovers.",
    "practice": "Three-on-two advantage drill: two corner players and a short roller attack two rotating defenders; start each rep with a pass from a trapped guard."
  },
  {
    "id": "offense-2",
    "module": "offense",
    "title": "Attack a switching defense",
    "level": "Applied",
    "scenario": "The opponent switches every ball screen. Your center seals a smaller defender, but the weak-side wing keeps cutting into the lane. What should you organize first?",
    "options": [
      {
        "text": "Clear the lane and enter the seal with a safe angle",
        "score": 100,
        "feedback": "The mismatch only matters if spacing and the entry angle let you use it. Clear the help traffic, establish a seal, and read a possible double-team."
      },
      {
        "text": "Use a quick re-screen to create another advantage",
        "score": 70,
        "feedback": "A re-screen is a useful alternative if the seal cannot be entered. It can force a late switch or attack a defender’s foot angle."
      },
      {
        "text": "Force a high lob through help",
        "score": 30,
        "feedback": "The mismatch does not erase the help defender. A forced lob risks a live-ball turnover."
      },
      {
        "text": "Let each player independently choose a cut",
        "score": 0,
        "feedback": "Uncoordinated cuts crowd the advantage and make the next read harder."
      }
    ],
    "reflection": "If the opponent fronts the post and brings weak-side help, how would you move the ball?",
    "measure": "Track successful mismatch entries, help rotations, and quality of the next shot; do not count post touches alone.",
    "practice": "Four-on-four switching drill: reward an advantage created by a seal, slip, or re-screen, with a clean weak-side read."
  },
  {
    "id": "offense-3",
    "module": "offense",
    "title": "Create a zone advantage",
    "level": "Advanced",
    "scenario": "Against a compact 2–3 zone, your team passes around the perimeter without moving defenders. You have a capable high-post passer and a baseline finisher. Which adjustment best fits?",
    "options": [
      {
        "text": "Coordinate high-post catches with short-corner movement",
        "score": 100,
        "feedback": "High-post and short-corner positioning can put one zone defender between two threats. Teach the catch, turn, and read; do not park players in one spot."
      },
      {
        "text": "Reverse the ball quickly before attacking a gap",
        "score": 70,
        "feedback": "Quick reversals can shift the zone and create gaps, especially with an immediate drive or interior touch."
      },
      {
        "text": "Ask the weakest shooter to take contested threes",
        "score": 30,
        "feedback": "A zone is not a reason to settle for low-quality shots from the wrong player."
      },
      {
        "text": "Send all five players into the paint",
        "score": 0,
        "feedback": "Crowding the paint removes passing lanes and transition balance."
      }
    ],
    "reflection": "What is your counter if the middle defender takes away the high-post catch?",
    "measure": "Track interior catches that create an advantage, open catch-and-shoot opportunities, and transition turnovers.",
    "practice": "Five-on-five zone possession game: an interior catch is a learning constraint, not an automatic reason to force a pass."
  },
  {
    "id": "defense-1",
    "module": "defense",
    "title": "Pick a ball-screen coverage",
    "level": "Foundation",
    "scenario": "A guard is dangerous pulling up from three but rarely finishes through contact. Your center moves well laterally. The screener is not a shooting threat. Which coverage is a reasonable first adjustment?",
    "options": [
      {
        "text": "Bring the center to the screen level with a recovery plan",
        "score": 100,
        "feedback": "Meeting the ball nearer the screen reduces the immediate pull-up. Define the guard’s route, the center’s recovery, and the low helper before changing coverage."
      },
      {
        "text": "Switch selectively with a clear rebounding plan",
        "score": 70,
        "feedback": "Selective switching can fit the mobile center, but you must assess isolation defense and finish the possession with a rebound."
      },
      {
        "text": "Play deep drop on every screen regardless of location",
        "score": 30,
        "feedback": "Deep drop repeatedly concedes the stated strength unless another constraint justifies it."
      },
      {
        "text": "Double without assigning a low rotation",
        "score": 0,
        "feedback": "A double needs connected rotations. Otherwise the short roll becomes an uncontested four-on-three."
      }
    ],
    "reflection": "What changes if the screener starts popping and making open threes?",
    "measure": "Track pull-up quality, paint entries, short-roll outcomes, fouls, and defensive rebounds rather than makes alone.",
    "practice": "Three-on-three ball-screen drill with a low helper: vary the ball handler’s decision and score both the initial coverage and recovery."
  },
  {
    "id": "defense-2",
    "module": "defense",
    "title": "Repair transition defense",
    "level": "Applied",
    "scenario": "Your last six defensive possessions included four transition layups. Two followed live-ball turnovers; two followed missed corner shots. What is the most useful immediate adjustment?",
    "options": [
      {
        "text": "Define floor balance and stop-ball responsibilities",
        "score": 100,
        "feedback": "Assign who protects the basket, who stops the ball, and who matches threats. Address turnover decisions and shot-location responsibilities too."
      },
      {
        "text": "Reduce offensive rebounding commitments temporarily",
        "score": 70,
        "feedback": "Sending fewer players to the glass may help, but weigh the lost rebounding opportunities and define the actual get-back roles."
      },
      {
        "text": "Blame the center for every transition basket",
        "score": 30,
        "feedback": "Transition is a five-player task; blame does not specify a correctable behavior."
      },
      {
        "text": "Switch half-court defenses without changing transition roles",
        "score": 0,
        "feedback": "A new half-court scheme cannot solve possessions that never reach a set defense."
      }
    ],
    "reflection": "Who is responsible for balance when a guard drives below the baseline?",
    "measure": "Separate transition chances after live-ball turnovers and misses; track numbers advantages and first-contact location.",
    "practice": "Continuous advantage transition drill: start two-on-one, add trailing players, and teach early communication and protection of the rim."
  },
  {
    "id": "defense-3",
    "module": "defense",
    "title": "Finish the stop",
    "level": "Advanced",
    "scenario": "You held the opponent to 7-for-20 shooting, but they collected eight offensive rebounds on 13 misses. Your staff wants a completely new defense. What should you prioritize?",
    "options": [
      {
        "text": "Teach contact, pursuit, and team rebounding assignments",
        "score": 100,
        "feedback": "A defended miss is not a finished possession. Address finding a body, legal contact, pursuit, and guards helping secure the ball."
      },
      {
        "text": "Review whether your current rotations cause bad rebounding matchups",
        "score": 70,
        "feedback": "Scheme can affect rebounding position. Review the actual misses and rotations before deciding whether technique or structure needs changing."
      },
      {
        "text": "Judge the defense only by opponent shooting percentage",
        "score": 30,
        "feedback": "Shooting percentage ignores the extra possessions created by offensive rebounds."
      },
      {
        "text": "Tell players to jump higher without reviewing positioning",
        "score": 0,
        "feedback": "Effort cues alone do not teach positioning or shared responsibility."
      }
    ],
    "reflection": "How would your rebounding assignments change when the center contests away from the rim?",
    "measure": "Opponent offensive rebound rate is 8/13, about 62% in this sample. Treat it as a warning, then examine chances and matchups.",
    "practice": "Live shot-and-rebound drill: a stop counts only after possession is secured; rotate who contests and who covers the rim."
  },
  {
    "id": "analytics-1",
    "module": "analytics",
    "title": "Compare equal opportunities",
    "level": "Foundation",
    "scenario": "Player A scored 18 points over 20 used possessions. Player B scored 12 over 10. These are fictional, consistently defined possession counts. Which conclusion is supported?",
    "options": [
      {
        "text": "B scored more efficiently in this sample; context still matters",
        "score": 100,
        "feedback": "A produced 0.90 points per used possession; B produced 1.20. That describes this sample, not a complete player ranking."
      },
      {
        "text": "Compare their role, opponent, and shot quality before a lineup decision",
        "score": 70,
        "feedback": "Context is essential for decisions, though you can still calculate the descriptive efficiency from the supplied counts."
      },
      {
        "text": "A was more efficient because 18 exceeds 12",
        "score": 30,
        "feedback": "Total points reflect both volume and efficiency. Compare equal opportunity units."
      },
      {
        "text": "B must always play twice as many minutes",
        "score": 0,
        "feedback": "A small efficiency sample does not establish how performance scales with a different role or workload."
      }
    ],
    "reflection": "What extra information would you request before changing the rotation?",
    "measure": "Use points per consistently defined possession, sample size, role, shot quality, turnovers, and opponent strength.",
    "practice": "Staff exercise: compare two fictional player lines, write one supported statement and one conclusion the data cannot support."
  },
  {
    "id": "analytics-2",
    "module": "analytics",
    "title": "Do not overreact to six shots",
    "level": "Applied",
    "scenario": "Your team went 1-for-6 on open catch-and-shoot threes this quarter. All six came from established shooters. A coach wants to ban threes. What is the best response?",
    "options": [
      {
        "text": "Review shot quality and maintain good process while gathering more evidence",
        "score": 100,
        "feedback": "Six shots are a noisy sample. Keep appropriate shots while checking whether the attempts meet your actual shot-quality standard."
      },
      {
        "text": "Check fatigue, spacing, and who took each shot",
        "score": 70,
        "feedback": "Useful context can reveal a real process problem without treating a short shooting run as proof."
      },
      {
        "text": "Ban all threes based on the six attempts",
        "score": 30,
        "feedback": "A short result streak does not establish that the underlying shot selection is poor."
      },
      {
        "text": "Assume every open three is optimal in every situation",
        "score": 0,
        "feedback": "Clock, score, range, shooter skill, and rebounding balance still matter."
      }
    ],
    "reflection": "When would an open three be the wrong decision?",
    "measure": "Track shooter, location, contest level, clock context, and longer-run outcomes. Keep sample size visible.",
    "practice": "Practice decision drill: players choose shoot, drive, or pass from varied closeouts and game-clock constraints."
  },
  {
    "id": "analytics-3",
    "module": "analytics",
    "title": "Turn data into an experiment",
    "level": "Advanced",
    "scenario": "In 12 charted half-court possessions, your offense scored 14 points with a paint touch. In 10 without one, it scored 6. What should the staff conclude?",
    "options": [
      {
        "text": "Paint touches are associated with better results here; test how to create useful ones",
        "score": 100,
        "feedback": "The rates are about 1.17 and 0.60 points per possession. This is an association; personnel, defense, transition classification, and shot quality may differ."
      },
      {
        "text": "Use a practice constraint to explore penetration and kick-outs",
        "score": 70,
        "feedback": "A focused practice constraint can test the hypothesis, provided players still learn when to use the advantage rather than force entry."
      },
      {
        "text": "Every possession must include a forced paint touch",
        "score": 30,
        "feedback": "A process metric is a tool, not a mandate to ignore an available open shot or force a turnover."
      },
      {
        "text": "Paint touches caused the entire difference with certainty",
        "score": 0,
        "feedback": "Observational counts alone do not establish causation."
      }
    ],
    "reflection": "How would you design a fair comparison over the next few games?",
    "measure": "Define paint touch consistently; compare shot quality, turnovers, opponent, and lineup along with points per possession.",
    "practice": "Small-sided advantage games: compare unrestricted play with a drive-and-kick emphasis, then discuss decisions rather than only final scores."
  },
  {
    "id": "management-1",
    "module": "management",
    "title": "Up three at the end",
    "level": "Foundation",
    "scenario": "You lead by three with eight seconds left. The opponent inbounds in the backcourt. For this exercise, assume a foul before a shot would award two free throws and no possession. What is the safest first coaching action?",
    "options": [
      {
        "text": "Communicate a chosen foul-or-defend plan, timing, and shot recognition",
        "score": 100,
        "feedback": "Fouling and defending both have tradeoffs. A plan needs timing, who executes it, no shooting foul, and rebound/inbound responsibilities. Verify your actual competition rules."
      },
      {
        "text": "Defend the arc and avoid unnecessary fouls with clear assignments",
        "score": 70,
        "feedback": "Defending can be sound if players know the coverage and avoid a three-point shooting foul. Personnel and inbound location matter."
      },
      {
        "text": "Order a foul after the shooter starts the shooting motion",
        "score": 30,
        "feedback": "A shooting foul can award three free throws or a four-point play; it undermines the intended strategy."
      },
      {
        "text": "Give no instructions because any strategy guarantees a win",
        "score": 0,
        "feedback": "No choice guarantees the outcome. Clear execution matters more than a slogan."
      }
    ],
    "reflection": "What would change if the opponent had the ball in the frontcourt with two seconds left?",
    "measure": "Review execution, shot quality conceded, fouls, rebounds, and inbound security, not just whether the opponent happened to miss.",
    "practice": "Run both late-game plans at realistic speed under your competition rules, including missed free throws and subsequent inbounds."
  },
  {
    "id": "management-2",
    "module": "management",
    "title": "Protect a player in foul trouble",
    "level": "Applied",
    "scenario": "Your best interior defender has four fouls with seven minutes remaining. The backup struggles against ball screens. The game is tied. What should guide the decision?",
    "options": [
      {
        "text": "Balance matchup, remaining time, and a specific foul-management plan",
        "score": 100,
        "feedback": "Weigh how the player can defend effectively without avoidable fouls, the backup’s limitations, and the cost of losing the player later. Rules and foul limits vary."
      },
      {
        "text": "Use short substitutions to protect the player during selected matchups",
        "score": 70,
        "feedback": "Selective substitutions can help when dead balls and matchups permit, but they require clear communication and a plan for the backup."
      },
      {
        "text": "Bench the player for the rest of the game automatically",
        "score": 30,
        "feedback": "An automatic rule ignores time, score, matchups, and actual foul risk."
      },
      {
        "text": "Tell the player to stop defending entirely",
        "score": 0,
        "feedback": "Removing defensive engagement gives up the advantage you are trying to preserve."
      }
    ],
    "reflection": "Which fouls are avoidable, and which coverage could reduce exposure without conceding the rim?",
    "measure": "Track foul type and matchup rather than treating all fouls as identical; inspect the possessions during substitutions.",
    "practice": "Verticality and containment drill: score legal contests, early positioning, and disciplined recovery."
  },
  {
    "id": "management-3",
    "module": "management",
    "title": "Build the final possession",
    "level": "Advanced",
    "scenario": "Down two, 18 seconds remain and your team has possession. Assume no shot-clock pressure and one timeout remains. The defense denies your best scorer. What is a sound plan?",
    "options": [
      {
        "text": "Create a quick quality chance with a second option and rebound/defense plan",
        "score": 100,
        "feedback": "A quick quality look can leave time for an offensive rebound, foul, or another possession. Build a counter to denial and know when to stop forcing the first option."
      },
      {
        "text": "Use the timeout if the team cannot organize or advance the intended action",
        "score": 70,
        "feedback": "A timeout can organize the possession; its value depends on rules, inbound location, player understanding, and whether a good advantage already exists."
      },
      {
        "text": "Hold until the final second regardless of the shot available",
        "score": 30,
        "feedback": "Waiting removes recovery options and may produce a rushed low-quality attempt."
      },
      {
        "text": "Force a contested three because only the star may shoot",
        "score": 0,
        "feedback": "Down two does not require a three, and denial can create an advantage for another player."
      }
    ],
    "reflection": "How would your plan change if you were down three rather than two?",
    "measure": "Review time to first advantage, shot quality, clock remaining after the shot, and transition/foul responsibilities.",
    "practice": "Run 18-second end-game possessions with different score margins and denial rules; review the decision sequence."
  },
  {
    "id": "practice-1",
    "module": "practice",
    "title": "Transfer a skill to games",
    "level": "Foundation",
    "scenario": "Players execute a passing pattern flawlessly without defenders but turn it over against pressure. Which practice change best targets the gap?",
    "options": [
      {
        "text": "Add live defenders and representative passing decisions",
        "score": 100,
        "feedback": "Players need to perceive pressure, identify a window, and execute under realistic constraints. Keep difficulty appropriate and provide focused feedback."
      },
      {
        "text": "Progress from guided pressure to a live advantage game",
        "score": 70,
        "feedback": "Guided pressure is a useful bridge to live play, especially when players need to recognize one cue at a time."
      },
      {
        "text": "Repeat only the same unopposed pattern faster",
        "score": 30,
        "feedback": "Speed without perception does not teach which pass is available."
      },
      {
        "text": "Punish every turnover without teaching a read",
        "score": 0,
        "feedback": "Fear of errors can discourage useful decisions while leaving the skill gap unchanged."
      }
    ],
    "reflection": "What constraint would help beginners without removing the decision?",
    "measure": "Track turnovers by cause: read, spacing, timing, or execution. Reward appropriate decisions even when execution is still developing.",
    "practice": "Three-on-three keep-away into a scoring advantage: vary defender pressure and let players choose the available outlet."
  },
  {
    "id": "practice-2",
    "module": "practice",
    "title": "Plan for a limited roster",
    "level": "Applied",
    "scenario": "Six players are available for a 45-minute practice. Tomorrow you face aggressive closeouts. Which plan is most useful?",
    "options": [
      {
        "text": "Use repeated three-on-three closeout decisions with recovery breaks",
        "score": 100,
        "feedback": "Three-on-three creates repeated shoot-drive-pass reads, spacing decisions, and help rotations with the available roster. Manage work-to-rest and intensity."
      },
      {
        "text": "Combine partner skill work with two-on-two advantage games",
        "score": 70,
        "feedback": "A good alternative when skill level requires more guided repetitions, provided the session returns to live decisions."
      },
      {
        "text": "Spend the entire practice in a five-on-zero offense pattern",
        "score": 30,
        "feedback": "A full-team pattern with a missing player may be useful briefly, but does not directly train the target problem."
      },
      {
        "text": "Run conditioning until players are too fatigued to make decisions",
        "score": 0,
        "feedback": "Fatigue can be a deliberate constraint in small doses; exhaustion is not the learning objective."
      }
    ],
    "reflection": "How would you adjust the challenge for mixed experience levels?",
    "measure": "Track correct closeout reads and quality shots created, plus workload and recovery. Judge the session by its stated goal.",
    "practice": "Five-minute warmup, ten-minute guided reads, twenty-minute live games with breaks, five-minute game-context segment, five-minute reflection."
  },
  {
    "id": "practice-3",
    "module": "practice",
    "title": "Teach with useful feedback",
    "level": "Advanced",
    "scenario": "A young guard misses the weak-side pass on three consecutive drives. Which feedback best supports learning?",
    "options": [
      {
        "text": "Ask what they saw, give one cue, and replay the decision",
        "score": 100,
        "feedback": "Diagnose the perception first. One cue such as “see the low helper before the second dribble” gives the player a usable next action."
      },
      {
        "text": "Pause briefly to demonstrate the helper’s movement",
        "score": 70,
        "feedback": "A short demonstration can help, especially when immediately followed by a chance to apply the read."
      },
      {
        "text": "List every mistake in the player’s game at once",
        "score": 30,
        "feedback": "Too many instructions overload attention and obscure the current learning goal."
      },
      {
        "text": "Replace the player permanently without explaining the read",
        "score": 0,
        "feedback": "A substitution may sometimes be needed in a game, but unexplained removal does not teach the decision."
      }
    ],
    "reflection": "How would you know whether the player understood rather than simply repeated your words?",
    "measure": "Look for recognition of the helper and the appropriate next pass across varied repetitions, not a memorized response alone.",
    "practice": "Drive-and-kick drill with changing help: player explains the cue, then applies it against an unpredictable defender."
  },
  {
    "id": "leadership-1",
    "module": "leadership",
    "title": "Make a usable timeout",
    "level": "Foundation",
    "scenario": "Your team gave up two backdoor cuts and looks overwhelmed. You have a short timeout. What is the best message?",
    "options": [
      {
        "text": "Give one defensive correction, assign roles, and confirm understanding",
        "score": 100,
        "feedback": "A concise cue, named responsibilities, and a quick check of understanding help players execute the next possession."
      },
      {
        "text": "Use one brief question to identify what players are seeing",
        "score": 70,
        "feedback": "A focused question can reveal confusion, but leave enough time to give a concrete next action."
      },
      {
        "text": "Deliver six unrelated corrections without priorities",
        "score": 30,
        "feedback": "Information overload makes it harder to remember and coordinate the immediate adjustment."
      },
      {
        "text": "Spend the timeout blaming one player",
        "score": 0,
        "feedback": "Public blame can shut down communication and does not teach the shared defensive solution."
      }
    ],
    "reflection": "What exact sentence would you use to stop the next backdoor cut?",
    "measure": "Check whether players execute the communicated cue on the next possessions, rather than judging the speech by volume or emotion.",
    "practice": "Staff rehearsal: deliver a 20-second timeout message, then have another coach repeat the assigned roles."
  },
  {
    "id": "leadership-2",
    "module": "leadership",
    "title": "Disagree productively on staff",
    "level": "Applied",
    "scenario": "An assistant believes switching will solve the opponent’s ball screens; you prefer showing and recovering. What is the most useful staff response?",
    "options": [
      {
        "text": "Compare constraints, choose a trial, and define what would change your mind",
        "score": 100,
        "feedback": "Use personnel, opponent strengths, rotations, and rebounding requirements to choose a testable plan. Agree on a review point and communicate one clear call."
      },
      {
        "text": "Assign the assistant to chart the specific outcomes in question",
        "score": 70,
        "feedback": "Targeted charting can improve the discussion if the staff agrees on definitions and what evidence is useful."
      },
      {
        "text": "Dismiss the idea because disagreement is disloyal",
        "score": 30,
        "feedback": "Suppressing informed disagreement removes a source of useful information."
      },
      {
        "text": "Change coverage every possession without telling players",
        "score": 0,
        "feedback": "Uncommunicated changes create confusion and make outcomes difficult to interpret."
      }
    ],
    "reflection": "Which two outcomes would you track to compare the coverages fairly?",
    "measure": "Chart shot quality, short-roll advantages, mismatches, fouls, and rebounds with possession context and sample size.",
    "practice": "Staff meeting exercise: each coach states a hypothesis, its risks, and the observation that would justify an adjustment."
  },
  {
    "id": "leadership-3",
    "module": "leadership",
    "title": "Respond to a player mistake",
    "level": "Advanced",
    "scenario": "A player makes a late turnover, then says they are afraid to make the next pass. What response best balances accountability and confidence?",
    "options": [
      {
        "text": "Separate the decision from execution and give a clear next-job cue",
        "score": 100,
        "feedback": "Review what happened without turning an error into an identity. Name the correction and a specific next responsibility; retain accountability for preparation and effort."
      },
      {
        "text": "Ask the player to describe the read and rehearse a better option",
        "score": 70,
        "feedback": "Guided reflection and a short rehearsal can build understanding, provided the player has time and emotional space to use it."
      },
      {
        "text": "Promise they will never turn it over again",
        "score": 30,
        "feedback": "An impossible promise does not build realistic confidence or a learning plan."
      },
      {
        "text": "Label them as a bad decision-maker in front of teammates",
        "score": 0,
        "feedback": "An identity label undermines trust and gives no useful corrective action."
      }
    ],
    "reflection": "What would you say if the read was correct but the pass execution failed?",
    "measure": "Track whether the player recognizes the cue and attempts the appropriate decision on later opportunities; avoid ranking confidence by one outcome.",
    "practice": "Role-play a 30-second player conversation, then practice the same decision with varying defensive pressure."
  }
];

function requireCoachTrainingAccess_() {
  const access = getCurrentStaffAccess_();
  if (access.configured && access.role === "Unassigned") throw new Error("Coach Training is available to registered staff.");
  const email = String(Session.getActiveUser().getEmail() || "").trim();
  if (!email) throw new Error("Sign in with your staff Google account to save private training progress.");
  return access;
}

function coachTrainingKey_(lessonId) {
  return "coach-training-v1:" + SpreadsheetApp.getActive().getId() + ":" + lessonId;
}

function readCoachTrainingProgress_() {
  const properties = PropertiesService.getUserProperties();
  const progress = {};
  COACH_TRAINING_LESSONS.forEach(function(lesson) {
    const raw = properties.getProperty(coachTrainingKey_(lesson.id));
    if (!raw) return;
    try { progress[lesson.id] = JSON.parse(raw); } catch (error) { /* Ignore an unreadable local record. */ }
  });
  return progress;
}

function getCoachTrainingWorkspace() {
  requireCoachTrainingAccess_();
  return {
    version:COACH_TRAINING_VERSION,
    modules:COACH_TRAINING_MODULES,
    lessons:COACH_TRAINING_LESSONS.map(function(lesson) {
      return {id:lesson.id,module:lesson.module,title:lesson.title,level:lesson.level};
    }),
    progress:readCoachTrainingProgress_()
  };
}

function getCoachTrainingLesson(lessonId) {
  requireCoachTrainingAccess_();
  const lesson = COACH_TRAINING_LESSONS.find(function(item) { return item.id === lessonId; });
  if (!lesson) throw new Error("Choose a valid training challenge.");
  const options = lesson.options.map(function(option,index) { return {id:index,text:option.text}; });
  for (let i=options.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1)), item=options[i]; options[i]=options[j]; options[j]=item;
  }
  return {id:lesson.id,module:lesson.module,title:lesson.title,level:lesson.level,scenario:lesson.scenario,options:options,reflection:lesson.reflection};
}

function submitCoachTrainingAttempt(data) {
  requireCoachTrainingAccess_();
  data = data || {};
  const lesson = COACH_TRAINING_LESSONS.find(function(item) { return item.id === data.lessonId; });
  if (!lesson || !Number.isInteger(data.choice) || !lesson.options[data.choice]) throw new Error("Choose a valid answer.");
  const reasoning = String(data.reasoning || "").trim();
  if (reasoning.length < 20 || reasoning.length > 1200) throw new Error("Explain your decision in 20–1200 characters.");
  const attemptId = String(data.attemptId || "");
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(attemptId)) throw new Error("Reload this challenge and try again.");
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const properties = PropertiesService.getUserProperties(), key = coachTrainingKey_(lesson.id);
    let previous = {};
    try { previous = JSON.parse(properties.getProperty(key) || "{}"); } catch(error) {}
    if (previous.attemptId === attemptId) return coachTrainingFeedback_(lesson,previous);
    const record = {attemptId:attemptId,choice:data.choice,latestScore:lesson.options[data.choice].score,
      bestScore:Math.max(Number(previous.bestScore || 0),lesson.options[data.choice].score),
      attempts:Math.min(Number(previous.attempts || 0)+1,9999),reasoning:reasoning,updatedAt:new Date().toISOString()};
    properties.setProperty(key,JSON.stringify(record));
    return coachTrainingFeedback_(lesson,record);
  } finally { lock.releaseLock(); }
}

function coachTrainingFeedback_(lesson,record) {
  return {lessonId:lesson.id,progress:record,feedback:lesson.options[record.choice].feedback,
    options:lesson.options,reflection:lesson.reflection,measure:lesson.measure,practice:lesson.practice};
}
