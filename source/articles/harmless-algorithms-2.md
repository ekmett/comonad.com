## Introduction

This time I want to cover several forms of scene traversal algorithms used to walk through common data structures. For the purposes of this column I will be assuming that the reader is familiar with BSPs and the concept of a portal. Like the fine culling systems overlap with the sorting properties of some of these approaches, some of these will share content with the visibility algorithms in the next installment of this column.

These algorithms generally require some form of visibility algorithm to be viable for a large scale scene. Some of these provide more information to a visibility algorithm than others; Some provide front-to-back ordering; Some work well in hardware environments; Some work better in software; Some inherently provide their own visibility information through the traversal.

Next time I will be covering visibility algorithms that work in conjunction with these traversals and the fine culling algorithms from the first column. Like the first one, this column is not meant to stand on its own.

Note, in the traversals below I have not incorporated the logic to fit the walk to the viewing frustum or to make the traversal obey an occlusion algorithm at all. This will be the subject of the next column.

This column is primarily intended to enumerate viable alternatives for use in engines for realtime 3d gaming that have worked in my experience. I am not attempting to cover every algorithm extant. I leave that enterprise to some ambitious grad student needing a subject for a dissertation. By no means do I wish to convey the misconception that this column can cover everything of use in 3d graphics. My goal is to point out observations and comparisons between various algorithms and provide alternate methods to a developer stuck in a rut using a given approach.

Scene Traversals:

