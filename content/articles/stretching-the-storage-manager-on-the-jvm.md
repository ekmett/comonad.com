I wrote a little SIMD multithreaded mark-and-compact garbage collector for another C++ project a couple of days ago. It is called [jam](https://github.com/ekmett/jam).

Then I figured out how to add GHC-style [`System.Mem.Weak`](https://downloads.haskell.org/ghc/8.6.2/docs/html/libraries/base-4.12.0.0/System-Mem-Weak.html) finalizers and generalized weak pointers to it.

Around the same time, my original plan for getting that same part of GHC to work on the JVM for [THC](https://comonad.com/reader/2026/turbo-haskell/) had fallen apart. I was looking at doing what Luite Stegeman had done for [GHCJS](https://www.haskell.org/haskell-symposium/2013/ghcjs.pdf): running an additional reachability pass over the Haskell heap just to get the finalization semantics right.

That seemed like a mess.

On a lark, I tried putting Tab A into Slot B and just outright replacing the JVM’s garbage collector through HotSpot’s [GC interface](https://openjdk.org/jeps/304).

And it… just worked.

The result is [jam-vm](https://github.com/ekmett/jam-vm). Jam is now running as the garbage collector in patched builds of both OpenJDK and GraalVM. It collects the actual Java objects in the host heap, so Haskell closures can share that heap with everything else.

I do wish you could plug a collector in over JNI, rather than have to rebuild the JDK itself. Extensibility sort of falls down there. The interface makes it possible to add a collector to HotSpot; it doesn’t let a stock JVM load one as a library.

The interesting bit is what “weak” means here. A generalized weak pointer associates a key with a value and an optional finalizer. If the key is independently reachable, the association keeps the value alive. But the value can point back to the key without that cycle keeping itself alive forever. The finalizer can refer to the key too, and can even resurrect it. The old weak association still stays dead.

A Java `WeakReference` next to a strongly held value doesn’t give us that: the value can keep the key alive through the back-reference. Making both references weak doesn’t work either, because then the value can disappear while the key is still alive. The collector has to understand the association.

I am somewhat amused by the contrast with the decades of pain around [Java finalization](https://openjdk.org/jeps/421). Haskell had a richer design in [1999](https://www.cs.tufts.edu/comp/150FP/archive/simon-peyton-jones/stretching-storage.pdf), with a coherent account of these cycles and resurrection. Here, porting those semantics into the collector was the work of an afternoon.

That doesn’t make finalizers prompt, or make Java’s security and lifecycle problems disappear. But allowing a finalizer to resurrect its key is hardly an insurmountable obstacle. We have had a design for that for 27 years.

I’m finishing up porting this over to SubstrateVM, so Native Image can use it too. With jam’s baseline functionality already so closely aligned, wiring up THC’s finalizers is mostly an exercise in crossing the t’s. Getting that in place will remove my biggest blocker to full GHC language-feature support on GraalVM.

There are limitations. Right now the collector only supports [Compressed Ordinary Object Pointer](https://docs.oracle.com/en/java/javase/25/vm/java-hotspot-virtual-machine-performance-enhancements.html#GUID-932AD393-1C8C-4E50-8074-F81AD6FB2444) mode, so the heap is limited to 32 GB: 16 GB for the young generation and 16 GB for the old generation, even on a 64-bit platform. In exchange, pointers shrink from 64 bits to 32, so we can fit twice as many of them into L1 cache. For pointer-heavy structures, that can mean substantially more useful data in cache; the exact gain depends on the object layout.

Future work should include forwarding field accessors applied to evaluated thunks, and the in-place removal of thunk forwarding pointers. Owning the entire garbage collector makes possible a whole class of previously near-impossible feats.

The code is in [jam](https://github.com/ekmett/jam) and [jam-vm](https://github.com/ekmett/jam-vm), with [collector documentation](https://ekmett.github.io/jam/) and [JVM integration documentation](https://ekmett.github.io/jam-vm/).

—Edward Kmett

[Discuss on Reddit](https://www.reddit.com/r/haskell/comments/1wzlk2e/comonad_reader_stretching_the_storage_manager_on/).
