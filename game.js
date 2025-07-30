// Accessible Puzzle Adventure - UI/UX Enhanced Multi-Level

// -- Shared State & Settings --
let settings = {
  highContrast: false,
  dyslexiaFont: false,
  audioCues: true,
  captions: true,
};
let audioCtx, captionTimeout = null;

// --- DOM Elements ---
const startBtn = document.getElementById("start-btn");
const settingsBtn = document.getElementById("settings-btn");
const storySection = document.getElementById("story");
const levelSelect = document.getElementById("level-select");
const puzzleSection = document.getElementById("puzzle-section");
const simonSection = document.getElementById("simon-section");
const adventureComplete = document.getElementById("adventure-complete");

// Level 1: Sliding Puzzle
const puzzleBoard = document.getElementById("puzzle-board");
const puzzleCaption = document.getElementById("puzzle-caption");
const restartPuzzleBtn = document.getElementById("restart-puzzle-btn");
const skipPuzzleBtn = document.getElementById("skip-puzzle-btn");
const puzzle1Complete = document.getElementById("puzzle1-complete");
const continueToLevel2 = document.getElementById("continue-to-level2");

// Level 2: Simon/Memory
const simonBoard = document.getElementById("simon-board");
const simonCaption = document.getElementById("simon-caption");
const restartSimonBtn = document.getElementById("restart-simon-btn");
const skipSimonBtn = document.getElementById("skip-simon-btn");
const simonComplete = document.getElementById("simon-complete");
const finishAdventure = document.getElementById("finish-adventure");

// Settings
const settingsPanel = document.getElementById("settings-panel");
const highContrast = document.getElementById("high-contrast");
const dyslexiaFont = document.getElementById("dyslexia-font");
const audioCues = document.getElementById("audio-cues");
const captions = document.getElementById("captions");
const applySettingsBtn = document.getElementById("apply-settings-btn");
const backBtn = document.getElementById("back-btn");

// Navigation
const level1Btn = document.getElementById("level1-btn");
const level2Btn = document.getElementById("level2-btn");
const backToStory = document.getElementById("back-to-story");
const restartAdventure = document.getElementById("restart-adventure");

// --- Accessible Audio ---
function playSound(type, captionMsg) {
  if (!settings.audioCues) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "triangle";
  switch(type) {
    case "move": o.frequency.value = 440; break;
    case "invalid": o.frequency.value = 220; break;
    case "win": o.frequency.value = 660; break;
    case "pattern": o.frequency.value = 540; break;
    default: o.frequency.value = 330;
  }
  g.gain.value = 0.12;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.14);
  if (settings.captions && captionMsg)
    announce(captionMsg);
}
function announce(msg, el=puzzleCaption) {
  el.textContent = msg;
  if (captionTimeout) clearTimeout(captionTimeout);
  captionTimeout = setTimeout(() => { el.textContent = ""; }, 2300);
}

// --- Level Navigation ---
function showSection(section) {
  // Hide all main sections
  [storySection, levelSelect, puzzleSection, simonSection, adventureComplete].forEach(s=>s.hidden=true);
  section.hidden = false;
}
function resetAdventure() {
  showSection(storySection);
  document.getElementById("game-title").hidden = false;
  puzzle1Complete.hidden = true;
  simonComplete.hidden = true;
}
startBtn.addEventListener("click", () => {
  showSection(storySection);
  document.getElementById("game-title").hidden = true;
  setTimeout(() => { showSection(levelSelect); }, 1300);
});
settingsBtn.addEventListener("click", () => {
  settingsPanel.hidden = false;
  [storySection, levelSelect, puzzleSection, simonSection, adventureComplete].forEach(s=>s.hidden=true);
  highContrast.checked = settings.highContrast;
  dyslexiaFont.checked = settings.dyslexiaFont;
  audioCues.checked = settings.audioCues;
  captions.checked = settings.captions;
  settingsPanel.querySelector("form").elements[0].focus();
});
applySettingsBtn.addEventListener("click", ()=>{
  settings.highContrast = highContrast.checked;
  settings.dyslexiaFont = dyslexiaFont.checked;
  settings.audioCues = audioCues.checked;
  settings.captions = captions.checked;
  document.documentElement.classList.toggle("high-contrast", settings.highContrast);
  document.documentElement.classList.toggle("dyslexia-font", settings.dyslexiaFont);
  settingsPanel.hidden = true;
  showSection(levelSelect);
  announce("Settings applied.");
});
backBtn.addEventListener("click", ()=>{
  settingsPanel.hidden = true;
  showSection(levelSelect);
});
level1Btn.addEventListener("click", ()=>{
  showSection(puzzleSection);
  puzzle1Complete.hidden = true;
  initPuzzle();
});
level2Btn.addEventListener("click", ()=>{
  showSection(simonSection);
  simonComplete.hidden = true;
  startSimon();
});
backToStory.addEventListener("click", ()=>{
  showSection(storySection);
});

