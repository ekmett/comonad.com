I recently attended [RDP](http://rdp15.mimuw.edu.pl/) in Warsaw, where there was quite a bit of work on Homotopy Type Theory, including a special workshop organized to present recent and ongoing work. The organizers of all the events did a fantastic job and there was a great deal of exciting work. I should add that I will not be able to go to RDP next year, as the two constituent central conferences (RTA — Rewriting Techniques and Applications and TLCA — Typed Lambda Calculus and Applications) have merged and changed names. Next year it will now be called FSCD — Formal Structures for Computation and Deduction. So I very much look forward to attending FSCD instead.

In any case, one of the invited speakers was Vladimir Voevodsky, who gave an invited talk on his recent work relating to univalent foundations titled "From Syntax to Semantics of Dependent Type Theories — Formalized”. This was a very clear talk that helped me understand his current research direction and the motivations for it. I also had the benefit of some very useful conversations with others involved in collaboration with some of this work, who patiently answered my questions. The notes below are complimentary to the [slides from his talk](http://hott-uf.gforge.inria.fr/HOTTUF_Vladimir.pdf).

I had sort of understood what the motivation for studying “C-Systems” was, but I had not taken it on myself to look at Voevodsky’s [“B-Systems](http://arxiv.org/abs/1410.5389)” before, nor had I grasped how his research programme fit together. Since I found this experience enlightening, I figured I might as well write up what I think I understand, with all the usual caveats. Also note, in all the below, by “type theory” I invariably mean the intensional sort. So all the following is in reference to the B-systems paper that Voevodsky has posted on arXiv ([arXiv:1410.5389](http://arxiv.org/abs/1410.5389)).

That said, if anything I describe here strikes you as funny, it is more likely that I am not describing things right than that the source material is troublesome — i.e. take this with a grain of salt. And bear in mind that I am not attempting to directly paraphrase Voevodsky himself or others I spoke to, but rather I am giving an account of where what they described resonated with me, and filtered through my own examples, etc. Also, if all of the “why and wherefore” is already familiar to you, feel free to skip directly to the “B-Systems” section where I will just discuss Voevodsky’s paper on this topic, and my attempts to understand portions of it. And if you already understand B-Systems, please do reply and explain all the things I’m sure I’m missing!

  
**Some Review**

We have a model of type theory in simiplicial sets that validates the univalence axiom (and now a few other models that validate this axiom as well). This is to say, it is a model with not only higher dimensional structure, but higher structure of a very “coherent” sort. The heart of this relates to our construction of a “universe”. In our categorical model, all our types translate into objects of various sorts. The “universe,” aka the type-of-types, translates into a very special object, one which “indexes” all other objects. A more categorical way of saying this is that all other types are “fibered over” the universe — i.e. that from every other type there is a map back to a specific point within the universe. The univalence axiom can be read as saying that all equivalent types are fibered over points in the universe that are connected (i.e. there is a path between those points).

Even in a relatively simple dependent type theory, equivalence of types quickly becomes undecidable in general, as it is a superset of the problem of deciding type inhabitation, which in turn corresponds to the decidability of propositions in the logic corresponding to a type theory, and then by any number of well-known results cannot be resolved in general for most interesting theories. This in turn means that the structure of a univalent universe is “describable” but it is not fully enumerable, and is very complex.

We also have a line of work dating back to before the introduction of univalence, which investigated the higher groupoid structure (or, if you prefer, higher topological structure or quillen model structure) induced by identity types. But without either univalence or higher-inductive types, this higher groupoid structure is unobservable internally. This is to say, models were possible that would send types to things with higher structure, but no particular use would be made of this higher structure. So, such models could potentially be used to demonstrate that certain new axioms were not conservative over the existing theory, but on their own they did not provide ideas about how to extend the theory.

How to relate this higher groupoid structure to universes? Well, in a universe, one has paths. Without univalence, these are just identity paths. But regardless, we now get a funny “completion” as our identity paths must *themselves* be objects in our universe, and so too the paths between them, etc. In models without higher structure, we might say “there is only one path from each object to itself” and then we need not worry too much about this potential explosion of paths at each level. But by enforcing the higher groupoid structure, this means that our universe now blossoms with all the potentially distinct paths at each level. However, with the only way in our syntax to create such “extra paths” as reflexivity, any such path structure in our model remains “latent”, and can be added or removed without any effect.

The univalence axiom relies on these higher groupoid structures, but it cannot be reduced to them. Rather, in the model, we must have a fibration over the universe with identity lifting along this fibration to reach the next step — to then modify the universe by forcing paths other than identity paths — those between equivalent types. This is in a sense a further “higher completion” of our universe, adding in first all the possible paths between types, but then the paths between those paths, and so on up. Because, by univalence, we *can* state such paths, then in our model we *must* include all  
of them.

## The Problem

All along I have been saying “models of type theory”. And it is true enough. We do know how to model type theories of various sorts categorically (i.e. representing the translation from their syntax into their semantics as functorial). But we do not have full models of "fully-featured" type theories; i.e. if we view type theories as pizzas we have models of cheese slices, and perhaps slices with olives and slices with pepperoni, etc. But we do not have models of pizzas with "all the toppings". Here, by "toppings" I mean things such as the addition of "all inductive types," "some coinductive types," "certain higher-inductive types," "pattern matching," "induction-induction," "induction-recursion," "excluded middle as an axiom," "choice as an axiom," "propositional resizing as an axiom," etc.

Rather, we have a grab bag of tricks, as well as a few slightly different approaches — Categories with Attributes, Categories with Families, and so forth. One peculiar feature of these sorts of models, as opposed to the models of extensional type theory, is that these models are not indexed by types, but by “lists of types” that directly correspond to the contexts in which we make typing judgments in intensional theories.

In any case, these models are usually used in an ad-hoc fashion. If you want to examine a particular feature of a language, you first pick from one of these different but related sorts of models. Then you go on to build a version with the minimal set of what you need — so maybe identity types, maybe sigma types, maybe natural numbers, and then you introduce your new construction or generate your result or the like.

So people may say “we know how to work with these things, and we know the tricks, so given a theory, we can throw together the facts about it pretty quickly.” Now of course there are maybe only a hundred people on the planet (myself not among them) who can *really* just throw together a categorical model of some one or another dependent type theory at the drop of a hat.

But there’s a broader problem. How can we speak about the mutual compatibility of different extensions and features if each one is validated independently in a different way? This is a problem very familiar to us in the field of programming languages — you have a lot of “improvements” to your language, all of a similar form. But then you put such “improvements” together and now something goes wrong. In fact, the famous “newtype deriving bug” in GHC some years back, which opened a big hole in the type system, was of exactly that form — two extensions (in that case, newtype deriving and type families) that are on their own safe and useful, together have an unexpected bad effect. It is also possible to imagine bad interactions occuring only when three extensions exist together, and soforth. So as the number of extensions increases, the number of interactions to check spirals upwards in a very difficult fashion.

So the correct way to have confidence in the coexistence of these various extensions is to have a general model that contains the sort of theory we actually want to work in, rather than these toy theories that let us look at portions in isolation. And this certainly involves having a theory that lets us validate all inductive types at once in the model, rather than extending it over and over for each new type we add. Additionally, people tend to model things with at most one universe. And when we are not looking at universes, it is often omitted altogether, or done “incorrectly” as an inhabitant of itself, purely for the sake of convenience.

So now, if I tell someone with mathematical experience what my theory “means” and they say “is this actually proven” I’m in the embarrassing position of saying “no, it is not. but the important bits all are and we know how to put them together.” So here I am, trying to advocate the idea of fully formal verification, but without a fully top-to-bottom formally verified system myself — not even codewise, but in even the basic mathematical sense.

Univalence makes this problem more urgent. Without univalence, we can often get away with more hand-wavy arguments, because things are “obvious”. Furthermore, they relate to the way things are done elsewhere. So logic can be believed by analogy to how people usually think about logic, numbers by analogy to the peano system, which people already “believe in,” and soforth. Furthermore, without univalence, most operations are “directly constructive” in the sense that you can pick your favorite “obvious” and non-categorical model, and they will tend to hold in that as well — so you can think of your types as sets, and terms as elements of sets. Or you can think of your types as classifying computer programs and your terms as runnable code, etc. In each case, the behavior leads to basically what you would expect.

But in none of these “obvious” models does univalence hold. And furthermore, it is “obviously” wrong in them.

And that is just on the “propaganda” side as people say. For the same reasons, univalence tends to be incompatible with many “obvious” extensions — for example, not only “uniqueness of identity proofs” has to go, but pattern matching had to be rethought so as not to imply it, and furthermore it is not known if it is sound in concert with many other extensions such as general coinductive types, etc. (In fact, the newtype deriving bug itself can be seen as a "very special case" of the incompatibility of univalence with Uniqueness of Identity Proofs, as I have been discussing with people informally for quite some time).

Hence, because univalence interacts with so many other extensions, it feels even more urgent to have a full account. Unlike prior research, which really focused on developing and understanding type systems, this is more of an engineering problem, although a proof-engineering problem to be sure.

## The Approach

Rather than just giving a full account of “one important type system,” Voevodsky seems to be aiming for a generally smooth way to develop such full accounts even as type systems change. So he is interested in reusable technology, so to speak. One analogy may be that he is interested in building the categorical semantics version of a logical framework. His tool for doing this is what he calls a “[C-system](http://arxiv.org/abs/1410.5389)”, which is a slight variant of Cartmell’s Categories with Attributes mentioned above. One important aspect of C-systems seems to be that that they stratify types and terms in some fashion, and that you can see them as generated by some “data” about a ground set of types, terms, and relations. To be honest, I haven’t looked at them more closely than that, since I saw at least some of the “point” of them and know that to really understand the details I'll have to study categorical semantics more generally, which is ongoing.

But the plan isn’t just to have a suitable categorical model of type theories. Rather it is to give a description of how one goes from the “raw terms” as syntax trees all the way through to how typing judgments are passed on them and then to their full elaborations in contexts and finally to their eventual “meaning” as categorically presented.

Of course, most of these elements are well studied already, as are their interactions. But they do not live in a particularly compatible formulation with categorical semantics. This then makes it difficult to prove that “all the pieces line up” and in particular, a pain to prove that a given categorical semantics for a given syntax is the “initial” one — i.e. that if there is any other semantics for that syntax, it can be arrived at by first “factoring through” the morphism from syntax to the initial semantics. Such proofs can be executed, but again it would be good to have “reusable technology” to carry them out in general.

## pre-B-Systems

Now we move into the proper notes on [Voevodsky's "B-Systems" paper](http://arxiv.org/abs/1410.5389).

If C-systems are at the end-point of the conveyor belt, we need the pieces in the middle. And that is what a B-system is. Continuing the analogy with the conveyor belt, what we get out at the end is a “finished piece” — so an object in a C-system is a categorified version of a “type in-context” capturing the “indexing” or “fibration” of that type over its “base space” of types it may depend on, and also capturing the families of terms that may be formed in various different contexts of other terms with other types.

B-systems, which are a more “syntactic” presentation, have a very direct notion of “dynamics” built in — they describe how objects and contexts may be combined and put together, and directly give, by their laws, which slots fit into which tabs, etc. Furthermore, B-systems are to be built by equipping simpler systems with successively more structure. This gives us a certain sort of notion of how to talk about the distinction between things closer to "raw syntax" (not imbued with any particular meaning) and that subset of raw syntactic structures which have certain specified actions.

So enough prelude. What precisely is a B-system? We start with a pre-B-system, as described below (corresponding to Definition 2.1 in the paper).

First there is a family of sets, indexed by the natural numbers. We call it `B_n`. `B_0` is to be thought of as the empty context. `B_1` as the set of typing contexts with one element, `B_2` as the set with two elements, where the second may be indexed over the first, etc. Elements of `B_3` thus can be thought of as looking like "`x_1 : T_1, x_2 : T_2(x_1), x_3 : T_3(x_1,x_2)`" where `T_2` is a type family over one type, `T_3` a type family over two types, etc.

For all typing contexts of at least one element, we can also interpret them as simply the \_type\_ of their last element, but as indexed by the types of all their prior elements. Conceptually, `B_n` is the set of "types in context, with no more than n-1 dependencies".

Now, we introduce another family of sets, indexed by the natural numbers starting at 1. We call this set `˜B_n`. `˜B_1` is to be thought of as the set of all values that may be drawn from any type in the set B\_1, and soforth. Thus, each set `˜B_n` is to be thought of as fibered over `B_n`. We think of this as "terms in context, whose types have no more than n-1 dependencies". Elements of `˜B_3` can be though of as looking like "`x_1 : T_1, x_2 : T_2(x_1), x_3 : T_3(x_1,x_2) ⊢ y : x`". That is to say, elements of `B_n` for some n look like "everything to the left of the turnstile" and elements of ˜B\_n for some n look like "the left and right hand sides of the turnstile together."

We now, for each n, give a map:

`∂ : ˜B_n+1 -> B_n+1.`

This map is the witness to this fibration. Conceptually, it says "give me an element of some type of dependency level n, and I will pick out which type this is an element of". We can call ∂ the "type of" operator.

We add a second basic map:

`ft : B_n+1 -> B_n`

This is a witness to the fact that all our higher `B_n` are built as extensions of smaller ones. It says "Give me a context, and I will give you the smaller context that has every element except the final one". Alternately, it reads "Give me a type indexed over a context, and I will throw away the type and give back just the context." Or, "Give me a type that may depend on n+1 things, and I will give the type it depends on that may only depend on n things. We can call ft the "context of" operator.

Finally, we add a number of maps to correspond to weakening and substitution -- four in all. In each case, we take m >= n. we denote the i-fold application of `ft` by `ft_i`.

1) T (type weakening).

`T : (Y : B_n+1) -> (X : B_m+1) -> ft(Y) = ft_(m+1-n)(X) -> B_m+2   `  
This reads: Give me two types-in-context, X and Y. Now, if the context for Y agrees with the context for X in the initial segment (i.e. discarding the elements of the context of X which are "longer" than the context for Y), then I can give you back X again, but now in an extended context that includes Y as well.

2) ˜T (term weakening).

`˜T : (Y : B_n+1) -> (r : ˜B_m+1) -> ft(Y)=ft_(m+1-n)(∂(r)) -> ˜B_m+2`

This reads: Give me a type-in-context Y, and a term-in-context r. Now, if the context of Y agrees with the context for the type of r as above, then I can give you back r again, but now as a term-in-context whose type has an extended context that includes Y as well.

3) S (type substitution).

`S : (s : ˜B_n+1) -> (X : B_m+2) -> ∂(s) = ft_(m+1-n)(X) -> B_m+1`

This reads: give me a term-in-context s, and a type-in-context X. Now, if the context of the type of s agrees with the context of the X in the initial segment, we may then produce a new type, which is X with one less element in its context (because we have substituted the explicit term s for where the prior dependency data was recorded).

4) ˜S (term substitution).

