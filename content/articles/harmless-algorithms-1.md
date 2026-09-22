## Introduction

The first thing that I want to discuss are the various forms of fine occlusion culling algorithms out there. Fine occlusion culling is the process of separating actually visible polygons from a predetermined potentially visible set. These algorithms do not generally offer any order of magnitude speed increase to an average engine in and of themselves, however some of them do provide tools useful to more general algorithms and visibility structures.

I am assuming at this point that the reader is at least generally familiar with a BSP tree's sorting properties, what a portal is, and is capable of rasterizing their own polygons or of using a 3d hardware API such as Glide, OpenGL or Direct3d. I also assume at least passing familiarity with linked lists, binary trees, and other conventional data structures and algorithms.

The use of floats throughout here is intentional for subpixel accuracy and ease of reading, if you prefer fixed points so be it.

The algorithms that will be covered here are the following:

> *   [S-Buffers](#sbuffer)
> *   [Binary Span Trees (BST)](#bst)
> *   [C-Buffers](#cbuffer)
> *   [Active Edge Lists (AEL)](#ael)
> *   [Active Edge Heaps](#aeh)
> *   [Triage Masks](#triage)
> *   [Beam Trees](#beamtrees)

## S-Buffers

<span id="sbuffer"></span>The s-buffer algorithm is described in Paul Nettle's s-buffer FAQ, and is a good starting place for looking at fine occlusion culling.

A classic s-buffer span-converts a polygon into a list of line segments. You have 1 bucket per scanline, and in that scanline you maintain a structures or class for an individual span which generally looks like:

```cpp
class classic_sbuffer_span {
      float start_x;
      float end_x;
      float start_ooz; // 1/z, d(1/z)/dx

      ...              // gradient setup for u and v, etc

      classic_sbuffer_poly * poly;
      classic_sbuffer_span * next;
};
```

In your poly object you contain information that is invariant over the entire poly (i.e. d(1/z)/dx, d(1/z)/dy) and as you insert spans into the buffer you clip against existing spans. How this is done depends on whether or not you can depend on the polygons going into the sbuffer to be sorted or not.

*Interpenetrating Version:*

> Given the truly general case, which would allow for interpenetrating spans and spans being inserted out of order, your inner loop for inserting a given span not only has to look for what spans your introduced polygon overlaps, but whether the interpolated 1/z regions overlap, and if they do, if the intersection is on or off of the existing span and the inserted span. The number of special cases you need to handle in your inner insertion loop can grow prohibitive. Also since you can later occlude a polygon that seemed like it was going to be in front, you have to do all of your rendering in a post process or you risk unnecessary overdraw.

*Non-Interpenetrating Version:*

> Given the slightly less general case of assuming that there are no interpenetrating while still inserting spans out of order, you can handle most static worlds. Your inner loop simplifies tremendously compared to the more general algorithm.

*Immediate Rendering Version:*

> Next option. Instead of storing the gradient information, or for that matter any information about the polygon in a span other than its starting and ending x position, and its starting z and d(1/z)/dx, you can make the assumption that whatever is feeding you polygons is doing so in a 'roughly' front to back order. If this is the case you can render each span when you clip it. This greatly shrinks the size of the individual span structures (to less than the size of a Pentium cache line) which can improve your performance quite significantly. Now you no longer have a second pass through a fairly large data structure, but you risk some overdraw in the case of an imperfectly sorted scene and software rendering. This algorithm also has the advantage that it renders in a texture coherent fashion.

This data structure looks more like:

```cpp
class immediate_sbuffer_span {
      float start_x;
      float end_x;
      float start_ooz;
      float doozdx;
      immediate_sbuffer_span * next;
};
```

## Binary Span Trees

<span id="bst"></span>Tom Hammersley devised this algorithm and used to have a detailed description and source code up on his now non-existant website. The span tree is very similar to the classic binary search tree algorithm.

The first assumption made is that all polygons will be coming to this algorithm in presorted order as from a conventional BSP tree or a recursive portal engine.

Now you can only handle input that comes in perfect front-to-back order. Certain portal algorithms and BSP key sorting can provide this, but generally they do not provide this for dynamic actors. This generally means that dynamic objects have to be moved off into another stage of the pipeline in order to use this algorithm. This is not necessarily a bad thing depending on the purpose for the engine in question.

Dynamic objects would then need to be z-buffered in, or clipped and then inserted into the BSP before this stage. For hardware, inserting all of the objects which are in visible BSP nodes directly into the zbuffer is generally the most expedient approach.

The fundamental change is switching to a binary tree based structure:

```cpp
class bst_span {
      float start_x, end_x;
      bst_span * next, * prev;
};
```

Insertions clip their way down the tree. If you are lucky, the tree may reduce the number of spans visited as you clip your node.

Relative to the more general s-buffer algorithm above, its primary speed up comes from the assumption of front-to-back order reducing the amount of clipping, than from any gains made by the tree itself.

The problems I see with this algorithm is that its really just not seeing the forest for the trees. (no pun intended) In general, the goal of this algorithm, that is, the reduction of the number of spans visited during the clipping and display of a given span is valid, but I have found that in practice (for me) a simpler algorithm (the c-buffer algorithm which follows) gives better results.

An additional trait that is important in several of these algorithms, that this approach provides, is the ability to check if a polygon silhouette would be visible (span convert the polygon as if you were going to insert into the tree, quit when you get your first visible sub span). You can perform this operation on the s-buffer algorithms above, but not without a great deal of z computations.

## C-Buffers

<span id="cbuffer"></span>What I dubbed a coverage buffer (c-buffer for short) is another constrained variant on the s-buffer algorithm. Again, like the Binary Span Tree we will make the assumption that you can get your polygons to this stage of the pipeline in BSP front-to-back order.

Your span definition shrinks to:

```cpp
class cbuffer_span {
    float start_x, end_x;
    cbuffer_span * next;
};
```

Then walk left to right through the linked list per scanline. As you walk if you clip on an existing node, congeal with it by just lowering its minimum x value or raising its maximum x value, if you are clipped on both sides, remove the second node, and expand the first one to its end boundary

```text
Example 1
  Poly to draw         -------------|XXXXXXXXXXXX|-----------
  Existing Span        -----|XXXXXXXXXXXX|-------------------
  Rendered portion     ------------------|XXXXXXX|-----------
  New Span in cbuffer  -----|XXXXXXXXXXXXXXXXXXXX|-----------    Example 2
  Poly to draw         ---------|XXXXXXXXXXXX|---------------
  Existing Spans       ------|XXXXX|------|XXXXXX|-----------
  Rendered Portion     ------------|XXXXXX|------------------
  New Span in cbuffer  ------|XXXXXXXXXXXXXXXXXXX|-----------    Example 3
  Poly to draw         ---|XXXXXXXXXXXXXXXXXX|---------------
  Existing Spans       ------|XXXXX|------|XXXXXX|-----------
  Rendered Portions    ---|XX|-----|XXXXXX|------------------
  New Span in cbuffer  ---|XXXXXXXXXXXXXXXXXXXXXX|-----------
```

Notice that examples 2 and 3 actually reclaimed a span data structure for use in later spans. As the screen fills up the coverage buffer, this algorithm actually lowers the number of spans in circulation, thus improving performance. The reason that it works is because with perfect front-to-back ordering, you do not care about the z information at all in the span buffer; you simply need to know the portions of the screen which have been covered. You know by definition of a bsp tree that the portions already rendered cannot be concealed by polygons further away in the tree. Render the portions as you walk the span buffer, and clip your polygon fragment. This way you do not need to retain any of the clipped values in the span buffer because you have already rendered them and filled in your z-buffer if you so choose.

Notice also that now there is no longer a correlation between the number of spans and the call to the rasterization routine, yet you still retain a single draw per pixel. When the scene is filled, you end up with a single fragment per scanline.

This algorithm also shares the desirable quick would-this-polygon-be-visible test as the Binary Span Tree above.

A variant proposed by Chris Babcock:

In practice it is better to start with one span per scanline, and redefine your spans to be areas where there are no polygons. In this case you start with one span and converge an empty list by eating away pieces of it.

Here's the "is visible" test for this variant:

```cpp
bool test_visible(cbuffer_line & line,int start_x,int end_x) {
     cbuffer_span *scan = line.spans;
     while (scan) {
        if (end_x <  scan->start_x) return false;
        if (start_x <= scan->end_x) return true;
        scan = scan->next;
     }
     return false;
}
```

## Active Edge Lists (AEL)

<span id="ael"></span>There are at least two very good descriptions of this algorithm floating around in Michael Abrash's Black Book (I can't recall if it was in the earlier Zen of Graphics Programming) and in Computer Graphics: Principles and Practice; because of this, I will just summarize the algorithm's relative strengths and weaknesses. An AEL allows insertion of the polygons in any order, but requires a two-pass walk since you have to build up the data structure and then afterwards you walk across the screen in a scanline coherent order while drawing.

Its strength resides in the fact that it scales better to higher resolutions than most of the algorithms above for software. Just like the first arbitrary order s-Buffer variants above, you can throw any old polygon at it and this stage of the pipeline will not choke.

Unfortunately it renders in a scanline coherent manner, which generally causes a speed hit because almost all of your texture accesses are incoherent. Also, the two-stage rendering structure means you wind up building up the structure, having it go out of cache while you walk the scene and then have to walk through it all over again.

Other concerns include that there are many data structures built up here, a linked list per scanline of edges that begin and end, a structure representing all of the information needed to rasterize a given polygon, and then the sorted list of edges that you use as you walk across the scanline, and the small list of polygons that overlap the current pixel. Each one unto themselves is fairly minor, but it does add significant complexity to an implementation.

This algorithm does not possess a corollary to the visible polygon test, which means that every potentially visible polygon needs to be inserted into the structure that is walked in the second stage. Depending on how conservative of a set your gross culling and occlusion algorithm is this may or may not be a problem (Witness quake which uses this algorithm).

## Active Edge Heaps (AEH)

<span id="aeh"></span>This is an algorithm I used briefly in a software rendering engine that I found useful enough to relate. Its goal was to address the number of data structures floating around in the Active Edge Table algorithm above by using a binomial heap.

Like the AEL approach above, this algorithm does not require front to back sorting, nor does it even gain anything from it.

For those not familiar with a binomial heap, I refer you to any of Robert Sedgewick's books on Algorithms (or for that matter almost any Algorithm text). A binomial heap is also known as a priority queue, and is used for the heap sort.

A heap is a form of binary tree that is always packed in memory (which is very good for cache coherence). The basic change is to use either an xy pair or a screen coordinate as a key for a node in the binomial heap. Initialize each edge with the position along each edge at its top y coordinate.

```cpp
class aeh_edge {
      int type;  // start or end of a span - 1 or -1.
      float x, ooz;
      int y, last_y;
      float dxdy, doozdx, doozdy;
      aeh_poly * poly;
};
```

One property provided by a binomial heap is the ability to quickly extract the entry with the highest priority (or lowest key). Using the key as the current xy value of a given entry, you will automatically start on the top scanline with the beginning of the first span by extracting the top node of the heap.

pseudo-code:

```cpp
while (heap isnt empty) {
    look at node at top of heap
       if its the start of an edge add poly to the list of current spans.
       else remove poly from the list of current spans.             increase y, if its less than last_y then
       add dxdy and doozdy to the x and ooz values and reinsert (you can
       quickly reinsert the top node of a binomial heap by decreasing its
       priority and then verifying the heap sorting property.)             draw from the coordinate stated to the node at the top of the heap.
}
```

There are fewer data structures than in the case of an AEL. You no longer have the separate buckets per scanline for insertion and deletion of nodes on each pass. The initial insertion cost of each of the edges is higher than for an AEL and you are still stuck with a two-pass data structure. On the other hand, you aren't stuck iterating through the list of active edges for every scanline to insert and delete each one that begins or ends on a given scanline.

I present this algorithm as an example of the trade-offs involved in different approaches. This lacks a quick polygon visibility just test like the Active Edge Table method above unfortunately does.

## Triage Masks

<span id="triage"></span>Ned Greene of Apple published a very interesting and [often overlooked paper](http://www2.bloodshed.com/cgi-bin/pm.cgi?filename=greene96.ps&page=db) on the subject of a variant on Warnock's algorithm (quadtree subdivision of the view) that used what he called triage masks. Rather than present his work here, I'll simply provide a [pointer](http://www2.bloodshed.com/cgi-bin/pm.cgi?filename=greene96.ps&page=db) to the original document, a brief overview, and compare and contrast it with the other algorithms above.

Triage mask are a hierarchial form of coverage buffering that uses binary bit operations to check for occlusion or probable occlusion. In his paper, Ned Greene used 8x8 masks which required 64 bit binary operations. The intersection or union of 3 or more masks provides the silhouette at a given depth of this hierarchial occlusion structure. In short the triage mask data structure enables you to quickly evaluate if a polygon is visible or not with a few binary operations, and if the resolution of that query is insufficient to find out what subcels you need to zoom in on and evaluate to determine whether or not the polygon is visible.

The requirements are the same as for the Binary Span Tree and for the C-Buffer: Perfect front to back presorting.

The good part of this algorithm is that as your scene fills up you can quickly reject whole polygons with a handful of binary operations.

Problems include that the preprocess of generating the masks is easy to mess up and I haven't yet found a way to do the edge of cel intersections as fast as I'd like to. Scaling up in multiples of 8x8 is somewhat scary, given your virtual screen resolutions for this go from 8x8 to 64x64 to 512x512 to 4096x4096, and while that is reassuring for future video resolutions, under 1024x768 or so this algorithm seems to be, for me, a net loss.

This algorithm supplies a very good spot checked polygon visibility test.

## Beam Trees

<span id="beamtrees"></span>Unlike the rest of the algorithms above, this algorithm takes place in object space. This means that you can get away cheaper on the polygons that you do not display. Another concern not addressed by the methods above is the matter of subpixel accuracy and conservative estimation. This algorithm is also applicable for shadow casting light sources, but that is another topic for another day.

A beamtree, as I describe herein, should really be thought of as a 3 dimensional structure. It really is just a specialized form of BSP tree. In a beamtree all planes pass through the origin (the eye point). Other than that it subdivides the view as you walk from front to back through the scene into drawn and undrawn sections, much like a solid BSP can divide between solid portions of the map and air. Since all planes pass through the origin, their 'd' component is always 0, which means you do not need to normalize the planes during beamtree generation because when you use the distances from the plane for linear interpolation, the magnitude of the plane 'normal' is irrelevant and cancels itself out.

In short, the plane passing through two points in the scene and the origin is:

```text
plane' = (v1-eye) cross (v2-eye)
```

then to get the side of that plane any point is on:

```text
side = the sign of ((vertex-eye) . plane')
```

For a given viewpoint, the beamtree is used by putting in place 4 'slabs' representing the left, right, top and bottom of the viewing frustum.

This gives you a degenerate tree like:

```text
    left
   /    \
solid   right
        /    \
    solid    top
             /  \
         solid  bottom
                /    \
             solid   open
```

The above use of an arbitrary plane and its opposite is necessary, because otherwise the first plane you inserted into the beamtree would cause half of the field of view from the light source to fall into shadow.

When you insert a polygon, you walk down the beamtree with all of the points in your polygon, visiting each side that the points lie on.

You do not need to define the leaf nodes. Anything that opens to an empty 'left' child is solid anything opening to an empty 'right' child is open and unrendered. so think of left and right as 'drawn/undrawn' or vice versa.

Your recursive insertion routine would look something like:

```cpp
#define EPSILON 1.0e-6     int convervative_signof(float value) {
     int result;
     if (value < -EPSILON) return 1;
     else if (value > EPSILON) return 2;
     else return 0;
}     bool recursive_insertion(vertex * fragment, int nvertices, beamtree_node & node) {
     int sign=0, * signs = (int *)alloca(nvertices*sizeof(int));
     for (int i=0;i<nvertices;++i) {
         sign |= signs[i] = conservative_signof (fragment[i] dot node.plane);
     }
     if (sign == 1) {
         // generally you just throw these away as terminating on a solid node.
     } else if (sign == 2) {
         right_attach(fragment,nvertices,node);
     } else if (sign == 3) {
         if (node->left) {                  in here find the contiguous set of vertices that have a
             conservative_signof of all 0's and 1's, passing along any
             2's that precede or follow a beginning or final 1. this
             needs to wrap around to the beginning of the set as well.                  recursive_insertion(the set, # of verts, *node->left);
        } else {
             // throw it away as terminating on a solid node
        }             out here find the contiguous set of vertices that have a
        conservative_signof of all 0's and 2's, and along any 1's
        that precede or follow a beginning or final 2.             if (node->right) {
            recursive_insertion(the set, # of verts, *node->right);
        } else {
            right_attach(the set, number of vertices in the set, node);
        }
     }
}
```

right\_attach takes the edges between the supplied vertices and inserts them as planes using the equation given on the right hand side of the current plane.

In short, when you recurse to a solid node you throw away that fragment because its occluded.

When you recurse to an open node, you take all edges of the polygon that have a point that has recursed this far and insert those edges as solid planes, the consistency of your clockwise or counterclockwise winding will orient the plane to maintain the proper sidedness relationship.

Any polygon that requires you to modify the tree is visible.

You can give the eye a 360 degree frustum with the following trickery:

```text
      plane
      /   \
   -plane  open
    /  \
solid   open
```

If you don't start with some arbitrary plane, the first plane being inserted at the root would occlude half the surfaces from the standpoint of the light.

Relative to the rest of the algorithms above, this approach is least likely to run afoul of pixel sized gaps due to scan conversion problems.

If you are looking for similar algorithms to compare with, this is very similar to Naylor's algorithm for performing CSG with a BSP tree and a B-rep.

This algorithm provides a polygon visibility test, its not as fast as the triage or cbuffer polygon visibility test, but it has the potential to avoid a lot of scan conversion problems that affect the other algorithms.

I will be supplying tricks to collapse a beamtree in manners similar to the cbuffer algorithm, when I get around to talking about lighting.

## Summary

These algorithms do not in-and-of-themselves solve visibility problems; they are merely ways to take polygons from a pretty good guess of what is visible and determine if they are indeed visible. When combined with some on-the-fly gross culling/vis system they can be used to build a viable engine. Next time I'll review some of the various visibility systems, which of these that they will work with, and the relative merits and flaws of each.

Indeed all of the algorithms above can potentially run afoul of problems when used in conjunction with hardware; if your edge conversion doesn't exactly correspond with the algorithm used by the graphics card you may wind up with fragments of polygons that your algorithm says aren't visible. The beamtree avoids one stage in which this error usually crops up, but it doesn't shrink as polygons are added as does the cbuffer algorithm.

Which of these you use (or if you use another) should probably be determined by what gross culling and visibility determination algorithm you are using and whether or not you are writing for hardware, software, or a hybrid game engine.

*Harmless*  
April 8, 1999

You can contact the author at the following address: [harmless@bloodshed.com](mailto:harmless@bloodshed.com)

You can also check out his web site at: [http://www.bloodshed.com](http://www.bloodshed.com/)

*This document is (C) 1999 Edward Kmett and may not be reproduced in any way without explicit permission from the author (Edward Kmett).*
