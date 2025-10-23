// Minimal script: wait for DOM ready and log a message so blank pages don't fail silently
document.addEventListener('DOMContentLoaded', function () {
	const hero = document.querySelector('.hero');
	if (!hero) {
		console.warn('No .hero element found');
		return;
	}

	/* ---------------- Tab switching for games ---------------- */
	const tabs = document.querySelectorAll('.game-tabs .tab');
	const panels = document.querySelectorAll('.tab-panel');
	tabs.forEach(t => t.addEventListener('click', ()=>{
		tabs.forEach(x=>x.classList.remove('active'));
		panels.forEach(p=>p.style.display='none');
		t.classList.add('active');
		document.getElementById(t.dataset.tab).style.display='block';
	}));

	/* ---------------- Sudoku (simple generator + solver) ---------------- */

	function makeEmptySudoku(){ return Array.from({length:9}, ()=>Array(9).fill(0)); }

	function valid(board, r, c, val){
		for (let i=0;i<9;i++) if (board[r][i]===val || board[i][c]===val) return false;
		const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
		for (let i=0;i<3;i++) for (let j=0;j<3;j++) if (board[br+i][bc+j]===val) return false;
		return true;
	}

	function solveSudoku(board){
		for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (!board[r][c]){
			for (let v=1;v<=9;v++) if (valid(board,r,c,v)){ board[r][c]=v; if (solveSudoku(board)) return true; board[r][c]=0; }
			return false;
		}
		return true;
	}

	function clone(b){ return b.map(r=>r.slice()); }

	function generateSudoku(removals=40){
		// start with a full solved board using backtracking randomization
		let board = makeEmptySudoku();
		function fill(){
			for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (!board[r][c]){
				const vals = [1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
				for (let v of vals) if (valid(board,r,c,v)){ board[r][c]=v; if (fill()) return true; board[r][c]=0; }
				return false;
			}
			return true;
		}
		fill();
		// remove cells
		let cells = Array.from({length:81}, (_,i)=>i);
		cells.sort(()=>Math.random()-0.5);
		for (let i=0;i<removals;i++){ const idx=cells[i]; board[Math.floor(idx/9)][idx%9]=0; }
		return board;
	}

	const sudokuBoardEl = document.getElementById('sudoku-board');
	function renderSudoku(board, solution){
		sudokuBoardEl.innerHTML='';
		for (let r=0;r<9;r++){
			for (let c=0;c<9;c++){
				const val = board[r][c];
				const input = document.createElement(val? 'div':'input');
				input.className = 'cell';
				input.dataset.r = r; input.dataset.c = c;
				if (val){ // given
					input.textContent = val;
					input.setAttribute('aria-readonly','true');
					input.setAttribute('readonly','true');
					input.style.textAlign='center';
				} else {
					input.type='text'; input.maxLength=1; input.value='';
					input.addEventListener('input', (e)=>{ const ch = e.target.value.replace(/[^1-9]/g,''); e.target.value = ch.slice(0,1); });
				}
				sudokuBoardEl.appendChild(input);
			}
		}
	}

	let currentPuzzle = generateSudoku(40);
	let solution = clone(currentPuzzle);
	solveSudoku(solution);
	renderSudoku(currentPuzzle, solution);

	document.getElementById('sudoku-new').addEventListener('click', ()=>{ currentPuzzle = generateSudoku(40); solution = clone(currentPuzzle); solveSudoku(solution); renderSudoku(currentPuzzle, solution); });
	document.getElementById('sudoku-check').addEventListener('click', ()=>{
		let ok = true;
		const inputs = sudokuBoardEl.querySelectorAll('input');
		inputs.forEach(inp=>{
			const r = +inp.dataset.r, c = +inp.dataset.c;
			const val = parseInt(inp.value) || 0;
			if (val && val !== solution[r][c]) { ok = false; inp.classList.add('wrong'); }
			else inp.classList.remove('wrong');
		});
		alert(ok ? 'All entries correct so far!' : 'Some entries are incorrect (highlighted).');
	});
	document.getElementById('sudoku-solve').addEventListener('click', ()=>{
		const inputs = sudokuBoardEl.querySelectorAll('input');
		inputs.forEach(inp=>{ const r=+inp.dataset.r, c=+inp.dataset.c; inp.value = solution[r][c] || ''; });
	});
	// Reset: clear user inputs back to initial puzzle
	document.getElementById('sudoku-reset').addEventListener('click', ()=>{
		const inputs = sudokuBoardEl.querySelectorAll('input');
		inputs.forEach(inp=>{ inp.value = ''; inp.classList.remove('wrong'); });
	});

	// Stop/Resume: disable or enable user input
	let sudokuStopped = false;
	document.getElementById('sudoku-stop').addEventListener('click', (e)=>{
		sudokuStopped = !sudokuStopped;
		const inputs = sudokuBoardEl.querySelectorAll('input');
		inputs.forEach(inp=> inp.disabled = sudokuStopped);
		e.target.textContent = sudokuStopped ? 'Resume' : 'Stop';
	});

	/* Math game removed per request */

	console.log('DOM loaded — hero found:', !!hero);

	/* ---------------- Reminders ---------------- */

	const REM_KEY = 'alagawatch_reminders_v1';
	const form = document.getElementById('reminder-form');
	const listEl = document.getElementById('reminders-list');
	let reminders = JSON.parse(localStorage.getItem(REM_KEY) || '[]');

	function saveReminders() { localStorage.setItem(REM_KEY, JSON.stringify(reminders)); }

	function renderReminders() {
		listEl.innerHTML = '';
		reminders.forEach((r, i) => {
			const el = document.createElement('div');
			el.className = 'reminder-item';
			el.innerHTML = `<div>${r.msg} — fires at ${new Date(r.fireAt).toLocaleString()}</div><div><button data-i="${i}" class="del">Delete</button></div>`;
			listEl.appendChild(el);
		});
	}

	function scheduleReminder(rem) {
		const delay = rem.fireAt - Date.now();
		if (delay <= 0) { alert('Reminder: ' + rem.msg); return; }
		setTimeout(() => { alert('Reminder: ' + rem.msg); }, delay);
	}

	// schedule on load
	reminders.forEach(scheduleReminder);

	form?.addEventListener('submit', (e) => {
		e.preventDefault();
		const msg = document.getElementById('reminder-msg').value.trim();
		const amt = parseInt(document.getElementById('reminder-amount').value, 10);
		const unit = document.getElementById('reminder-unit').value;
		if (!msg || !amt || !unit) return;
		const now = Date.now();
		let ms = amt * 1000; // default seconds
		switch (unit) {
			case 'seconds': ms = amt * 1000; break;
			case 'hours': ms = amt * 60 * 60 * 1000; break;
			case 'days': ms = amt * 24 * 60 * 60 * 1000; break;
			case 'months': ms = amt * 30 * 24 * 60 * 60 * 1000; break; // approx
			case 'years': ms = amt * 365 * 24 * 60 * 60 * 1000; break; // approx
		}
		const rem = { msg, fireAt: now + ms };
		reminders.push(rem);
		saveReminders();
		renderReminders();
		scheduleReminder(rem);
		form.reset();
	});

	listEl?.addEventListener('click', (e) => {
		const btn = e.target.closest('button.del');
		if (!btn) return;
		const i = Number(btn.getAttribute('data-i'));
		reminders.splice(i,1); saveReminders(); renderReminders();
	});

	renderReminders();

	/* ---------------- Simple Tetris-like game ---------------- */

	const canvas = document.getElementById('tetris');
	const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
	if (ctx) {
		const COLS = 10; const ROWS = 20; const BLOCK = canvas.width / COLS;
		let arena = Array.from({length: ROWS}, () => Array(COLS).fill(0));
		let score = 0; let dropCounter = 0; let dropInterval = 1000; let lastTime = 0; let gameOver = false; let paused = false;

		function createPiece() {
			const pieces = [
				[[1,1,1,1]], // I
				[[2,2],[2,2]], // O
				[[0,3,0],[3,3,3]], // T
				[[4,0,0],[4,4,4]], // J
				[[0,0,5],[5,5,5]], // L
				[[6,6,0],[0,6,6]], // S
				[[0,7,7],[7,7,0]]  // Z
			];
			return pieces[Math.floor(Math.random()*pieces.length)];
		}

		let player = { pos: {x:3,y:0}, matrix: createPiece() };

		function collide(arena, player) {
			for (let y=0;y<player.matrix.length;y++){
				for (let x=0;x<player.matrix[y].length;x++){
					if (player.matrix[y][x] && (arena[player.pos.y+y] && arena[player.pos.y+y][player.pos.x+x]) !== 0) return true;
				}
			}
			return false;
		}

		function merge(arena, player) {
			player.matrix.forEach((row,y)=>{
				row.forEach((val,x)=>{
					if (val) arena[player.pos.y+y][player.pos.x+x] = val;
				});
			});
		}

		function rotate(matrix) {
			return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
		}

		function playerDrop() {
			player.pos.y++;
			if (collide(arena, player)) {
				player.pos.y--;
				merge(arena, player);
				player.matrix = createPiece();
				player.pos = {x:3,y:0};
				if (collide(arena, player)) { gameOver = true; alert('Game Over'); }
				sweep();
			}
			dropCounter = 0;
		}

		function sweep() {
			let rowCount = 1;
			outer: for (let y=ROWS-1;y>=0;y--) {
				for (let x=0;x<COLS;x++) if (!arena[y][x]) continue outer;
				const row = arena.splice(y,1)[0].fill(0);
				arena.unshift(row);
				score += 10 * rowCount;
				rowCount *= 2; y++; // recheck same row index
			}
			document.getElementById('score').textContent = score;
		}

		function draw() {
			ctx.clearRect(0,0,canvas.width,canvas.height);
			// draw arena
			for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) if (arena[y][x]) drawBlock(x,y,arena[y][x]);
			// draw player
			player.matrix.forEach((row,y)=>row.forEach((val,x)=>{ if (val) drawBlock(player.pos.x+x, player.pos.y+y, val); }));
		}

		function drawBlock(x,y,val){ ctx.fillStyle = ['','#61dafb','#ffd166','#b0e57c','#ef476f','#06d6a0','#118ab2','#ffd166'][val] || '#999'; ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK-1, BLOCK-1); }

		function update(time=0){ if (paused || gameOver) return; const delta = time - lastTime; lastTime = time; dropCounter += delta; if (dropCounter > dropInterval) playerDrop(); draw(); requestAnimationFrame(update); }

		let running = false;
		document.getElementById('start-game').addEventListener('click', ()=>{
			if (running) return; running = true;
			arena = Array.from({length: ROWS}, () => Array(COLS).fill(0));
			player.matrix = createPiece(); player.pos = {x:3,y:0}; score = 0; gameOver=false; paused=false; lastTime = 0; update();
		});
		document.getElementById('pause-game').addEventListener('click', ()=>{ paused = !paused; if (!paused) update(); });
		document.getElementById('stop-game').addEventListener('click', ()=>{
			// stop the game loop and reset state
			running = false;
			paused = true;
			gameOver = false;
			arena = Array.from({length: ROWS}, () => Array(COLS).fill(0));
			score = 0;
			document.getElementById('score').textContent = score;
			ctx.clearRect(0,0,canvas.width,canvas.height);
		});

		function playerMove(dir){ player.pos.x += dir; if (collide(arena, player)) player.pos.x -= dir; }

		function playerHardDrop(){
			while(!collide(arena, player)) player.pos.y++; player.pos.y--; merge(arena, player); player.matrix = createPiece(); player.pos = {x:3,y:0}; sweep();
		}

		function playerRotate(dir=1){
			const prev = player.matrix;
			player.matrix = rotate(player.matrix);
			// wall kick attempts
			const kicks = [0, -1, 1, -2, 2];
			for (let k of kicks){ player.pos.x += k; if (!collide(arena, player)) return; player.pos.x -= k; }
			player.matrix = prev; // revert
		}

		window.addEventListener('keydown', (e)=>{
			if (gameOver) return;
			switch(e.key){
				case 'ArrowLeft': playerMove(-1); break;
				case 'ArrowRight': playerMove(1); break;
				case 'ArrowDown': playerDrop(); break;
				case ' ': playerHardDrop(); break;
				case 'ArrowUp': playerRotate(1); break;
				case 'p': paused = !paused; if (!paused) update(); break;
			}
		});

		// Mobile touch buttons
		document.getElementById('t-left')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); playerMove(-1); });
		document.getElementById('t-right')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); playerMove(1); });
		document.getElementById('t-down')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); playerDrop(); });
		document.getElementById('t-drop')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); playerHardDrop(); });
		document.getElementById('t-rotate')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); playerRotate(1); });
	}
});

