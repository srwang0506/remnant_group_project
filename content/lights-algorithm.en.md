#### 1. State the problem precisely

The light floor is an instance of **Lights Out**, a classic algorithmic puzzle. The project guide describes the same first-row enumeration used below [\[1\]](#lights-ref-en-1). This notebook develops that idea into a solver; the Python is a standalone explanation of the rule, not the Unreal Engine implementation.

Consider an $m\times n$ rectangular board. A press flips its own cell and its orthogonal neighbors. Diagonals are unchanged, and the edges **do not wrap around**. A corner press changes three cells, an edge press four, and an interior press five on our $5\times5$ board.

Write the initial state as $s_{r,c}\in\{0,1\}$: cyan is $1$, orange is $0$. REMNANT asks for **all lights on**. The usual all-off convention becomes the same problem if we work with the mismatch from the target:

$$
d_{r,c}=s_{r,c}\oplus t_{r,c},\qquad t_{r,c}=1.
$$

Here $\oplus$ means XOR, or addition modulo two. A mismatch of $1$ means that a cell needs an odd number of flips. A mismatch of $0$ needs an even number, including zero. Our task is to find a press pattern that removes every mismatch; a second task is to use as few presses as possible.

#### 2. Replace action sequences with binary decisions

Two presses on the same cell cancel. The order of presses also makes no difference, because XOR is associative and commutative:

$$
\begin{aligned}
a\oplus1\oplus1&=a,\\
a\oplus b\oplus c&=a\oplus c\oplus b.
\end{aligned}
$$

We can therefore describe a solution by $p_{r,c}\in\{0,1\}$, recording whether a cell is pressed once. There is no need to search through all possible orders or repeated actions. The final state is

$$
\begin{aligned}
s'_{r,c}={}&s_{r,c}\oplus p_{r,c}\oplus p_{r-1,c}\\
&\oplus p_{r+1,c}\oplus p_{r,c-1}\oplus p_{r,c+1}.
\end{aligned}
$$

All press variables outside the board are zero. Setting $s'_{r,c}=t_{r,c}$ gives one parity constraint for each cell. A direct enumeration still has $2^{mn}$ candidate press patterns: for $5\times5$, that is $2^{25}=33{,}554{,}432$. The grid structure lets us do much better.

#### 3. Guess the first row, derive the rest

Choose the presses in row 1. Once those choices are fixed, inspect that row: every orange cell must be flipped by pressing the cell directly below it. Among presses in later rows, that is the **only** press that can still change this cell. Pressing in row 3 or below cannot reach row 1.

Use row 2 to finish row 1, row 3 to finish row 2, and so on. This is often called **light chasing**. In terms of the original mismatch and the press decisions, its recurrence is

$$
\begin{aligned}
p_{r+1,c}={}&d_{r,c}\oplus p_{r-1,c}\oplus p_{r,c}\\
&\oplus p_{r,c-1}\oplus p_{r,c+1},\qquad r<m.
\end{aligned}
$$

The same zero boundary convention applies, including $p_{0,c}=0$. This equation uses the **initial** mismatch $d$. In a mutable-board implementation, the equivalent instruction is simply: if the cell above is currently orange, press below it.

There is no row beneath row $m$. After chasing, the last row must already match the target. Equivalently, every column must satisfy

$$
\begin{aligned}
&d_{m,c}\oplus p_{m-1,c}\oplus p_{m,c}\\
&\qquad\oplus p_{m,c-1}\oplus p_{m,c+1}=0.
\end{aligned}
$$

A failed last row rejects the chosen first-row pattern. It does not justify pressing arbitrary cells in the last row again, since that would disturb the row above. For five columns, we only need to try $2^5=32$ first-row patterns.

#### 4. Why this finds every solution, including the shortest

**Soundness.** After processing row $r+1$, row $r$ matches the target. Later presses are too far away to affect it. By induction, the first $m-1$ rows are correct when the chase ends; the explicit last-row check establishes that the entire board is correct.

**Completeness.** Take any valid press pattern. Its first row is among the patterns we enumerate. Once that row is fixed, the parity equation forces its second row, then its third, and so on. Our chase therefore reconstructs that exact pattern. No solution is missed.

**Minimum number of presses.** A shortest action sequence never presses one cell twice, because removing both presses preserves the final board. Since the search covers every binary solution, retaining the valid pattern of smallest Hamming weight gives a global minimum under the rule that every press costs one:

$$
p^*\in\operatorname*{arg\,min}_{p\text{ valid}}
\sum_{r=1}^{m}\sum_{c=1}^{n}p_{r,c}.
$$

The sum here is an ordinary integer sum, not XOR. Stopping at the first valid candidate finds a solution, but does not in general establish that it is shortest. If no first-row candidate succeeds, the board is unsolvable under these rules.

#### 5. A trace you can check against the interactive board

Reset the example above. In the following table, bits run from **left to right across a row**. The initial board is constructed by starting from all ones and pressing $(1,1),(1,4),(2,2),(3,1),(3,5),(4,4)$, using one-based coordinates. Repeating those six presses must restore it, which also guarantees that the example is solvable.

<!-- worked-example:en -->

Try first-row presses `10010`. After applying them, row 1 is `10111`, so row 2 must be pressed at column 2: `01000`. Continue the same reasoning downward. The table records the resulting choices; the last row ends as `11111`. The exhaustive search confirms that this six-press solution is shortest. The displayed rows describe press decisions, not the chronological animation of the board.

#### 6. A complete Python solver

The function accepts a rectangular list of rows and leaves its input unchanged. It returns a shortest list of **zero-based** coordinates; `[]` means the board is already solved, while `None` means there is no solution. Equal-length solutions are resolved by keeping the first one encountered.

<!-- solver-code -->

For the reset board in the table, the returned coordinates are `[(0, 0), (0, 3), (1, 1), (2, 0), (2, 4), (3, 3)]`. The bit at position `col` in `mask` corresponds to that column; column 0 is the leftmost cell even though ordinary binary numerals are usually printed with their least significant bit on the right.

#### 7. Time and space

There are $2^n$ first-row choices. Each candidate copies an $m\times n$ board and visits each cell a constant number of times; each press changes at most five cells. The implementation therefore uses

$$
\begin{aligned}
T(m,n)&=O(mn\,2^n),\\
S(m,n)&=O(mn).
\end{aligned}
$$

Space includes the current board, its press list and the best list retained so far. On a $5\times5$ board, the search processes only 32 candidates. For a long rectangle, transpose the board so that the enumerated row has the smaller dimension; after mapping the coordinates back, the time bound becomes $O(mn\,2^{\min(m,n)})$. This is still exponential in the smaller dimension, not a polynomial-time claim for arbitrary board sizes.

#### 8. The linear-algebra view

Flatten the board into $N=mn$ cells. Construct a binary matrix $A$ with $A_{ij}=1$ exactly when pressing cell $j$ flips cell $i$. It has ones on its diagonal and at orthogonal-neighbor positions. The parity constraints become

$$
Ap=d\quad\text{over }\mathbb F_2.
$$

Gaussian elimination works here by XORing rows of the augmented matrix $[A\mid d]$. A row $[0\ \cdots\ 0\mid1]$ proves inconsistency. Otherwise, set the free variables to obtain one solution $p_0$, then describe all solutions with a basis of the kernel:

$$
\begin{aligned}
p&=p_0\oplus\bigoplus_{i=1}^{k}\alpha_i v_i,\\
\alpha_i&\in\{0,1\},\\
k&=N-\operatorname{rank}(A).
\end{aligned}
$$

For the standard non-wrapping $5\times5$ rule, $A$ has rank 23 and nullity 2. A solvable board therefore has four binary press patterns; only one quarter of all starting boards can reach a fixed target. These are established properties of the classic puzzle [\[2\]](#lights-ref-en-2).

Ordinary dense elimination takes $O(N^3)$ binary field operations and $O(N^2)$ storage. It finds feasibility and a solution, but does not automatically minimize the press count. One approach is to enumerate the $2^k$ kernel combinations and compare their Hamming weights. On this board $k=2$, so that comparison is small. The matrix model also extends to other interaction graphs; the rectangular chase proof specifically relies on the neighbor geometry used here [\[3\]](#lights-ref-en-3).

#### 9. What this means for the game

The rule, the solver and the presentation should agree about boundaries and the target color. A generator can guarantee solvability by applying legal presses to a solved board, as this page does. Choosing all 25 colors independently cannot give that guarantee. The number of scrambling presses is also not a reliable difficulty measure: presses can cancel, and another solution may be shorter.

For play, a useful hint can reveal the next forced press after a first-row choice, leaving the player to recognize the pattern. A solver is also useful for checking authored boards and comparing their minimum press counts. Those are applications of the analysis; the interactive board above is a small demonstration of the flip rule.

#### References

1. <span id="lights-ref-en-1"></span>REMNANT team. *Guidebook for REMNANT*, §4.5, “Lighting Puzzle Gameplay: 5×5 Lights Out,” pp. 16–22. Project design document. Source for the game's target state, interaction rules and first-row enumeration; the original guide is not hosted on this page.
2. <span id="lights-ref-en-2"></span>Marlow Anderson and Todd Feil. [*Turning Lights Out with Linear Algebra*](https://www.jstor.org/stable/2690705). **Mathematics Magazine**, 71(4), 300–303, 1998. [Accessible paper](https://people.sc.fsu.edu/~jburkardt/classes/imps_2017/11_28/2690705.pdf). Binary linear model, rank and solution structure for the classic 5×5 board.
3. <span id="lights-ref-en-3"></span>Abraham Berman, Franziska Borer and Norbert Hungerbühler. [*Lights Out on graphs*](https://arxiv.org/abs/1903.06942). arXiv:1903.06942, 2019. Further reading on arbitrary interaction graphs and the distinction between finding a solution and minimizing it.
