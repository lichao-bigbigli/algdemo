// main.js - Sci-Fi Version
let search, graph, mouse_is_down, requestId;
let game_active = false;
let game_animation = false;
let fps = 50;
let interval = 1000 / fps;
let last = 0;
let width = 30, height = 30;
let currentLang = 'zh';

// Spark effect variables
let sparks = [];
const sparkCanvas = document.getElementById('spark-canvas');
const ctx = sparkCanvas.getContext('2d');

function resizeCanvas() {
  sparkCanvas.width = window.innerWidth;
  sparkCanvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
  resizeCanvas();
  autoScale();
});
resizeCanvas();

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.alpha = 0.8;
    this.color = '#C0C0C0'; // Silver
    this.size = Math.random() * 1.5 + 0.5; // Smaller
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.02; // Fade faster
    this.size += 0.05;
  }
  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update();
    sparks[i].draw();
    if (sparks[i].alpha <= 0) sparks.splice(i, 1);
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

$(document).mousemove((e) => {
  if (Math.random() > 0.6) { // Less frequent
    sparks.push(new Particle(e.clientX, e.clientY));
  }
});

function autoScale() {
  const container = $('#board-container');
  const board = $('#board');
  if (!board.length || !container.length) return;

  const cw = container.width();
  const ch = container.height();
  const bw = board.outerWidth();
  const bh = board.outerHeight();

  const scale = Math.min(cw / bw, ch / bh) * 0.95;
  $('#board-wrapper').css('transform', `scale(${scale})`);

  // Adjust font size inside cells based on scale
  const baseFontSize = (window.CONSTANT.cell_dimension / 2.5);
  $('.cell').css('font-size', baseFontSize + 'em');
}

function setup() {
  const constant = window.CONSTANT;
  game_active = false;
  game_animation = false;
  graph = new window.Graph();
  const board = document.getElementById('board');
  if (!board) return;
  board.style.display = 'none'; // Hide while building
  board.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (let row = 0; row < height; row++) {
    let row_div = document.createElement('div');
    row_div.style.display = 'flex';
    for (let col = 0; col < width; col++) {
      let cell_div = document.createElement('div');
      cell_div.style.width = constant.cell_dimension + 'em';
      cell_div.style.height = constant.cell_dimension + 'em';
      cell_div.style.flexShrink = "0";
      cell_div.setAttribute('data-row', row.toString());
      cell_div.setAttribute('data-col', col.toString());
      cell_div.style.backgroundColor = constant.UNDISCOVERED_COLOR;
      cell_div.classList.add('cell');
      setupCellDiv(cell_div);
      row_div.appendChild(cell_div);
      graph.board[row] = graph.board[row] || [];
      graph.board[row][col] = new window.Cell(cell_div, row, col);
    }
    fragment.appendChild(row_div);
  }
  board.appendChild(fragment);
  board.style.display = 'flex'; // Show back

  ensureSourceTarget();
  setTimeout(autoScale, 10);
}

function ensureSourceTarget() {
  const constant = window.CONSTANT;
  if (!graph.source && graph.board[0] && graph.board[0][0]) {
    graph.update(graph.board[0][0], constant.SOURCE_COLOR);
  }
  if (!graph.target && graph.board[height - 1] && graph.board[height - 1][width - 1]) {
    graph.update(graph.board[height - 1][width - 1], constant.TARGET_COLOR);
  }
}

function resetSearchUIState() {
  if (search === null && !game_active && !game_animation) {
    if (graph.target && !graph.target.found) return; // Already clean
  }
  game_active = false;
  game_animation = false;
  search = null;
  cancelAnimationFrame(requestId);
  $('#step, #animation').hide();
  $('#start_search').show();
  graph.clearMinorCells(); // Clear previous search paths/distances
  updateLanguageUI();
}

function guaranteePath() {
  let r = 0, c = 0;
  while (r !== height - 1 || c !== width - 1) {
    if (r < height - 1 && (Math.random() > 0.5 || c === width - 1)) r++;
    else c++;
    const cell = graph.board[r][c];
    if (cell !== graph.source && cell !== graph.target) cell.clear();
  }
}

