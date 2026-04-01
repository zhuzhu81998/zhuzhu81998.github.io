---
title: Trying to understand that Archimedean Property is not expressible in the first-order logic
date: 2026-04-01
draft: false
description:
tags:
  - mathematics
  - logic
categories:
series: []
slug: ""
---
{{< katex >}}
(Note that these are basically studying notes for myself, so expect plenty of mistakes)

## Archimedean Property of the rationals
A version of the Archimedean property can be stated as the following:

> For all $x,y \in \mathbb{Q}$ with $x > 0$ and $y > 0$, there exists $n \in \mathbb{N}$ such that
> $$
 n\cdot x > y.
$$

However, it can be shown that the following holds in the first-order logic:
## Existence of infinitesimals in a nonstandard model of the rationals

> Let $\mathcal{L}$ be the language with:
> * constants: $0, 1$,
> * binary functions: $+, \cdot$,
> * binary relation: $<$.
>
>Let $\mathbf{M} = (\mathbb{Q}, 0, 1, +, \cdot, <)$ be the usual $\mathcal{L}$-structure, and let
$$
T = \mathrm{Th}(\mathbf{M}).
$$
There exists a model of $T$ containing an *infinitesimal*, i.e. an element $x > 0$ such that
$$
 (\underbrace{1 + \cdots + 1}_{n \text{ times}})\cdot x < 1 \quad \text{for all natural numbers } n.
$$

A proof can be found in Ex. 5.4 of [Halbeisen and Krapf, 2025](https://doi.org/10.1007/978-3-031-85106-3). But let us briefly write it down here as well:

Define "natural numbers":
$$
	\underline{n} \equiv \underbrace{1 + \cdots + 1}_{n \text{ times}}
$$
Extend the language $\mathcal{L}$ by a constant symbol $c$ and add new sentences to the theory in the following way:
$$
\varphi_n :\equiv 0 < c \land \underline{n}\cdot c < 1
$$
$$
T' \coloneqq T \cup \{\varphi_n: n \in \mathbb{N}\}
$$
Note that $\mathbb{N}$ here represents the meta-level natural numbers ("*from outside*"). Basically, what we mean really in this:
$$
T' \coloneqq T \cup \{0< c \land 1 \cdot c < 1,\ 0< c \land (1+1)\cdot c < 1,\ \dots \}
$$

We claim that every finite subset $\Phi \subseteq T'$ is consistent.

Indeed, let $n$ be the largest natural number such that $\varphi_n \in \Phi$. In this $\Phi$, we can assign $c$ to $1/(n+1) \in \mathbb{Q}$ to obtain a model for $\Phi$.

By the soundess theorem, $\Phi$ is therefore consistent. Consequently, by compactness the entire $T'$ is consistent, and thus by completeness has a model $M$. The element in $M$ assigned to $c$ is the infinitesimal. Since $M$ satisfies the larger $T'$, it also satisfies $T$. QED.

## What does this mean?
We know that the Archimedean Property is true in the rational numbers. In addition, what we have just shown says that there is a model in which everything that was true for the rational numbers is also true.

Is there then not a contradiction inside the new model? Because the infinitesimal obviously does not satisfy the Archimedean Property. Maybe there is a mistake somewhere in the proofs?

Well, the very first question should be, is the Archimedean Property actually in $T = \mathrm{Th}(\mathbf{M})$ ?

How would you formally write down the Archimedean Property in the logic language? Probably some thing like this:
$$
\forall x > 0 \forall y > 0 \exists n (\mathrm{Nat}(n) \land n \cdot x > y).
$$
We need some predicate $\mathrm{Nat}$ to describe what a natural number is, because our domain is only $\mathbb{Q}$. A simple idea leads us t something like this
$$
\mathrm{Nat}(n) :\equiv \forall X \left(
  (0 \in X \land \forall x\, (x \in X \rightarrow x + 1 \in X))
  \rightarrow n \in X
\right),
$$
where we defined "natural numbers" in this context to be the smallest inductive set. On the other hand, a naive definition can also be:
$$
\mathrm{Nat}(n):\equiv n=0 \lor n=1\lor n = 1 + 1\lor \dots
$$
However, neither of these 2 is actually "legal" in our logic. The first one "iterates" through sets of elements and the second one can only be constructed through an infinite number of operations (which is also not allowed).

If you can't express $\mathrm{Nat}$ in first-order logic, you can't really express the Archimedean Property.

Another attempt can be to simply include the predicate $\mathrm{Nat}$ itself in the theory. For example, maybe we can include the Peano axioms? As a matter of fact, [Robinson (1949)](https://doi.org/10.2307/2266510) proved that you can define integers (and thus natural numbers) within the rational numbers using first-order logic only.

The catch is, there is nothing that says that the "natural numbers" defined by this first-order logic have to be same as our standard numerals used in $(1+1+\dots +1)x<1$. It is possible (and indeed what we proved says it is the case) that the "added" numerals are just "copies" which share essentially the same properties as the standard ones in the non-standard model we defined. The phrase "natural numbers" could mean very different objects.

At least that is what I understood XD.