> *   [BSP Trees](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#bsptrees)
>     *   [Planar Front-to-Back](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#bspfrontback)
>     *   [Leafy Front-to-Back](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#bspfrontbackleafy)  
>           
>         
>     *   [Quake BSP/PVS](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#bspquake)
> *   [Portals](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#portals)
>     *   [Recursive Front-to-Back Traversal](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#portalsrecursive)
>     *   [Keyed Queuing](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#portalskeyed)
>     *   [Concave/PVS](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#portalspvs)
> *   [Octrees](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#octrees)
>     *   [Hierarchical Front-to-Back Traversal](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#octh)  
>           
>         
>     *   [Neighbor Front-to-Back Traversal](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#octn)
> *   [KD-Tree](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#kdtrees)
>     *   [Hierarchical Front-to-Back Traversal](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#kdh)
>     *   [Neighbor Front-to-Back Traversal](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#kdn)
> *   [Other Structures](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#otheralgorithms)
>   
> 
> *   [Feudal Priority Trees](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#feudal)  
>     
> *   [Adaptive Octrees](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#adaptive)  
>     
> 
> *   [Summary](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml#summary)
>

## BSP Trees

<span id="bsptrees"></span>A BSP tree is quite frankly one of the most useful data structures out there for 3d graphics. Walking a BSP tree front-to-back is virtually identical to a conventional binary tree's inorder traversal The only difference is the definition of which of the children is the first node to be visited depends upon the sign of the dot product of the viewpoint and the plane normal of the parent node. I will refer to three of the more useful forms of polygon storage in a BSP tree below.

<span id="bspfrontback"></span>*Planar Front-to-Back:*

> A Planar BSP is what people usually think about when someone mentions a BSP tree. In a planar tree, you can effectively ignore the leaves for rendering purposes. You start with all of your polygons in one bucket, choose one via some heuristic, take that polygon and all polygons that a coplanar to it, create a BSP node, split the rest into two buckets and repeat until you have no polygon lying free in any bucket. Traversal of a Planar BSP from front-to-back is basically a variant on a standard binary tree inorder traversal.  
>   
> 
> ```cpp
> void PlanarBSPNode::planar_ftb(const Point & point) {
>      int   near = (point dot node.plane_normal >= 0.0);           if (child[near]) child[near]->planar_ftb(point);           for each polygon facing the near node in this plane {
>          polygon->render()
>      }           if (child[near^1]) child[near^1]->planar_ftb(point);
> }
> ```
> 
>   
>   
> Note: The 'render' routine for translucent polygons or polygons with transparencies places the polygons on a stack, which is popped away and rendered at the end of the frame.

<span id="bspfrontbackleafy"></span>*Leafy Front-to-Back:*

> A Leafy BSP is a useful data structure, often used by portal advocates as a quick-and-dirty means to obtain a portal set for arbitrary geometry. In addition to splitting as you walk down the BSP tree you then need to walk back up the BSP tree splitting the contents of the parent planes as you go. Afterwards you can organize the clipped polygon fragments into their assorted leaves. When this is done you no longer track which polygons lie in a given plane of the BSP tree, but instead you track which polygons act as faces for the individual BSP nodes.  
>   
> 
> ```cpp
> class LeafyBSPCommonParent {
>      // you can do this with typecasting and structs if need be.
>      ....
>      void leafy_ftb(const Point & point);
> }      void LeafyBSPNode::leafy_ftb(const Point & point) {
>      int   near = (point dot node.plane_normal >= 0.0);
>      child[near]->leafy_ftb(point);
>      child[near^1]->leafy_ftb(point);
> }      void LeafyBSPLeaf::leafy_ftb(const Point & point) {
>      for each polygon that forms a face that faces into this node {
>          polygon->render();
>      }
> }
> ```
 <span id="bspquake"></span>*Quake BSP:*

> If you are using a front-end rasterization routine like passing directly to hardware, an S-Buffer, Active Edge List, or Active Edge Heap, then there is little purpose to splitting the polygons as you walk down the BSP tree. Simply make a second reference to it in the compiler and all is well. If you allow multiple references to a given polygon to float around the tree you can simply adjust the polygon rendering routine to keep a frame index counter like the following:  
>   
> 
> ```cpp
> void Polygon::render() {
>      if (last_seen != frame_no) {
>         last_seen = frame_no;
>         ...do rendering here...
>      }
> }
> ```
> 
>   
>   
> The walk does not provide front-to-back ordering of the polygons. However in many cases you do not need this. It may cause additional overhead when dealing with translucent polygons (which will need to be sorted back to front). Since this walk will not provide front-to-back ordering in any event, there is little point in doing the scene traversal inorder. Quake gets away with much this same approach, by just taking the nodes from the potentially visible set and throwing their contents down the pipeline at the Active Edge List or openGL hardware.  
>   
> In this case, the purpose of the BSP then is to provide convex subregions and to serve as an aid to collision detection. It does not serve any ordering function for visitation.

## Portals

<span id="portals"></span>Before I cover the strengths and weaknesses of given portal traversals, I want to cover the distinction between convex and concave node based portal engines.

Convex Node:

> A convex node engine only allows a convex polyhedron to act as a node. Portals serve to connect individual nodes. Within a convex node engine it is quite possible to get perfect front-to-back ordering.

Concave Node:

> A concave node engine allows just about anything to serve as a node. It could be a room with some complex geometry, a BSP tree, an undulating mass of procedurally generating flesh, etc... A concave node engine does not lend itself to easily providing front-to-back ordering. As such it is really only suitable to frontend rasterizers such as hardware, S-Buffers, Active Edge Lists and Active Edge Heaps, like the Quake BSP approach above.

With this distinction in mind. I will proceed to the traversals generally used to walk through a conventional portalized scene.

<span id="portalsrecursive"></span>*Recursive Traversal:*

> The most obvious portal traversal is recursive. The algorithm is generally implemented something like the following:  
>   
> 
> ```cpp
> void Node::visit(PortalSilhouette & silhouette) {
>   if (last_seen != this_frame) {
>     last_seen = this_frame;
>     for each polygon do {
>       if (s->is_a_portal) {
>         Silhouette s = clip polygon using silhouette planes
>         next if s is empty.
>         s->remote_node->visit(s);
>       } else {
>         Polygon p = clipped polygon using silhouette planes
>         p->render();
>       }
>     }
>   }
> }
> ```
> 
>   
>   
> I cannot emphasize enough how poorly this algorithm scales up to higher polygon counts. You may wind up visiting a node several times because you reach it through different nodes, and because of the recursive clipping you may have to render each polygon in multiple discrete fragments. This engine is usually built because it seems to show promise when your engine is just a few rooms. This algorithm is designed to work with convex nodes.

<span id="portalskeyed"></span>*Keyed Queuing:*

> In an effort to fix the problems with the previous algorihm, another common variant that works if the nodes are obtained from a BSP tree is to use the BSP key for a given node and viewpoint to provide a sorting criteria. This assumes that the data structure used is roughly similar to that for the Leafy BSP above with the addition of portal information for the empty faces shared with neighboring nodes. The concept of sorting by a BSP key is introduced in Michael Abrash's Black Book.  
>   
> This walk involves a small binomial heap (priority queue) or sorted list of nodes not yet visited but adjacent to ones visited and visible. The contents of the queue are pulled off in front-to-back order, the nodes are rendered and checked for visible neighbors, which are then placed on the priority queue sorted by their BSP key.  
>   
> There are two forms of BSP keys that I have used. One can be generated by walking the BSP tree inorder from a given viewpoint while incrementing a counter at each leaf. The other can be created by walking down the BSP tree towards a given node and by recording as a bitstring every place where the side of the plane the eye resides on differs from the side the given node lies on. Two of these bitstrings can be compared to determine if a given node is nearer to the viewer than the other.  
>   
> Note even though this uses a BSP tree for sorting it is technically a portal algorithm because it traverses into its neighbors through the portals. The advantages this holds over Recursive Traversal is that a given node is only rendered once. The disadvantage is the cost of computing the keys.

<span id="portalspvs"></span>*Concave/PVS:*

> The simplest algorithm here for traversal is to allow anything to be in a node and to maintain a potentially visible set between concave nodes. The traversal is identical to the Quake BSP traversal above. Collision can be much harder to detect and handle; Collision detection is very important in a game, so consider this solution with care. Other issues include detecting what node you are presently in in the absence of convex boundaries. Usual fixes include declaring the node to be convex in shape but containing arbitrary geometry. This is a nice fast-and-loose algorithm for getting polygons on the screen though.  
>   
> 
> ```text
> for each node in the PVS for the viewpoint {
>     node->render();
> }
> ```
> 
>   
>   
> One could also use convex nodes for this algorithm which would improve collision detection and may offer other benefits to AI and software rendering, but this still leave determining the current node as a potential problem, if you have no a priori knowledge of the container for a point.

## Octrees

<span id="octrees"></span>An octree is a very simple data structure which has recently received a bit more hype than it is worth on its own. There is a decent Introduction to Octrees by Jaap Suter in the tutorial section here on flipCode, so I will not attempt to review that material here. Instead I will build upon it.

Octrees are very well suited to particular tasks such as finding objects in a given area, or locating likely polygons to attempt collision with; They are not necessarily any better suited to dealing with a static polygon soup than another structure is. By itself an octree does not provide a means of front-to-back traversal of the individual polygons within a leaf, however there are at least two workable front-to-back traversal for walking amongst the nodes themselves.

Different uses of this structure provide different answers as to what is the best polygon count to stop at when subdividing the octree and what should be used as a maximum recursion depth.

A common implementation would resemble the following:

```cpp
class octree_common {
    // note you don't need to store these, you can carry them down with you
    // as you walk the structure but its easier to demonstrate this way.
    float min_z, max_z, min_y, max_y, min_x, max_x;
    float avg_x() { return (min_x + max_x)/2; }
    float avg_y() { return (min_y + max_y)/2; }
    float avg_z() { return (min_z + max_z)/2; }

};       class octree_node : public octree_common {
    octree_common * child[8];
};       class octree_leaf : public octree_common {
    polygon_list polygons;
    object_list  objects;
    ...
};
```

Ordering the contents of the octree leaves with miniature BSP trees may be useful if perfect front-to-back ordering of the polygons is desired for another purpose.

<span id="octh"></span>*Hierarchical Front-to-Back Traversal:*

> Hierarchical traversal of an octree is based on the same plane separation principle that makes a BSP front-to-back walk work. In this case, think of a single node with its eight children as mimicking 3 levels of a BSP tree:  
>   
> 
> ```text
>               z plane
>              /       \
>       y plane         y plane
>      /       \       /       \
> x plane  x plane  x plane  x plane
> ```
> 
>   
>   
> All of the BSP traversals above will then work on the octree just as well as they will on a BSP tree itself. However, observation can simplify some of these traversals. Given which side of the 3 planes subdividing an octree node that the eye point is on you can perform a simpler traversal based on bit toggling. You have three planes and thus 3 sign bits. If you toggle any one bit you will get one of the 3 nodes which share a face with the leaf in question. If you toggle all 3 bits you will get the node in the far corner of the octree. Given this you can simply walk a given octree node from front-to-back by the following sequence.  
>   
> 
> ```cpp
> octree_node::hierarchical_ftb(Point & eye) {
>     int first      = ((eye.x() < avg_x()) ? 1 : 0) |
>                      ((eye.y() < avg_y()) ? 2 : 0) |
>                      ((eye.z() < avg_z()) ? 4 : 0);           child[first].hierarchical_ftb(eye);           child[first^1].hierarchical_ftb(eye); // toggle bit 0 \
>     child[first^2].hierarchical_ftb(eye); // toggle bit 1  these 3 can be in any order
>     child[first^4].hierarchical_ftb(eye); // toggle bit 2 /
> 
>     child[first^3].hierarchical_ftb(eye); // toggle bits 0 & 1 \
>     child[first^5].hierarchical_ftb(eye); // toggle bits 0 & 2  these 3 can be in any order
>     child[first^6].hierarchical_ftb(eye); // toggle bits 1 & 2 /
> 
>     child[first^7].hierarchical_ftb(eye); // toggle bits 0, 1 & 2
> }
> ```
> 
>   
>   
> This walk has the benefit of simplicity. On the other hand it incurs the overhead of walking through the hierarchy for the traversal.

<span id="octn"></span>*Neighbor Front-to-Back Traversal:*

> Neighbor Traversal requires some minor slight addition to the octree definition:  
>   
> 
> ```cpp
> class octree_common {
>       ...
>       int last_seen;
>       ...
> }       class octree_leaf : public octree_common {
>       ...
>       octree_common * neighbors[6];
>       ...
> }
> ```
> 
>   
>   
> These six pointers represent the node that lies adjacent to this leaf through any of its six faces.  
>   
> If you are deeper or of equal depth in the tree than the neighbor is then one or many little nodes will point into the same same-sized or larger adjacent node through a common face. If you are at the same height as the neighboring node you will both share the common face on a 1:1 correspondance.  
>   
> If you are higher in the tree then your one face will abutt have many leaves\_ on the one side of you. This is perfectly acceptable, and in this case you will not attach to the leaf, but to the parent or grandparent node that is at the same height as you in the tree. This is why the links are of an octree\_common type xrather than an octree\_leaf.  
>   
> To traverse from front-to-back through this kind of scene is virtually identical to the Keyed Queuing approach mentioned in the Portal section above. The primary change required is when you link from a leaf to a parent node through a common face, you need to recursively walk down checking the 4 children that share that face's corresponding face for visibility.  
>   
> There are some consequences to the modifications that this requires to the data structure. First of all, the neighbor links can become quite onerous to maintain if your octree is rapidly changing. Secondly, your traversal is now complicated by a priority queue and other data structures which may complicate development.

## KD-Trees

<span id="kdtrees"></span>A KD-Tree is nearly identical to a BSP tree. The differences between a BSP and a KD-tree include that a KD-Tree is forced to use axis aligned planes and the current level of the tree is used to determine which axis to split along.

A kd-tree node subdivides space into 2 smaller spaces like a BSP node. The additional restrictions upon a kd-tree are that the planes be axis aligned and the choice of axis is based on the current level in the tree.

```text
              z plane
             /       \
      y plane         y plane
     /       \       /       \
x plane  x plane  x plane  x plane
```

This is a classic kd-tree, and there exist many papers on the subject, off the top of my head Seth Teller uses kd-trees in his paper on visibility determination in densely occluded environments.

Note that a kd-tree splits on one plane at a time. This allows it to fit better than an octree, because the planes in the children can be at different offsets and because they fit to the data, allowing a relatively balanced structure.

One modification to the 'classic' kd-tree structure is to allow the choice of plane to split upon to vary at each level, this drives up your preprocessing cost by about a factor of 3, and adds a small bit of data to the tree, but can theoretically produce fewer splits, because you can choose your partitioning plane, by which plane when it would divide the child sets into two equal buckets would produce the fewest splits. Unfortunately this optimization, much like the balance vs. split heuristics in BSP tree generation can lead to degenerately shaped kd-tree nodes if left to run unchecked.

<span id="kdh"></span>*Hierarchical Front-to-Back Traversal:*

> Hierarchical traversal of a kd-tree is identical to hierarchical traversal of an octree as described above or to a front-to-back traversal of a BSP tree.

<span id="kdn"></span>*Neighbor Front-to-Back Traversal:*

> Neighbor traversal of a kd-tree can be performed in a similar manner to the neighbor traversal of the octree above, but it is not as effective. The reason is because the faces of the octree children at a given level all line up perfectly. In the kd-tree using the figure above, the two y aligned planes are likely to have chosen different offsets to split upon. This means that the neighbor traversal winds up severely handicapped as the traversal algorithm has to walk down to the leaf from a higher level node as the norm rather than the exception, unlike the octree neighbor traversal.

## Other Algorithms

<span id="otheralgorithms"></span><span id="feudal"></span>*Feudal Priority Trees:*

> <span id="feudal"></span>A feudal priority tree is a form of dynamic BSP tree suited to low polygon count environments. It has more relaxed requirements than a conventional BSP tree, but the runtime cost of using it can be much higher, and it doesn't scale well.  
>   
> [http://www.scs.ryerson.ca/h2jang/archive-19980507.html](http://www.scs.ryerson.ca/h2jang/archive-19980507.html) contains a brief description and includes the names of several papers on the subject.

<span id="adaptive"></span>*Adaptive Octrees:*

> An adaptive octree is an octree which allows the position of the split point in the center of an octree node to be displaced. In practice, I tend to prefer a kd-tree to an adaptive octree, but in some cases, the adaptive octree may consume less memory. In addition, the neighbor front-to-back traversal of an adaptive octree tends to be faster than for a kd-tree, because within a given octree node the partitioning planes line up.

## Summary

In summary, if you are writing a hardware only engine, a concave node based portal engine is probably a safe bet. The vagaries involved in collision in this environment can be overcome. The only real difficulty is that given an arbitrary object in 3d space, it can be a bit expensive to discover which nodes the object is touching, without tracking this information as the object moves around the level.

Octrees and kd-trees serve as a spatial subdivision mechanism, in and of themselves they cannot perform all polygon sorting, and in fact, on hardware you do not need polygon sorting except for surfaces with translucencies.

Next time, I will be covering methods for visibility that combine structures from both this and the previous issue.

*Harmless*  
April 29, 1999

You can contact the author at the following address: [harmless@bloodshed.com](mailto:harmless@bloodshed.com)

You can also check out his web site at: [http://www.bloodshed.com/](http://www.bloodshed.com/)

*This document is (C) 1999 Edward Kmett and may not be reproduced in any way without explicit permission from the author (Edward Kmett).*
