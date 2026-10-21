def solve_lights(initial):
    """Return a shortest list of (row, col) presses, or None.

    Input: a nonempty rectangular 0/1 grid; 1 is the target state.
    Coordinates in the returned list are zero-based.
    """
    if not initial or not initial[0]:
        raise ValueError("The board must not be empty")
    rows, cols = len(initial), len(initial[0])
    if any(len(row) != cols for row in initial):
        raise ValueError("The board must be rectangular")
    if any(cell not in (0, 1) for row in initial for cell in row):
        raise ValueError("Each cell must be 0 or 1")

    best = None
    for mask in range(1 << cols):
        board = [list(row) for row in initial]
        presses = []

        def press(row, col):
            presses.append((row, col))
            for dr, dc in ((0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
                rr, cc = row + dr, col + dc
                if 0 <= rr < rows and 0 <= cc < cols:
                    board[rr][cc] ^= 1

        for col in range(cols):
            if mask & (1 << col):
                press(0, col)

        for row in range(1, rows):
            for col in range(cols):
                if board[row - 1][col] == 0:
                    press(row, col)

        if all(board[-1]):
            if best is None or len(presses) < len(best):
                best = presses

    return best