function loadMapPattern(mapObj) {
  const board = document.getElementById('board');
  board.style.display = 'none'; // Batch optimization

  // Handle new mask-based map format
  if (mapObj.mask) {
    // Resize grid if gridSize is specified
    if (mapObj.gridSize) {
      width = mapObj.gridSize.width;
      height = mapObj.gridSize.height;
      $('#width_input').val(width);
      $('#height_input').val(height);
      setup();
    }

    // Clear board completely first
    graph.clearBoard();

    const mask = mapObj.mask;
    const constant = window.CONSTANT;

    // Draw walls from mask
    for (let r = 0; r < mask.length && r < height; r++) {
      for (let c = 0; c < mask[r].length && c < width; c++) {
        if (mask[r][c] === 1) {
          const cell = graph.board[r][c];
          graph.update(cell, constant.WALL_COLOR);
        }
      }
    }

    // Set custom source position
    if (mapObj.source && mapObj.source.row < height && mapObj.source.col < width) {
      const sourceCell = graph.board[mapObj.source.row][mapObj.source.col];
      graph.update(sourceCell, constant.SOURCE_COLOR);
    }

    // Set custom target position
    if (mapObj.target && mapObj.target.row < height && mapObj.target.col < width) {
      const targetCell = graph.board[mapObj.target.row][mapObj.target.col];
      graph.update(targetCell, constant.TARGET_COLOR);
    }

    resetSearchUIState();
    board.style.display = 'flex';
    setTimeout(autoScale, 10);
    return;
  }

  // Legacy pattern string handling
  const pattern = mapObj.walls || mapObj;

  // Clear only walls and paths, preserve source/target if they exist
  graph.board.forEach(row => row.forEach(cell => {
    if (cell !== graph.source && cell !== graph.target) cell.clear();
  }));
  ensureSourceTarget();

  const w = width, h = height;
  const setWall = (r, c) => {
    r = Math.floor(r); c = Math.floor(c);
    if (r >= 0 && r < h && c >= 0 && c < w) {
      const cell = graph.board[r][c];
      if (cell !== graph.source && cell !== graph.target) graph.update(cell, window.CONSTANT.WALL_COLOR);
    }
  };

  switch (pattern) {
    case "pattern_hole":
      for (let r = h / 3 | 0; r < 2 * h / 3 | 0; r++) for (let c = w / 3 | 0; c < 2 * w / 3 | 0; c++) setWall(r, c);
      break;
    case "pattern_maze":
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (Math.random() > 0.7) setWall(r, c);
      break;
    case "pattern_diag":
      for (let i = h / 2 | 0; i < h; i++) setWall(i, (width - (i - h / 2 | 0) - 1));
      break;
    case "pattern_cross":
      for (let i = 0; i < w; i++) if (Math.abs(i - w / 2) > 2) setWall(h / 2 | 0, i);
      for (let i = 0; i < h; i++) if (Math.abs(i - h / 2) > 2) setWall(i, w / 2 | 0);
      break;
    case "pattern_rooms":
      for (let i = 0; i < w; i++) if (i !== w / 2 | 0) { setWall(h / 2 | 0, i); }
      break;
    case "pattern_spiral":
      if (w < 10 || h < 10) break; // Spiral needs space
      let r = 2, c = 2, dr = 0, dc = 1, steps = w - 5, side = 0;
      for (let i = 0; i < 500; i++) {
        setWall(r, c);
        if (--steps <= 0) {
          if (side % 2 === 0) steps = w - 5 - (side / 2 + 1) * 4;
          else steps = h - 5 - (side / 2 + 1) * 4;
          if (steps <= 0) break;
          let tmp = dr; dr = dc; dc = -tmp; side++;
        }
        r += dr; c += dc;
      }
      break;
    case "pattern_checker":
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if ((r + c) % 4 === 0) setWall(r, c);
      break;
    case "pattern_snake":
      for (let r = 2; r < h; r += 4) {
        for (let c = 0; c < w - 4; c++) setWall(r, c);
        for (let c = 4; c < w; c++) setWall(r + 2, c);
      }
      break;
    case "pattern_corridors":
      for (let c = 3; c < w; c += 6) for (let r = 0; r < h - 3; r++) setWall(r, c);
      for (let c = 6; c < w; c += 6) for (let r = 3; r < h; r++) setWall(r, c);
      break;
  }
  guaranteePath();
  resetSearchUIState();
  board.style.display = 'flex'; // Restore board
}


