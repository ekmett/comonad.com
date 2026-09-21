# Inline figures

All four proposed figures are now implemented as quiet additions to the original
article flow. The kernels are Haskell compiled into the shared GHC/Wasm reactor;
JavaScript provides controls and draws the results. Historical article code is
preserved. Each caption links its Haskell module and a complete source bundle.

## Capture-avoiding substitution — Bound

`/reader/2015/bound/#binding-figure`

Four presets cover a free variable, the article’s nested substitution, a mixture
of free and bound occurrences, and shadowing. Naive and safe results sit side by
side, with free-variable sets. Changing binder spelling leaves the underlying
scope unchanged; the scope is available in a disclosure.

`BindingDemo.hs` uses a small self-contained Scope/Var encoding from the article’s
derivation, not the installed bound package or its generalized tree-lifting
representation. The figure illustrates correctness, not bound’s performance.
Independent canonical/de Bruijn conversion checks capture avoidance and alpha
invariance for every preset and spelling.

## Bit interleaving and Z-order — Revisiting Matrix Multiplication

`/reader/2013/revisiting-matrix-multiplication-part-1/#morton-figure`

An 8 × 8 grid shows the article’s Morton path (first coordinate in odd positions)
or a row-major path. Sliders and pointer selection connect a cell to its x/y bits
and interleaved key. A 2 × 2 query window counts aligned blocks at selectable
sizes. These are modeled block accesses, not CPU measurements.

`MortonDemo.hs` uses the article’s 64-bit shuffle. Tests independently interleave
bits for every grid cell, check unique visitation and key-to-position agreement,
and recompute both block counts across six widths. Large-coordinate performance
and the Part II comparison routine are outside this figure’s scope.

## Values forward, sensitivities backward — Reverse-mode AD

`/reader/2010/reverse-mode-automatic-differentiation-in-haskell/#ad-figure`

For f(x,y) = xy + sin(x), nine steps expose forward evaluation and the backward
sweep. The contributions at shared x add to y + cos(x). Both inputs are adjustable.
The diagram reads actual values, parents, and accumulated adjoints from Haskell.

`ADDemo.hs` is a small inspectable tape, not an execution trace of rad or ad.
Tests check the analytic gradient and central finite differences, including the
intermediate cos(x) contribution before multiplication adds y.

## Grow a tree and find the common ancestor — On-line LCA

`/reader/2015/online-lca/#lca-figure`

Select two nodes, add children, and revisit earlier tree versions. The diagram
marks queries, the answer, and nodes compared by the skew search. Both actual
comparison sequences are displayed: skew-binary paths and aligned parent walks.
Counts refer to ID equality checks after depth alignment, excluding trimming.

`LCADemo.hs` adapts the article’s skew-binary algorithm and logs its comparisons.
The modern companion corrects `consT w ra ts` to `consT w2 ra ts` in `lcaT`,
because ra is a half-width subtree. Both historical occurrences remain unchanged;
the proposed correction is in the editorial review ledger. All node pairs in
seven structurally different 64-node trees plus a singleton are checked against
ancestor lists, including returned path and cached size. Earlier input trees
remain queryable after growth. The UI allows 24 nodes; the kernel accepts 64.

## Later: structural discrimination

Beside Discrimination Is Wrong, a future figure could show structured keys split
into successively finer stable groups. Readers could see grouping, sorting, and
a join use the same key structure. This is still a proposal, not implemented.
