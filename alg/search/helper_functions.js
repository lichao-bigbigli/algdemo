const HELPER = {
    appendStat: function (search, lang = 'zh') {
        const texts = window.CONSTANT.I18N[lang];
        function greyOutPreviousStat() {
            let paragraphs = $("#data-content p");
            for (let i = paragraphs.length - 1; i > -1 && i > paragraphs.length - 10; i--) {
                paragraphs[i].style.color = "grey";
            }
        }

        greyOutPreviousStat();
        const data_display = $("#data-content")[0];
        data_display.appendChild(this.createElement('p', `${texts.stat_mode}: ${search.mode}`));
        data_display.appendChild(this.createElement('p', `${texts.stat_searched}: ${search.data.total_searched}`));
        data_display.appendChild(this.createElement('p', `${texts.stat_discovered}: ${search.data.total_discovered}`));
        data_display.appendChild(this.createElement('p', `${texts.stat_path_length}: ${search.data.path_length}`));
        data_display.appendChild(document.createElement('br'));
        this.scrollToBottom("data-content");
    },

    getLegalCellsAround: function (graph, current_cell) {
        const board = graph.board;
        const curr_row = current_cell.row;
        const curr_col = current_cell.col;
        let legal_cells = [];
        const legal_color = [window.CONSTANT.UNDISCOVERED_COLOR, window.CONSTANT.TARGET_COLOR];

        const dirs = [
            { r: -1, c: 0 }, // Up
            { r: 0, c: 1 },  // Right
            { r: 1, c: 0 },  // Down
            { r: 0, c: -1 }  // Left
        ];

        dirs.forEach(offset => {
            const new_row = curr_row + offset.r;
            const new_col = curr_col + offset.c;
            if (new_row >= 0 && new_row < board.length && new_col >= 0 && new_col < board[0].length) {
                const new_cell = board[new_row][new_col];
                if (legal_color.includes(new_cell.color)) {
                    legal_cells.push(new_cell);
                }
            }
        });
        return legal_cells;
    },

    getCellsAround: function (graph, current_cell) {
        const board = graph.board;
        const curr_row = current_cell.row;
        const curr_col = current_cell.col;
        let cells = [];

        const dirs = [
            { r: -1, c: 0 }, // Up
            { r: 0, c: 1 },  // Right
            { r: 1, c: 0 },  // Down
            { r: 0, c: -1 }  // Left
        ];

        dirs.forEach(offset => {
            const new_row = curr_row + offset.r;
            const new_col = curr_col + offset.c;
            if (new_row >= 0 && new_row < board.length && new_col >= 0 && new_col < board[0].length) {
                cells.push(board[new_row][new_col]);
            }
        });
        return cells;
    },

    moveByDir: function (graph, current_cell) {
        const board = graph.board;
        const curr_row = current_cell.row;
        const curr_col = current_cell.col;
        const legal_color = [window.CONSTANT.UNDISCOVERED_COLOR, window.CONSTANT.TARGET_COLOR];

        const moveIndex = current_cell.curMove;
        current_cell.curMove++;

        let new_row = curr_row;
        let new_col = curr_col;

        switch (moveIndex) {
            case 0: // Up
                new_row = curr_row - 1;
                break;
            case 1: // Right
                new_col = curr_col + 1;
                break;
            case 2: // Down
                new_row = curr_row + 1;
                break;
            case 3: // Left
                new_col = curr_col - 1;
                break;
            default:
                return undefined;
        }

        if (new_row >= 0 && new_row < board.length && new_col >= 0 && new_col < board[0].length) {
            var new_cell = board[new_row][new_col];
            if (legal_color.includes(new_cell.color)) {
                return new_cell;
            }
        }
        return undefined;
    },

    createElement: function (tag, msg = null) {
        let p = document.createElement(tag);
        if (msg) {
            let textnode = document.createTextNode(msg);
            p.appendChild(textnode);
        }
        return p;
    },

    scrollToBottom: function (element_id) {
        let objDiv = document.getElementById(element_id);
        if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
    },

    manhattanDistance: function (cell1, cell2) {
        return Math.abs(cell2.row - cell1.row) + Math.abs(cell2.col - cell1.col);
    }
};

window.HELPER = HELPER;