#include <iostream>
#include <cmath>
#include <string>
#include <emscripten/emscripten.h>

#define SIZE 9
#define MAX_K 200

const int SIZE_SQUARED = SIZE*SIZE;
const int SIZE_SQRT = sqrt((double)SIZE);
const int ROW_N = SIZE*SIZE*SIZE;
const int COL_N = SIZE*SIZE*4;

struct Node {
    Node *left;
    Node *right;
    Node *up;
    Node *down;
    Node *head;

    int size;
    int gridId[3]; // [entry, y, x]

    Node() {
        this->left = this;
        this->right = this;
        this->up = this;
        this->down = this;
        this->size = 0;
    }

    void insertRight(Node* node) {
        node->left = this;
        node->right = this->right;
        this->right->left = node;
        this->right = node;
    }

    void insertDown(Node* node) {
        node->up = this;
        node->down = this->down;
        this->down->up = node;
        this->down = node;
    }

    void insertUp(Node* node) {
        node->down = this;
        node->up = this->up;
        this->up->down = node;
        this->up = node;
    }
};

struct Node Head;
struct Node* HeadNode = &Head;
struct Node* solution[MAX_K];
struct Node* original_values[MAX_K];
struct Node* rows[ROW_N];
bool matrix[ROW_N][COL_N] = { { 0 } };
bool isSolved = false;

void cover(Node* col) {
    col->left->right = col->right;
    col->right->left = col->left;

    for(Node* row = col->down; row != col; row = row->down) {
        for(Node* node = row->right; node != row; node = node->right) {
            node->down->up = node->up;
            node->up->down = node->down;
            node->head->size--; 
        }
    }
}

void uncover(Node* col) {
    for(Node* row = col->up; row != col; row = row->up) {
        for(Node* node = row->left; node != row; node = node->left) {
            node->down->up = node;
            node->up->down = node;
            node->head->size++; 
        }
    }

    col->left->right = col;
    col->right->left = col;
}

void buildSparseMatrix(bool matrix[ROW_N][COL_N]) {
    int x = 0;
    int counter = 0;
    int xOffset = 0;

    // Cell constraint
    for (int y = 0; y < ROW_N; y++) {
        matrix[y][x] = true;
        counter++;

        if (counter >= SIZE) {
            x++;
            counter = 0;
        }
    }

    // Row constraint
    xOffset = SIZE_SQUARED;
    for(int i = 0; i < SIZE; i++) {
        x = 0;
        for(int y = 0; y < ROW_N; y += SIZE) {
            matrix[y + i][xOffset + x + i] = true;

            counter++;
            if(counter != 0 && counter%SIZE == 0)
                x += SIZE;
        }
    }

    // Column constraint
    xOffset = SIZE_SQUARED * 2;
    x = 0;
    for (int y = 0; y < ROW_N; y++) {
        matrix[y][x + xOffset] = true;

        x++;
        if (x >= SIZE_SQUARED)
            x = 0;
    }

    // Block constraint
    for (int i = 0; i < SIZE; i++) {
        xOffset = SIZE_SQUARED * 3;
        counter = x = 0;
        for (int y = 0; y < ROW_N; y += SIZE, counter++) {
            if (counter != 0 && counter % (SIZE * SIZE_SQRT) == 0) {
                xOffset += SIZE * SIZE_SQRT;
                counter = x = 0;
            }
            else if (counter != 0 && counter % SIZE == 0) {
                x = 0;
            }
            else if (counter != 0 && counter % SIZE_SQRT == 0) {
                x += SIZE;
            }

            matrix[y + i][x + xOffset + i] = true;
        }
    }
}

void matrixToLinkedList(bool matrix[ROW_N][COL_N]) {
    Node* header = new Node();
    header->head = header;

    for(int x = 0; x < COL_N; x++) {
        Node* newNode = new Node();
        header->insertRight(newNode);
    }

    int ID[3] = {0,0,0};
    for(int y = 0; y < ROW_N; y++) {
        Node* col = header->right;
        Node* prev = NULL;

        if(y != 0 && y%SIZE_SQUARED == 0) {
            ID[0] -= (SIZE - 1);
            ID[1] += 1;
            ID[2] -= (SIZE - 1);
        }
        else if(y != 0 && y%SIZE == 0) {
            ID[0] -= (SIZE - 1);
            ID[2] += 1;
        }
        else {
            ID[0]++;
        }

        for(int x = 0; x < COL_N; x++, col = col->right) {
            if(matrix[y][x] == 1) {
                Node* newNode = new Node();
                newNode->gridId[0] = ID[0];
                newNode->gridId[1] = ID[1];
                newNode->gridId[2] = ID[2];
                newNode->head = col;

                col->insertUp(newNode);
                col->size++;

                if(prev == NULL) 
                    rows[(ID[1] * 9 + ID[2]) * 9 + ID[0]-1] = newNode; // Index: (9y+x)*9 + entry
                else
                    prev->insertRight(newNode);
                
                prev = newNode;
            }
        }
    }

    HeadNode = header;
}

void fillLinkedList(int puzzle[][SIZE]) {
    int i = 0;
    for(int y = 0; y < SIZE; y++) {
        for(int x = 0; x < SIZE; x++) {
            if(puzzle[y][x] > 0) {
                int num = (y*9 + x) * 9 + puzzle[y][x]-1;
                Node* row = rows[num];

                cover(row->head);
                for(Node* right = row->right; right != row; right = right->right) {
                    cover(right->head);
                }

                original_values[i++] = row;
            }
        }
    }
}

void search(int k = 0) {
    if(HeadNode->right == HeadNode) {
        isSolved = true;
        return;
    }

    Node* col = HeadNode->right;
    for(Node* right = col; right != HeadNode; right = right->right)
        if(right->size < col->size)
            col = right;
    
    cover(col);

    for(Node* row = col->down; row != col; row = row->down) {
        solution[k] = row;
        for(Node* right = row->right; right != row; right = right->right)
            cover(right->head);

        search(k + 1);

        row = solution[k];
        solution[k] = NULL;
        col = row->head;
        for(Node* left = row->left; left != row; left = left->left)
            uncover(left->head);
    }

    uncover(col);
}

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int *solve(int sudoku[SIZE][SIZE]) {
        buildSparseMatrix(matrix);
        matrixToLinkedList(matrix);
        fillLinkedList(sudoku); 
        search();
        
        static int solved[SIZE][SIZE] = {{0}};
        if(isSolved) {
            for (int i = 0; solution[i] != NULL; i++) {
                int* id = solution[i]->gridId;
                sudoku[id[1]][id[2]] = id[0];
            }
            return *solved;
        }
        return NULL;
    }
} 

int main() {
    return 0;
}