`˜S : (s : ˜B_n+1) -> (r : ˜B_m+2) -> ∂(s) = ft_(m+1-n)(∂(r)) -> ˜B_m+1`

This reads: give me two terms-in-context, r and s. Now given the usual compatibility condition on contexts, we can produce a new term, which is like r, but where the context has one less dependency (because we have substituted the explicit term s for everywhere where there was dependency data prior).

Let us now review what we have: We have dependent terms and types, related by explicit maps between them. For every term we have its type, and for every type we have its context. Furthermore, we have weakening by types of types and terms -- so we record where "extra types" may be introduced into contexts without harm. We also have substitution of terms into type and terms -- so we record where reductions may take place, and the resulting effect on the dependency structure.

## Unital pre-B-systems

We now introduce a further piece of data, which renders a pre-B-system a \_unital\_ pre-B-system, corresponding to Definition 2.2 in the paper. For each n we add an operation:

`δ : B_n+1 -> ˜B_n+2`

This map "turns a context into a term". Conceptually it is the step that equips a pre-B-system with a universe, as it is what allows types to transform into terms. I find the general definition a bit confusing, but I believe it can be rendered syntactically for for B\_2, it can be as something like the following: "`x_1 : T_1, x_2 : T_2(x_1) -> x_1 : T_1, x_2 : T_2(x_1), x_3 : U ⊢ x_2 : x_3`". That is to say, given any context, we now have a universe `U` that gives the type of "universes of types", and we say that the type itself is a term that is an element of a universe. Informally, one can think of `δ` as the "term of" operator.

