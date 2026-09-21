I gave a talk last night at [Boston Haskell](http://www.haskell.org/haskellwiki/Boston_Area_Haskell_Users%27_Group) on finger trees.

In particular I spent a lot of time focusing on how to derive the construction of Hinze and Paterson's 2-3 finger trees via an extended detour into a whole menagerie of tree types, and less on particular applications of the final resulting structure.

Overall, I think the talk went over quite well.

In other finger-tree-related news, Mark Chu-Carroll recently wrote a [blog post on finger trees](http://scienceblogs.com/goodmath/2010/04/finger_trees_done_right_i_hope.php) as well, which might serve as a faster introduction in case you don't want to wade through 50 slides before seeing something recognizable as a finger tree. The comments given in reply to his very timely article were very useful in fleshing out this presentation.

For those who are interested, while we have yet to establish a good way to record video, here are my slides.

-   [Finger Trees \[PDF\]](http://comonad.com/reader/wp-content/uploads/2010/04/Finger-Trees.pdf)

There are two parts of the talk that may be difficult to adequately reconstruct from the slides alone:

1.  I talked through the notion of safe and dangerous digits in a Hinze and Paterson tree and explained how the extra slop in a Hinze and Paterson tree work.
2.  The other part that was talked through largely via the blackboard was how one uses the monotonicity of the function passed to split.

Otherwise, you can probably reconstruct the narrative from the slides.

If you have any questions or spot any errors or grievous omissions, please feel free to contact me.

\[Edit: Updated slide 54\]