function initialize() {
  $('#toggle_lang').click(() => { currentLang = currentLang === 'zh' ? 'en' : 'zh'; updateLanguageUI(); });

  $('#classic_maps_btn').click(() => {
    const list = $('#map-list').empty();
    window.CONSTANT.PRESET_MAPS.forEach(map => {
      const item = $(`<div class="map-item">${currentLang === 'zh' ? map.name_zh : map.name}</div>`);
      item.click(() => {
        loadMapPattern(map);
        $('#map-modal').fadeOut();
      });
      list.append(item);
    });
    $('#map-modal').fadeIn();
  });

  $('#close-modal').click(() => $('#map-modal').fadeOut());

  $('#toggle_more_algos').change(function () {
    if (this.checked) $('#extra-algorithms-container').slideDown();
    else $('#extra-algorithms-container').slideUp();
  });

  $('#cartoon_btn').click(() => {
    const list = $('#hero-list').empty();
    window.CONSTANT.CARTOON_HEROES.forEach(hero => {
      const item = $(`<div class="map-item" style="font-size: 0.85em; padding: 10px 5px;">${currentLang === 'zh' ? hero.name_zh : hero.name}</div>`);
      item.click(() => {
        drawCartoonCharacter(hero.mask);
        $('#hero-modal').fadeOut();
      });
      list.append(item);
    });
    $('#hero-modal').fadeIn();
  });

  $('#close-hero-modal').click(() => $('#hero-modal').fadeOut());

  $('#apply_setting').click(() => {
    let w = parseInt($('#width_input').val()), h = parseInt($('#height_input').val());
    if (isNaN(w) || isNaN(h)) { alert(window.CONSTANT.I18N[currentLang].alert_no_input); return; }
    if (w > 150 || h > 150) { alert(window.CONSTANT.I18N[currentLang].alert_too_large); return; }
    width = w; height = h; setup();
  });

  $('#board').mousedown(() => { mouse_is_down = true; return false; });
  $(document).mouseup(() => { mouse_is_down = false; });

  $('#clear_board').click(() => {
    graph.clearBoard(); search = null; game_active = game_animation = false;
    $('#step, #animation').hide(); $('#start_search').show();
    cancelAnimationFrame(requestId); setup();
  });

  $('#start_search').click(function () {
    if (!graph.source || !graph.target) alert(window.CONSTANT.I18N[currentLang].alert_no_start_end);
    else {
      graph.clearMinorCells(); graph.target.found = false;
      search = new window.Search(graph, $("input[name='search_algo']:checked").val());
      $(this).hide(); $('#step, #animation').css('display', 'inline-block');
      graph.source.distance = 1; graph.source.div.innerText = "1";
      requestId = requestAnimationFrame(draw);
    }
  });

  $("input[name='search_algo']").on('change', function () { updateDescription($(this).val()); });

  $('#random_btn').click(() => {
    let r = parseInt(prompt(window.CONSTANT.I18N[currentLang].prompt_randomness, '30'));
    if (isNaN(r)) return;

    const board = document.getElementById('board');
    board.style.display = 'none'; // Batch optimization

    // Clear previous
    graph.board.forEach(row => row.forEach(cell => {
      if (cell !== graph.source && cell !== graph.target) cell.clear();
    }));
    ensureSourceTarget();

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (Math.random() < r / 100) {
          const cell = graph.board[i][j];
          if (cell !== graph.source && cell !== graph.target) graph.update(cell, window.CONSTANT.WALL_COLOR);
        }
      }
    }
    guaranteePath();
    resetSearchUIState();
    board.style.display = 'flex'; // Restore board
  });

  $('#step').click(() => { move(); });
  $('#animation').click(() => {
    game_animation = !game_animation;
    game_active = game_animation;
    updateLanguageUI();
  });

  const slider = document.getElementById('simulator_speed');
  if (slider) slider.oninput = function () {
    document.getElementById('speed_display').innerHTML = this.value;
    fps = parseInt(this.value); if (!isNaN(fps) && fps !== 0) interval = 1000 / fps;
  };

  updateLanguageUI();
  new ResizeObserver(autoScale).observe(document.getElementById('board-container'));
}

