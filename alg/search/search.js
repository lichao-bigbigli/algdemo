class Cell {
  constructor(div, row, col) {
    this.row = row;
    this.col = col;
    this.color = window.CONSTANT.UNDISCOVERED_COLOR;
    this.wall = false;
    this.div = div;
    this.cost = 0;
  }
  update(color) {
    if (this.color === color) return;
    this.color = color;
    this.div.style.backgroundColor = this.color;
    // Use an explicit check before clearing text to avoid unnecessary DOM touching
    if (this.color === window.CONSTANT.UNDISCOVERED_COLOR) {
      if (this.div.innerText !== "") this.div.innerText = "";
    }
  }
  clear() {
    this.color = window.CONSTANT.UNDISCOVERED_COLOR;
    this.div.style.backgroundColor = this.color;
    this.div.innerText = '';
  }
}

class Search {
  constructor(graph, mode) {
    this.mode = mode;
    this.data = { graph, total_searched: 0, total_discovered: 1, path_length: 0 };
    switch (mode) {
      case 'BFS': this.search_algo = new BFS(this.data); break;
      case 'DFS': this.search_algo = new DFS(this.data); break;
      case 'A*': this.search_algo = new A_Star(this.data); break;
    }
  }
  step() { return this.search_algo.step(); }
}

class BFS {
  constructor(data) {
    this.data = data;
    this.graph = data.graph;
    this.queue = new window.Queue();
    this.current_cell = this.graph.source;
    this.queue.enqueue(this.current_cell);
  }
  step() {
    if (!this.queue.isEmpty()) {
      const distance_to_stop = this.current_cell.distance + 1;
      while (!this.queue.isEmpty()) {
        this.current_cell = this.queue.dequeue();
        if (this.current_cell.distance === distance_to_stop) {
          this.queue.enqueueHead(this.current_cell);
          break;
        }
        if (this.current_cell === this.graph.target) {
          this.queue.clear();
          this.graph.target.found = true;
        } else {
          const legal_cells = window.HELPER.getLegalCellsAround(this.graph, this.current_cell);
          legal_cells.forEach((new_cell) => {
            if (new_cell.color === window.CONSTANT.UNDISCOVERED_COLOR) new_cell.update(window.CONSTANT.DISCOVERED_COLOR);
            this.queue.enqueue(new_cell);
            this.data.total_discovered++;
            new_cell.parent = this.current_cell;
            new_cell.distance = this.current_cell.distance + 1;
            new_cell.div.innerText = new_cell.distance;
          });
          if (this.current_cell !== this.graph.source) this.current_cell.update(window.CONSTANT.EXPLORED_COLOR);
        }
        this.data.total_searched++;
      }
    } else {
      if (this.graph.target.found) {
        if (this.data.path_length === 0) this.data.path_length = 1;
        if (this.current_cell.parent != null) {
          this.data.path_length++;
          this.current_cell = this.current_cell.parent;
        }
        if (this.current_cell !== this.graph.source) this.current_cell.update(window.CONSTANT.PATH_COLOR);
        else return true;
      } else return true;
    }
    return false;
  }
}

class DFS {
  constructor(data) {
    this.graph = data.graph;
    this.data = data;
    this.current_cell = this.graph.source;
    this.current_cell.curMove = 0;
  }
  step() {
    if (!this.graph.target.found) {
      let next_cell = this.found_nextCell();
      if (next_cell === undefined) return true;
      if (next_cell === this.graph.target) {
        next_cell.parent = this.current_cell;
        next_cell.distance = this.current_cell.distance + 1;
        next_cell.div.innerText = next_cell.distance;
        this.current_cell = next_cell;
        this.graph.target.found = true;
      } else {
        if (next_cell.color === window.CONSTANT.UNDISCOVERED_COLOR) next_cell.update(window.CONSTANT.DISCOVERED_COLOR);
        this.data.total_discovered++;
        next_cell.parent = this.current_cell;
        next_cell.curMove = 0;
        next_cell.distance = this.current_cell.distance + 1;
        next_cell.div.innerText = next_cell.distance;
        if (this.current_cell !== this.graph.source) this.current_cell.update(window.CONSTANT.EXPLORED_COLOR);
        this.current_cell = next_cell;
        this.data.total_searched++;
      }
    } else {
      if (this.graph.target.found) {
        if (this.data.path_length === 0) this.data.path_length = 1;
        if (this.current_cell.parent != null) {
          this.data.path_length++;
          this.current_cell = this.current_cell.parent;
        }
        if (this.current_cell !== this.graph.source) this.current_cell.update(window.CONSTANT.PATH_COLOR);
        else return true;
      } else return true;
    }
    return false;
  }
  found_nextCell() {
    let next_cell = undefined;
    while (!next_cell) {
      while (this.current_cell.curMove < 4 && next_cell === undefined) {
        next_cell = window.HELPER.moveByDir(this.graph, this.current_cell);
      }
      if (this.current_cell.curMove === 4 && next_cell === undefined) {
        if (this.current_cell.parent === undefined) return undefined;
        this.current_cell = this.current_cell.parent;
      }
    }
    return next_cell;
  }
}

