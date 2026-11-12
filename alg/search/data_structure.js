// data_structure.js content combined with graph.js for easier global loading
class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class Queue {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    enqueue(element) {
        let node = new Node(element);
        if (this.head === null) {
            this.head = node;
            this.tail = node;
        } else {
            this.tail.next = node;
            this.tail = node;
        }
    }
    enqueueHead(element) {
        let node = new Node(element);
        if (this.head === null) {
            this.head = node;
            this.tail = node;
        } else {
            node.next = this.head;
            this.head = node;
        }
    }
    dequeue() {
        if (this.head !== null) {
            let first_element = this.head;
            this.head = this.head.next;
            return first_element.value;
        } else {
            return null;
        }
    }
    isEmpty() { return this.head === null; }
    clear() { this.head = this.tail = null; }
}

class MinHeap {
    constructor() { this.data = []; }
    getParentIndex(index) { return Math.floor((index - 1) / 2); }
    getLeftChildIndex(index) { return 2 * index + 1; }
    getRightChildIndex(index) { return 2 * index + 2; }
    swap(index1, index2) {
        let tmp = this.data[index1];
        this.data[index1] = this.data[index2];
        this.data[index2] = tmp;
    }
    getMin() { return this.data.length > 0 ? this.data[0] : null; }
    extractMin() {
        let min = this.getMin();
        if (!min) return null;
        if (this.data.length === 1) return this.data.pop();
        this.data[0] = this.data.pop();
        this.minHeapify(0);
        return min;
    }
    minHeapify(index) {
        let left = this.getLeftChildIndex(index);
        let right = this.getRightChildIndex(index);
        let smallest = index;
        if (left < this.data.length && this.data[left].cost < this.data[smallest].cost) smallest = left;
        if (right < this.data.length && this.data[right].cost < this.data[smallest].cost) smallest = right;
        if (smallest !== index) {
            this.swap(index, smallest);
            this.minHeapify(smallest);
        }
    }
    insert(element) {
        this.data.push(element);
        let index = this.data.length - 1;
        while (index > 0 && this.data[index].cost < this.data[this.getParentIndex(index)].cost) {
            this.swap(index, this.getParentIndex(index));
            index = this.getParentIndex(index);
        }
    }
    isEmpty() { return this.data.length === 0; }
    includes(element) { return this.data.includes(element); }
    empty() { this.data = []; }
}

class Graph {
    constructor() {
        this.board = [];
        this.source = null;
        this.target = null;
    }

    update(cell, color) {
        const constant = window.CONSTANT;
        // Logic to prevent dual-roles
        if (cell === this.source && color !== constant.SOURCE_COLOR) {
            this.source = null;
        }
        if (cell === this.target && color !== constant.TARGET_COLOR) {
            this.target = null;
        }

        switch (color) {
            case constant.SOURCE_COLOR:
                if (this.source) {
                    this.source.update(constant.CLEAR_COLOR);
                }
                this.source = cell;
                this.source.update(constant.SOURCE_COLOR);
                break;
            case constant.TARGET_COLOR:
                if (this.target) {
                    this.target.update(constant.CLEAR_COLOR);
                }
                this.target = cell;
                this.target.update(constant.TARGET_COLOR);
                break;
            default:
                cell.update(color)
        }
    }

    clearBoard() {
        this.source = null;
        this.target = null;
        this.board.forEach(function (row) {
            row.forEach(function (cell) {
                cell.clear();
            });
        });
    }

    clearMinorCells() {
        const source = this.source;
        const target = this.target;
        const constant = window.CONSTANT;

        // Use a faster loop and batch resets
        for (let r = 0; r < this.board.length; r++) {
            const row = this.board[r];
            for (let c = 0; c < row.length; c++) {
                const cell = row[c];
                if (cell !== source && cell !== target && cell.color !== constant.WALL_COLOR) {
                    // Manual inline clear for speed
                    if (cell.color !== constant.UNDISCOVERED_COLOR) {
                        cell.color = constant.UNDISCOVERED_COLOR;
                        cell.div.style.backgroundColor = cell.color;
                    }
                }
                if (cell.div.innerText !== "") cell.div.innerText = "";

                // Reset algorithm data only if they were actually set
                if (cell.parent !== null) cell.parent = null;
                if (cell.distance !== null) cell.distance = null;
                if (cell.g_val !== Infinity) cell.g_val = Infinity;
                if (cell.cost !== Infinity) cell.cost = Infinity;
                if (cell.curMove !== 0) cell.curMove = 0;
            }
        }

        if (source) {
            if (source.div.innerText !== "") source.div.innerText = "";
            source.parent = null;
            source.distance = null;
            source.curMove = 0;
        }
        if (target) {
            if (target.div.innerText !== "") target.div.innerText = "";
            target.parent = null;
            target.distance = null;
            target.curMove = 0;
            target.found = false;
        }
    }

    initializeA_StarCellCost(value = Infinity) {
        this.board.forEach((row) => {
            row.forEach((cell) => {
                cell.g_val = value;
                cell.cost = value;
                cell.parent = null;
            });
        });
    }
}

window.Queue = Queue;
window.MinHeap = MinHeap;
window.Graph = Graph;