function drawCartoonCharacter(mask) {
  const board = document.getElementById('board');
  board.style.display = 'none';

  // Clear previous
  graph.board.forEach(row => row.forEach(cell => {
    if (cell !== graph.source && cell !== graph.target) cell.clear();
  }));
  ensureSourceTarget();

  const mask_h = mask.length;
  const mask_w = mask[0].length;

  // Dynamic scaling to fit ~90% of map (maximum occupancy)
  const scale_h = Math.floor(height * 0.9 / mask_h);
  const scale_w = Math.floor(width * 0.9 / mask_w);
  const scale = Math.max(1, Math.min(scale_h, scale_w));

  const start_r = Math.floor((height - mask_h * scale) / 2);
  const start_c = Math.floor((width - mask_w * scale) / 2);

  for (let r = 0; r < mask_h; r++) {
    for (let c = 0; c < mask_w; c++) {
      if (mask[r][c] === 1) {
        // Draw a 'pixel' of size 'scale x scale'
        for (let dr = 0; dr < scale; dr++) {
          for (let dc = 0; dc < scale; dc++) {
            const row = start_r + r * scale + dr;
            const col = start_c + c * scale + dc;
            if (row >= 0 && row < height && col >= 0 && col < width) {
              const cell = graph.board[row][col];
              if (cell !== graph.source && cell !== graph.target) graph.update(cell, window.CONSTANT.WALL_COLOR);
            }
          }
        }
      }
    }
  }

  resetSearchUIState();
  board.style.display = 'flex';
}

function updateLanguageUI() {
  const texts = window.CONSTANT.I18N[currentLang];
  $('#i18n_title').text(texts.title);
  $('#i18n_board_size').text(texts.board_size);
  $('#width_input').attr('placeholder', texts.width);
  $('#height_input').attr('placeholder', texts.height);
  $('#apply_setting').text(texts.apply);
  $('#i18n_speed').text(texts.speed);
  $('#i18n_frame_rate').text(texts.frame_rate);
  $('#i18n_log').text(texts.log);
  $('#i18n_selecting_mode').text(texts.selecting_mode);
  $('#i18n_wall').text(texts.wall); $('#i18n_clear').text(texts.clear);
  $('#i18n_source').text(texts.source); $('#i18n_target').text(texts.target);
  $('#i18n_search_algo_label').text(texts.search_algo);
  $('#random_btn').text(texts.random_walls); $('#clear_board').text(texts.clear_board);
  $('#start_search').text(texts.start_search); $('#step').text(texts.step);
  $('#animation').text(game_animation ? texts.pause : (game_active ? texts.resume : texts.animation));
  $('#i18n_source_code').text(texts.source_code);
  $('#more_search_btn').text(texts.more_search);
  $('#classic_maps_btn').text(texts.classic_maps);
  $('#i18n_select_map').text(texts.select_map);
  updateDescription($("input[name='search_algo']:checked").val());
}

function updateDescription(algo) {
  const texts = window.CONSTANT.I18N[currentLang];
  $('#description').html(algo === 'BFS' ? texts.bfs_desc : (algo === 'DFS' ? texts.dfs_desc : texts.astar_desc));
  if (window.MathJax) MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'description']);
}

function draw(timeStamp) {
  if (game_active) {
    if (game_animation && fps > 90) move();
    else if (timeStamp > last) { move(); last = timeStamp + interval; }
  }
  requestId = requestAnimationFrame(draw);
}

function move() {
  let ret = search.step();
  if (ret) {
    game_active = game_animation = false;
    $('#step, #animation').hide();
    $('#animation').text(window.CONSTANT.I18N[currentLang].animation);
    $('#start_search').show();
    cancelAnimationFrame(requestId);
    if (!graph.target.found) alert(window.CONSTANT.I18N[currentLang].alert_unreachable);
    window.HELPER.appendStat(search, currentLang);
  }
}

function setupCellDiv(cell_div) {
  cell_div.onclick = (e) => updateCell(e);
  cell_div.onmouseover = (e) => {
    if (mouse_is_down) updateCell(e);
    if (mouse_is_down) {
      const rect = e.target.getBoundingClientRect();
      sparks.push(new Particle(rect.left + rect.width / 2, rect.top + rect.height / 2));
    }
  };
}

function updateCell(event) {
  const row = parseInt(event.target.getAttribute('data-row'));
  const col = parseInt(event.target.getAttribute('data-col'));
  if (isNaN(row) || isNaN(col)) return;
  const cell = graph.board[row][col];
  const mode = $("input[name='select_mode']:checked").val();
  const c = window.CONSTANT;
  let color = c.CLEAR_COLOR;

  // Any change to the map resets the current search/results
  resetSearchUIState();

  if (mode === 'wall') color = c.WALL_COLOR;
  else if (mode === 'source') color = c.SOURCE_COLOR;
  else if (mode === 'target') color = c.TARGET_COLOR;
  graph.update(cell, color);
}

$(document).ready(() => { setup(); initialize(); });