class A_Star {
  constructor(data) {
    this.data = data;
    this.graph = data.graph;
    this.frontier = new window.MinHeap();
    this.frontier.insert(this.graph.source);
    this.heuristic = window.HELPER.manhattanDistance;
    this.graph.initializeA_StarCellCost();
    this.graph.source.g_val = 0;
    this.graph.source.cost = this.heuristic(this.graph.source, this.graph.target);
    this.current_cell = this.graph.source;
    this.discovered_list = [];
    this.explored_list = [];
  }
  step() {
    if (!this.graph.target.found && !this.frontier.isEmpty()) {
      this.current_cell = this.frontier.extractMin();

      // If we've already found a shorter path to this node, skip it
      if (this.explored_list.includes(this.current_cell)) return false;

      if (this.current_cell !== this.graph.source && this.current_cell !== this.graph.target) {
        this.explored_list.push(this.current_cell);
      }
      if (this.current_cell === this.graph.target) {
        this.graph.target.found = true;
        this.frontier.empty();
      } else {
        const cells_around = window.HELPER.getCellsAround(this.graph, this.current_cell);
        cells_around.forEach((neighbor) => {
          if (neighbor.parent !== this.current_cell && this.current_cell.parent !== neighbor && neighbor.color !== window.CONSTANT.WALL_COLOR) {
            if (!this.discovered_list.includes(neighbor) && neighbor !== this.graph.target) this.discovered_list.push(neighbor);
            let tentative_g_val = this.current_cell.g_val + 1;
            if (tentative_g_val < neighbor.g_val) {
              neighbor.g_val = tentative_g_val;
              neighbor.cost = neighbor.g_val + this.heuristic(neighbor, this.graph.target);
              neighbor.parent = this.current_cell;
              if (!this.frontier.includes(neighbor)) this.frontier.insert(neighbor);
            }
          }
        });
      }
      this.colorPath();
    } else {
      this.data.total_discovered = this.discovered_list.length + 2;
      this.data.total_searched = this.explored_list.length + 2;
      return true;
    }
    return false;
  }
  colorPath() {
    this.data.path_length = 1;
    this.discovered_list.forEach((cell) => {
      if (cell !== this.graph.source && cell !== this.graph.target) cell.update(window.CONSTANT.DISCOVERED_COLOR);
    });
    let curr_cell = this.current_cell;
    let path_nodes = [];
    while (curr_cell !== this.graph.source) {
      path_nodes.push(curr_cell);
      if (curr_cell !== this.graph.target) {
        curr_cell.update(window.CONSTANT.PATH_COLOR);
      }
      curr_cell = curr_cell.parent;
    }
    path_nodes.push(this.graph.source);
    this.data.path_length = path_nodes.length;

    this.explored_list.forEach((cell) => {
      if (cell.color !== window.CONSTANT.PATH_COLOR) {
        cell.update(window.CONSTANT.EXPLORED_COLOR);
        cell.div.innerText = '';
      }
    });

    for (let i = 0; i < path_nodes.length; i++) {
      path_nodes[i].div.innerText = path_nodes.length - i;
    }
  }
}

window.Cell = Cell;
window.Search = Search;
