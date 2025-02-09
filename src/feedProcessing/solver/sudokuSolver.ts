// Knuth's Dancing Links algorithm: https://arxiv.org/pdf/cs/0011047.pdf
const SIZE = 9;
const ROW_N = SIZE * SIZE * SIZE;
const COL_N = SIZE * SIZE * 4;
const SIZE_SQUARED = SIZE * SIZE;
const SIZE_SQRT = Math.sqrt(SIZE);

interface ID {
  x: number;
  y: number;
  entry: number;
}

class Node {
  left: Node;
  right: Node;
  up: Node;
  down: Node;
  column: Node | null;
  id: ID | null;
  size: number;

  constructor(column: Node = null, id: ID = null) {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;

    this.column = column;
    this.id = id;

    this.size = 0;
  }

  insertRight(node: Node) {
    node.left = this;
    node.right = this.right;
    this.right.left = node;
    this.right = node;
  }

  insertDown(node: Node) {
    node.up = this;
    node.down = this.down;
    this.down.up = node;
    this.down = node;
  }

  insertUp(node: Node) {
    node.down = this;
    node.up = this.up;
    this.up.down = node;
    this.up = node;
  }
}

function createSparseMatrix(): boolean[][] {
  let matrix = Array.from(Array(ROW_N), () =>
    new Array<boolean>(COL_N).fill(false),
  );
  let x = 0;
  let counter = 0;
  let xOffset = 0;

  // Cell constraint
  for (let y = 0; y < ROW_N; y++) {
    matrix[y][x] = true;
    counter++;

    if (counter >= SIZE) {
      x++;
      counter = 0;
    }
  }

  // Row constraint
  xOffset = SIZE_SQUARED;
  for (let i = 0; i < SIZE; i++) {
    x = 0;
    for (let y = 0; y < ROW_N; y += SIZE) {
      matrix[y + i][xOffset + x + i] = true;

      counter++;
      if (counter !== 0 && counter % SIZE === 0) x += SIZE;
    }
  }

  // Column constraint
  xOffset = SIZE_SQUARED * 2;
  x = 0;
  for (let y = 0; y < ROW_N; y++) {
    matrix[y][x + xOffset] = true;

    x++;
    if (x >= SIZE_SQUARED) x = 0;
  }

  // Block constraint
  for (let i = 0; i < SIZE; i++) {
    xOffset = SIZE_SQUARED * 3;
    counter = x = 0;
    for (let y = 0; y < ROW_N; y += SIZE, counter++) {
      if (counter !== 0 && counter % (SIZE * SIZE_SQRT) === 0) {
        xOffset += SIZE * SIZE_SQRT;
        counter = x = 0;
      } else if (counter !== 0 && counter % SIZE === 0) {
        x = 0;
      } else if (counter !== 0 && counter % SIZE_SQRT === 0) {
        x += SIZE;
      }

      matrix[y + i][x + xOffset + i] = true;
    }
  }

  return matrix;
}

export default class SudokuSolver {
  isSolved: boolean = false;
  headerNode: Node;
  rows: Node[] = new Array<Node>(ROW_N);
  solution: Node[] = new Array<Node>(SIZE_SQUARED);

  constructor() {
    this.headerNode = new Node();
    this.headerNode.size = -1;

    let temp = this.headerNode;
    // Create the column nodes for each column
    for (let i = 0; i < COL_N; i++) {
      const newCol = new Node();
      temp.insertRight(newCol);
      temp = newCol;
    }

    // Create sparse boolean matrix with rules found here:
    // https://www.stolaf.edu//people/hansonr/sudoku/exactcovermatrix.htm
    const matrix = createSparseMatrix();

    // Create a doubly linked list of nodes using the matrix
    this.matrixToGrid(matrix);
  }

  matrixToGrid(matrix: boolean[][]) {
    const id: ID = { x: 0, y: 0, entry: 0 };
    for (let y = 0; y < ROW_N; y++) {
      let prev: Node | null = null;
      let col = this.headerNode.right;

      if (y !== 0 && y % SIZE_SQUARED === 0) {
        id.entry -= SIZE - 1;
        id.y += 1;
        id.x -= SIZE - 1;
      } else if (y !== 0 && y % SIZE === 0) {
        id.entry -= SIZE - 1;
        id.x += 1;
      } else {
        id.entry++;
      }

      for (let x = 0; x < COL_N; x++, col = col.right) {
        if (matrix[y][x] === true) {
          const newNode = new Node(col, { x: id.x, y: id.y, entry: id.entry });

          col.insertUp(newNode);
          col.size++;

          if (prev === null)
            this.rows[(id.y * 9 + id.x) * 9 + id.entry - 1] = newNode; // Index: (9y+x) * 9 + entry
          else prev.insertRight(newNode);

          prev = newNode;
        }
      }
    }
  }

  puzzleToGrid(puzzle: number[][]) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (puzzle[y][x] > 0) {
          const num = (y * 9 + x) * 9 + puzzle[y][x] - 1;
          const row = this.rows[num];

          this.cover(row.column);
          for (let right = row.right; right !== row; right = right.right)
            this.cover(right.column);
        }
      }
    }
  }

  search(k: number) {
    if (this.headerNode.right === this.headerNode) {
      return true;
    }

    if (k > 100) throw new Error("Too deep");

    let col = this.headerNode.right;
    for (let right = col.right; right !== this.headerNode; right = right.right)
      if (right.size < col.size) col = right;

    this.cover(col);

    for (let row = col.down; row !== col; row = row.down) {
      this.solution.push(row);

      for (let right = row.right; right !== row; right = right.right)
        this.cover(right.column);

      if (this.search(k + 1)) return true;

      for (let left = row.left; left !== row; left = left.left)
        this.uncover(left.column);

      this.solution.pop();
    }

    this.uncover(col);
    return false;
  }

  cover(col: Node) {
    col.right.left = col.left;
    col.left.right = col.right;

    for (let row = col.down; row !== col; row = row.down) {
      for (let right = row.right; right !== row; right = right.right) {
        right.down.up = right.up;
        right.up.down = right.down;
        right.column.size--;
      }
    }
  }

  uncover(col: Node) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let left = row.left; left !== row; left = left.left) {
        left.down.up = left;
        left.up.down = left;
        left.column.size++;
      }
    }

    col.right.left = col;
    col.left.right = col;
  }

  solve(puzzle: number[][], preserveOriginal: boolean = false) {
    this.puzzleToGrid(puzzle);

    if (this.search(0)) {
      if (!preserveOriginal) {
        puzzle = new Array(9);
        for (let i = 0; i < 9; i++) puzzle[i] = new Array(9);
      }

      this.solution.forEach((val) => {
        const { entry, x, y } = val.id!;
        puzzle[y][x] = entry;
      });

      return puzzle;
    }
    return null;
  }
}
