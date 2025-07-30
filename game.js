// Accessible Puzzle Adventure - Sliding Puzzle

const puzzleSize = 3;
let tiles, empty, solved, audioCtx, settings = {
  highContrast: false,
  dyslexiaFont: false,
  audioCues: true,
  captions: true,
};

// UI Elements
const startBtn = document.getElementById("start-btn");
const settingsBtn = document.getElementById("settings-btn");
const storySection = document.getElementById("story");
const puzzleSection = document.getElementById("puzzle-section");
const puzzleBoard = document.getElementById("puzzle-board");
const puzzleCaption = document.getElementById("puzzle-caption");
const restartBtn = document.getElementById("restart-puzzle-btn");
const nextBtn = document.getElementById("next-story-btn");
const settingsPanel = document.getElementById("settings-panel");
const highContrast = document.getElementById("high-contrast");
const dyslexiaFont = document.getElementById("dyslexia-font");
const audioCues = document.getElementById("audio-cues");
const captions = document.getElementById("captions");
const applySettingsBtn = document.getElementById("apply-settings-btn");
const backBtn = document.getElementById("back-btn");

// Accessibility: Audio cues with optional captions
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
    default: o.frequency.value = 330;
  }
  g.gain.value = 0.11;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.16);
  if (settings.captions && captionMsg)
    announce(captionMsg);
}
let captionTimeout = null;
function announce(msg) {
  puzzleCaption.textContent = msg;
  if (captionTimeout) clearTimeout(captionTimeout);
  captionTimeout = setTimeout(() => { puzzleCaption.textContent = ""; }, 2500);
}

// Puzzle logic
function initPuzzle() {
  // Create solvable shuffled array for 3x3
  do {
    tiles = Array.from({length: puzzleSize*puzzleSize}, (_,i)=>i);
    shuffle(tiles);
  } while (!isSolvable(tiles) || isSolved(tiles));
  empty = tiles.indexOf(0);
  solved = false;
  renderPuzzle();
  announce("Puzzle started. Use arrow keys or click tiles to move.");
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
  // 3x3: count inversions
  let inv = 0;
  for(let i=0;i<arr.length;i++)
    for(let j=i+1;j<arr.length;j++)
      if(arr[i]&&arr[j]&&arr[i]>arr[j]) inv++;
  return inv%2===0;
}

function renderPuzzle() {
  puzzleBoard.innerHTML = "";
  puzzleBoard.setAttribute("aria-label","Sliding puzzle board");
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
      nextBtn.hidden = false;
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

// UI Navigation and Accessibility
startBtn.addEventListener("click", ()=>{
  document.getElementById("game-title").hidden = true;
  storySection.hidden = false;
  puzzleSection.hidden = false;
  settingsPanel.hidden = true;
  nextBtn.hidden = true;
  initPuzzle();
  puzzleBoard.focus();
});
restartBtn.addEventListener("click", initPuzzle);

nextBtn.addEventListener("click", ()=>{
  announce("To be continued… More adventure coming soon!");
  nextBtn.hidden = true;
});

settingsBtn.addEventListener("click", ()=>{
  settingsPanel.hidden = false;
  storySection.hidden = true;
  puzzleSection.hidden = true;
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
  document.getElementById("game-title").hidden = false;
  announce("Settings applied.");
});
backBtn.addEventListener("click", ()=>{
  settingsPanel.hidden = true;
  document.getElementById("game-title").hidden = false;
});

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