// --- Level 1: Sliding Puzzle ---
const puzzleSize = 3;
let tiles, empty, solved;
function initPuzzle() {
  do {
    tiles = Array.from({length: puzzleSize*puzzleSize}, (_,i)=>i);
    shuffle(tiles);
  } while (!isSolvable(tiles) || isSolved(tiles));
  empty = tiles.indexOf(0);
  solved = false;
  renderPuzzle();
  announce("Puzzle started. Use arrow keys or tap tiles to move.");
  playSound("move", "Puzzle started.");
}
function shuffle(arr) {
  for(let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function isSolved(arr) {
  return arr.every((v,i)=>v===((i)%arr.length));
}
function isSolvable(arr) {
  let inv = 0;
  for(let i=0;i<arr.length;i++)
    for(let j=i+1;j<arr.length;j++)
      if(arr[i]&&arr[j]&&arr[i]>arr[j]) inv++;
  return inv%2===0;
}
function renderPuzzle() {
  puzzleBoard.innerHTML = "";
  tiles.forEach((val, idx) => {
    const tile = document.createElement("button");
    tile.className = "puzzle-tile" + (val===0 ? " empty" : "");
    tile.setAttribute("tabindex", val===0 ? "-1" : "0");
    tile.setAttribute("aria-label", val===0 ? "Empty space" : "Tile "+val);
    if (val !== 0) tile.textContent = val;
    tile.addEventListener("click", ()=>tryMove(idx));
    tile.addEventListener("keydown", e => {
      if (["Enter"," "].includes(e.key)) tryMove(idx);
    });
    if (solved) tile.classList.add("win");
    puzzleBoard.appendChild(tile);
  });
}
function tryMove(idx) {
  if (solved) return;
  if (isAdjacent(idx, empty)) {
    [tiles[idx], tiles[empty]] = [tiles[empty], tiles[idx]];
    empty = idx;
    renderPuzzle();
    playSound("move", "Moved tile.");
    if (isSolved(tiles)) {
      solved = true;
      renderPuzzle();
      playSound("win", "Puzzle complete! Well done.");
      announce("Puzzle complete! Well done.");
      puzzle1Complete.hidden = false; // <-- ensure this line is present
    }
  } else {
    playSound("invalid", "Invalid move.");
    announce("Invalid move.");
  }
}
function isAdjacent(a, b) {
  const x1 = a%puzzleSize, y1 = Math.floor(a/puzzleSize);
  const x2 = b%puzzleSize, y2 = Math.floor(b/puzzleSize);
  return (Math.abs(x1-x2)+Math.abs(y1-y2))===1;
}
restartPuzzleBtn.addEventListener("click", initPuzzle);
skipPuzzleBtn.addEventListener("click", ()=>{
  playSound("invalid", "Puzzle skipped.");
  puzzle1Complete.hidden = false;
  announce("Puzzle skipped.");
});
continueToLevel2.addEventListener("click", ()=>{
  showSection(storySection);
  document.getElementById("story-text").innerHTML = "<strong>Chapter 2:</strong> The chamber glows. To proceed, repeat the glowing pattern!";
  setTimeout(()=>showSection(levelSelect), 1300);
});

// --- Level 2: Simon/Memory Pattern ---
const SIMON_COLORS = [
  {name:"blue",   hex:"#2c6ed5", key:"B", label:"Blue"},
  {name:"red",    hex:"#d82c2c", key:"R", label:"Red"},
  {name:"yellow", hex:"#f2d32d", key:"Y", label:"Yellow"},
  {name:"green",  hex:"#4bb543", key:"G", label:"Green"},
];
let simonPattern = [], simonUser = [], simonTurn = false, simonStep = 0;
function startSimon() {
  simonPattern = [];
  simonUser = [];
  simonTurn = false;
  simonStep = 0;
  simonBoard.innerHTML = "";
  SIMON_COLORS.forEach((col,i) => {
    const btn = document.createElement("button");
    btn.className = "simon-btn";
    btn.style.background = col.hex;
    btn.setAttribute("aria-label", col.label);
    btn.setAttribute("tabindex", "0");
    btn.innerHTML = `<span aria-hidden="true">${col.label[0]}</span>`;
    btn.addEventListener("click", ()=>simonInput(i));
    btn.addEventListener("keydown", e=>{
      if (["Enter"," "].includes(e.key)) simonInput(i);
    });
    simonBoard.appendChild(btn);
  });
  simonCaption.textContent = "Watch the pattern, then repeat it!";
  playSimonPattern();
}
function playSimonPattern() {
  simonTurn = false;
  simonUser = [];
  simonStep++;
  simonPattern.push(Math.floor(Math.random()*4));
  let i = 0;
  function flashNext() {
    if (i < simonPattern.length) {
      simonFlash(simonPattern[i]);
      i++;
      setTimeout(flashNext, 600);
    } else {
      simonTurn = true;
      simonCaption.textContent = "Your turn! Repeat the pattern.";
    }
  }
  setTimeout(flashNext, 900);
}
function simonFlash(idx) {
  const btn = simonBoard.children[idx];
  btn.classList.add("active");
  playSound("pattern", SIMON_COLORS[idx].label+"!");
  setTimeout(()=>btn.classList.remove("active"), 400);
}
function simonInput(idx) {
  if (!simonTurn) return;
  simonUser.push(idx);
  simonFlash(idx);
  const correct = simonUser.every((v,i)=>v===simonPattern[i]);
  if (!correct) {
    simonCaption.textContent = "Oops! That's not correct. Try again.";
    playSound("invalid", "Wrong pattern.");
    setTimeout(startSimon, 1300);
    return;
  }
  if (simonUser.length === simonPattern.length) {
    if (simonPattern.length >= 5) {
      simonCaption.textContent = "You did it! Great memory!";
      playSound("win", "Pattern complete!");
      simonComplete.hidden = false;
      return;
    }
    simonCaption.textContent = "Good! Next round...";
    playSimonPattern();
  }
}
restartSimonBtn.addEventListener("click", startSimon);
skipSimonBtn.addEventListener("click", ()=>{
  playSound("invalid", "Pattern skipped.");
  simonComplete.hidden = false;
  announce("Pattern skipped.", simonCaption);
});
finishAdventure.addEventListener("click", ()=>{
  showSection(adventureComplete);
});
restartAdventure.addEventListener("click", ()=>{
  document.getElementById("story-text").innerHTML = "<strong>Chapter 1:</strong> You arrive at the ancient temple. To open the door, solve the sliding puzzle.";
  resetAdventure();
  showSection(levelSelect);
});

// Keyboard navigation for puzzles
puzzleBoard.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key) && !solved) {
    let row = Math.floor(empty/puzzleSize), col = empty%puzzleSize;
    let target = null;
    if (e.key==="ArrowUp" && row < puzzleSize-1) target = empty + puzzleSize;
    if (e.key==="ArrowDown" && row > 0) target = empty - puzzleSize;
    if (e.key==="ArrowLeft" && col < puzzleSize-1) target = empty + 1;
    if (e.key==="ArrowRight" && col > 0) target = empty - 1;
    if (target !== null) tryMove(target);
    e.preventDefault();
  }
});

// Accessibility: focus trapping in settings
settingsPanel.addEventListener("keydown", function(e) {
  if (e.key === "Tab") {
    const focusable = settingsPanel.querySelectorAll("input, button");
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Load OpenDyslexic font for dyslexia mode
(function loadFont() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.6/open-dyslexic.min.css';
  document.head.appendChild(link);
})();

document.addEventListener("DOMContentLoaded", resetAdventure);
