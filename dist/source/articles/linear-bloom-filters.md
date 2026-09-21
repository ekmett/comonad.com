This post is a bit of a departure from my recent norm. It contains no category theory whatsoever. None. I promise.

Now that I've bored away the math folks, I'll point out that this also isn't a guide to better horticulture. Great, there goes the rest of you.

Instead, I want to talk about [Bloom filters](http://citeseer.ist.psu.edu/bloom70spacetime.html), Bloom joins for distributed databases and some novel extensions to them that let you trade in resources that we have in abundance for ones that are scarce, which I've been using for the last few months and which I have never before seen before in print. Primarily because I guess they have little to do with the strengths of Bloom filters.

For practical purposes you will need to use a [counted](http://en.wikipedia.org/wiki/Bloom_filter#Counting_filters) or [spectral](http://theory.stanford.edu/~matias/papers/sbf-sigmod-03.pdf) Bloom filter for the purposes of the structure mentioned below. However, as these introduce nothing novel, and simply muddle the exposition, I'll ignore counting and spectral Blooms for now.

## Bloom Filters

Ok, so what is a Bloom filter? Bloom filters date back to 1970. A simple Bloom filter is a novel data structure for approximating membership in a set, yielding only false positives. A filter consists of an m-bit array and k distinct hash functions. To add an element to the filter you run it through each of the k hash functions and setting the appropriate bits. A value is considered to be a member of the set if you hash it through each of the k functions and each of the target bits is set. It is easy to see that this can only result in a false positive, but its also easy to see that you need to set the size of the array before you start adding elements to it, and that you need to balance the number of hash functions to the overall desired precision of your filter. In general you want to have about half of the bits set in the resulting array to maximize your information density -- a fact which can be derived with elementary calculus. From which you can figure out that you get optimal results when $k = \frac{m}{n} \ln 2$.

We can readily approximate k distinct hashing functions by using a single one-way hashing function and carving it up into a number of hashing functions that consist of the right number of bits each. A simpler approach due to [Kirsch and Mitzenmacher](http://www.eecs.harvard.edu/~kirsch/pubs/bbbf/esa06.pdf) is to sacrifice the independence of the hash functions without particularly adversely affecting the properties of the filter.

The nice thing about a Bloom filter is that the parameters m and k can be varied to tune space requirements and precision.

## Improving Locality

One common way to improve the locality of reference for excessively large Bloom filters is to break up the structure into two tiers. You have an upper tier in which you use a single hash function to bin the data, then within the bin you placed the data you run the remaining k-1 hash functions. This can result in a 'lumpier' distribution of data, but generally improves performance because if you exceed working memory, this model can typically page in a single page from disk to handle the k-1 writes. When you figure that it is common to use between several hashing functions with a bloom filter this can result in a several-fold performance improvement as the data set grows and you become IO bound. As a result of being primarily to optimize IO you typically want to have a bin size that corresponds with your block or page size.

As an admittedly *completely* unintelligible aside, I am particularly fond of 8k bins for a simple Bloom filter, because they nicely consume 16 bits of hash evenly, and 4k bins, when used with 4 bit counting Blooms, page in and out efficiently and compress nicely with an arithmetic/exponentiated Huffman encoding into near even multiples of the ethernet packet MTU when you tune the ratio of set bits carefully, I've found this to be beneficial for tweaking real world performance.

## Bloom Joins

Given a pair of bloom filters that share a given size m and which use the same k hash functions. You can take their intersection (or union) quite efficiently with bitwise and (or or). This is a well known technique for dealing with distributed database joins when you have data distributed across multiple servers joining against data distributed across other servers. In general, you are only interested in transmitting the data that exists on both sides of the join.

(You can technically free yourself from the requirement that both sides agree on the number of hash functions if you are willing to accept more false positives and you test for membership in the result set using just the hash functions contained in both Blooms. The easiest way to do this is to just agree on an order in which hash functions will be used, which comes for free from the Kirsch/Mitzenmacher approach mentioned above.)

**The good**  
The nice thing about a standard Bloom join is that you can send the Bloom filter over the network quite cheaply in comparison to the data, and with the addition of counting Bloom filter tricks it can be used to calculate approximately the size of the result set. This allows you to use it to load level [MapReduce](http://labs.google.com/papers/mapreduce.html) style workloads effectively by estimating the size of intermediate results quite accurately before you send everything over the network to be aggregated.

**The bad**  
One problem with this model is that you have to know the size of your data set up front in order to calculate an ideal m for a desired precision level. Moreover both sides of the join have to agree on this figure m before calculating the join.

Now, the main goal of a Bloom join is to conserve an scarce resource (network bandwith) by exchanging cheaper, more plentiful resources (local CPU utilization, and disk IO). In that respect it serves adequately, but we can do better if our goal is more or less purely to optimize network bandwidth. Lets carry that a bit further.

## Linear Hash Tables

To address the limitation that you have to know the size of the bloom a priori, we'll turn to another data structure, the [linear hash table](http://en.wikipedia.org/wiki/Linear_hash). Linear hash tables were designed by Witold Litwin back in 1980 to provide an expandable hash table without a huge stairstep in the cost function whenever you hit a power of two in size. The basic idea of a linear hash table is that you grow the table gradually, by splitting one bucket at a time and using the least significant bits of your hash function.

For sake of variety, I've included a C# 3.5 implementation here:

\[[SortedLinearHashTable.cs](http://comonad.com/csharp/SortedLinearHashTable.cs)\]  
\[[SinglyLinkedList.cs](http://comonad.com/csharp/SinglyLinkedList.cs)\]  
\[[PreparedEqualityComparer.cs](http://comonad.com/csharp/PreparedEqualityComparer.cs)\]  
\[[PreparedEqualityComparerTypeProxyAttribute.cs](http://comonad.com/csharp/PreparedEqualityComparerTypeProxyAttribute.cs)\]

For my regular audience, an implementation in Haskell using STM — incidentally was the first piece of Haskell I ever wrote — designed for read-mostly use can be found here:

\[[haddock](http://comonad.com/haskell/thash/dist/doc/html/)\]  
\[[darcs](http://comonad.com/haskell/thash/)\]

## A Linear Bloom Filter

Now, we can look at the bi-level structure we introduced above for dealing with improved cache locality and note that we could go in a different direction and treat the upper level as a linear hash table, instead of a simple hash function! This requires that we keep not only the Bloom but also the member list (or at least their hashes). We can optimize this slightly by computing the Bloom of the member list for each page lazily. This costs us quite a bit of storage relative to a traditional Bloom filter, but we can transmit the Bloom of the resulting set over the network more cheaply than we can transmit a linear hash table and it isn't appreciably more expensive locally than a linear hash table due to only lazily constructing the Blooms.

This mechanism gives rise to an actual tree of pages based on the unfolding of the linear hash table in the resulting hierarchical bloom if you choose to represent the interior of the tree.

Again, this isn't a win for all scenarios, but if you are intending to transmit the resulting set over the network, and don't know its size a priori, the combination of properties from the linear hash table and the bloomed pages leads to some interesting options.

## Linear Bloom Origami

Now that we have an expandable hash in our top level, we finally have the machinery to deal with how to perform a join between two linear bloom filters of different size. The model is actually quite simple. We can fold the larger bloom up by *or*ing together the leaves that were split by the linear hash table in the larger bloom until we have the same number of pages and then perform a standard Bloom join. This frees us from the tyranny of having to have both sides of the join guess in advance a shared number of buckets to use to perform the join.

As an aside, an interesting thought experiment is to go one step further and use a full-fledged sorted linear hash table for the extra cost of sorting the chains, but this doesn't seem to be useful in practice.

## Mipmapping Blooms

If we are willing to pay an $\mathcal{O}(n \log n)$ cost in terms of the data set size cost in terms of CPU utilization and memory bandwidth we can gain some further performance in terms of network utilization through encoding a set of "[mipmaps](http://en.wikipedia.org/wiki/Mipmap)" for our filters.

Basically the idea is to fold up the tree by *or*ing together the pages into an admissible Bloom of the dataset. Then you encode the splitting of each bit that was set in the Bloom using conditional probabilities. This can be transmitted near optimally using arithmetic encoding or exponentiated Huffman.

If a bit is set in the parent Bloom, then at least one of the two bits will be set in the child Blooms; if no bit is set in the parent Bloom, then no bit can be set in the child Blooms. The probability of each bit being set in each child is for all practical intents and purposes independent and can reasonably be modeled as a function of the expected number of set bits. (This is ever-so-slightly suboptimal if the overall number of values is known). You can determine exact values for the weights of each of the three cases using conditional probabilities and then use an arithmetic compressor, or exponentiate the alphabet for a Huffman compressor — this is otherwise near worst-case for Huffman, since you have two possibilities both just shy of 50% and one much smaller probability. Nicely the regular structure of the exponentiated alphabet is very regular and can be represented efficiently. With careful choice of page size (or bit density within a page) you can transmit the initial page cheaply, and then pack multiple pages into subsequent packets.

Since we can determine the relevance of portions of the tree based on partial information this may allow you to avoid transmitting some branches of the tree. More interestingly we can use it to figure out approximately the size of the join set from the first few pages transmitted and to gain gradual refinements as both sides of the join supply more information.

If you wanted to optimize strictly for network bandwidth and were willing to accept additional latency you could prune branches of the tree after it was clear that the intersection was empty and so no further resolution was required, but in my experience this optimization doesn't seem to be worth the effort.

## Incremental Update

Interestingly if you have already shared a Linear Bloom and need to update your copy it admits a cheap network representation using the same arithmetic/exponentiated Huffman encoding trick mentioned earlier. You lose the ability to ignore all unset bits in the dataset because extending the set of known values will in all likelihood set new bits, but as you add members you can transmit splits using the same mechanism used above, and you have the actual member set needed to populate the child pages accurately.

Interestingly it is the ability to mipmap the intermediate results that sometimes makes it worth dealing with a suboptimal choice of density for the overall Bloom filter, because it only affects the cost on either end of the network, it doesn't affect the network transmission costs all that adversely and more sparse population early in the tree can allow you to have a less oversaturated tree near the root, allowing earlier pruning of branches - I have yet to take this from an art to a science.

## Conclusion

I had intended to explain things in more detail and delve into the asymptotic behavior of hierarchical and linear Blooms, but various people have been hammering me to just post this already, so here it is.

So to recap, we took a normal (or counted or spectral) Bloom filter, crossbred it with Litwin's linear hash table and found that the mutant offspring is an approximation of a set that is better suited to sharing over the network than either structure alone, with a memory usage profile similar to that of a linear hash table. Interestingly as a side effect you can go one step further and allow for transmission of a requested subset of the exact hashes present in which case we've really only used the Blooms to provide partial information about the underlying linear hash table, which can aid in the subsequent join process.

And yes, they are probably better named something like Bloomed linear hash tables, but that doesn't roll off the tongue.

If there is enough interest and I don't get dragged into other things, I might see about packaging up and genericizing some code that I had lying around intended for production use into a more general purpose library for Linear Bloom Filters.