But this specific structure is not indicated by any laws yet on δ. Indeed, the next thing we do is to introduce a "B0-system" which adds some further coherence conditions to restrict this generality.

## B0-systems

The following are my attempt to "verbalize" the B0 system conditions (as restrictions on non-unital pre-B-systems) as covered in definition 2.5. I do not reproduce here the actual formal statements of these conditions, for which one should refer to the paper and just reason through very carefully.

1\. The context of a weakening of a type is the same as the weakening of the context of a type.

2\. The type of the weakening of a term is the same as the weakening of the type of a term.

3\. The context of a substitution into a type is the same as the substitution into a context of a type

4\. The type of a substitution into a term is the same as a substitution into the type of a term.

Finally, we "upgrade" a non-unital B0-system to a unital B0-system with one further condition:

5\. `∂(δ(X)) =T(X,X).`

I read this to say that, "for any type-in-context X, the type of the term of X is the same as the weakening of the context of X by the assumption of X itself." This is to say, if I create a term for some type X, and then discard that term, this is the same as extending the context of X by X again.

Here, I have not even gotten to "full" B-systems yet, and am only on page 5 of a seventeen page paper. But I have been poking at these notes for long enough without posting them, so I'll leave off for now, and hopefully, possibly, when time permits, return to at least the second half of section 2.
