"""Check the published solver against independent state-graph searches."""
from collections import deque
from copy import deepcopy
from pathlib import Path
import random
import unittest

namespace = {}
exec((Path(__file__).parents[1] / "content/lights-solver.py").read_text(), namespace)
solve_lights = namespace["solve_lights"]


def moves(rows, cols):
    return [sum(1 << j for j in range(rows * cols)
                if abs(i // cols - j // cols) + abs(i % cols - j % cols) <= 1)
            for i in range(rows * cols)]


def grid(state, rows, cols):
    return [[(state >> (row * cols + col)) & 1 for col in range(cols)]
            for row in range(rows)]


def state_of(board):
    return sum(cell << i for i, cell in enumerate(sum(board, [])))


def bfs_distances(rows, cols):
    target = (1 << (rows * cols)) - 1
    distance = {target: 0}
    queue = deque([target])
    actions = moves(rows, cols)
    while queue:
        state = queue.popleft()
        for action in actions:
            next_state = state ^ action
            if next_state not in distance:
                distance[next_state] = distance[state] + 1
                queue.append(next_state)
    return distance


class LightsSolverTest(unittest.TestCase):
    def check_solution(self, board, solution):
        rows, cols = len(board), len(board[0])
        state = state_of(board)
        actions = moves(rows, cols)
        for row, col in solution:
            self.assertTrue(0 <= row < rows and 0 <= col < cols)
            state ^= actions[row * cols + col]
        self.assertEqual(state, (1 << (rows * cols)) - 1)
        self.assertEqual(len(solution), len(set(solution)))

    def test_every_small_board_against_bfs(self):
        # BFS explores physical actions, independently of the solver's row chase.
        for rows, cols in [(1, 1), (1, 5), (5, 1), (2, 3), (3, 2), (2, 4), (4, 2), (3, 3)]:
            distances = bfs_distances(rows, cols)
            for state in range(1 << (rows * cols)):
                board = grid(state, rows, cols)
                original = deepcopy(board)
                result = solve_lights(board)
                self.assertEqual(board, original)
                if state in distances:
                    self.assertIsNotNone(result)
                    self.assertEqual(len(result), distances[state], (rows, cols, state))
                    self.check_solution(board, result)
                else:
                    self.assertIsNone(result)

    def test_published_example(self):
        board = [[int(bit) for bit in row] for row in ["01000", "00000", "01110", "01001", "11101"]]
        answer = solve_lights(board)
        self.assertEqual(answer, [(0, 0), (0, 3), (1, 1), (2, 0), (2, 4), (3, 3)])
        self.check_solution(board, answer)

    def test_five_by_five_rank_and_generated_boards(self):
        # A bit-vector basis checks the claimed rank without using row chasing.
        basis = {}
        for vector in moves(5, 5):
            while vector:
                pivot = vector.bit_length() - 1
                if pivot in basis:
                    vector ^= basis[pivot]
                else:
                    basis[pivot] = vector
                    break
        self.assertEqual(len(basis), 23)
        random_source = random.Random(20260929)
        for _ in range(64):
            state = (1 << 25) - 1
            for action in moves(5, 5):
                if random_source.randrange(2):
                    state ^= action
            board = grid(state, 5, 5)
            answer = solve_lights(board)
            self.assertIsNotNone(answer)
            self.check_solution(board, answer)

    def test_solved_unsolvable_and_invalid_inputs(self):
        self.assertEqual(solve_lights([[1] * 5 for _ in range(5)]), [])
        self.assertIsNone(solve_lights([[1, 0]]))
        for board in [[], [[]], [[1], [1, 0]], [[2]]]:
            with self.assertRaises(ValueError):
                solve_lights(board)


if __name__ == "__main__":
    unittest.main()
