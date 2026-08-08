---
title: "Some criticisms of Rust I saw (spoiler: they don't make much sense to me)"
date: 2026-03-28
draft: false
description: ""
tags:
  - rust
  - memory-safety
  - programming-languages
categories: []
series: []
slug: ""
---
**Note:  The snippets reflect things I have actually read/heard. However, they have been transcribed, and/or translated, and/or reformulated, and/or edited (out of reasons of privacy, length etc.), so they might not accurately represent the intention of the original authors despite my best efforts**

In general, I think that the "rewrite everything in Rust" movement is going too far. But many criticisms of Rust from people who may have been put off by this advocacy do not make much sense either. So let us have a look at some of the things I am aware of.

> This is the embarrassing part about Rust: for new projects, premature optimizations lead to a lack of flexibility. For old projects, there is no selling point other than memory safety.

Premature optimizations are as big (or small) a problem in Rust as in any other language. Rust simply lets you do certain optimizations in an easier way than some other languages. It really comes down to the programmer.

Furthermore, to me, Rust has more than just memory safety. A simple example would be clean rich enums:
```rust
// Example from serde_json
#[derive(Clone, Eq, PartialEq, Hash)]
pub enum Value {
    Null,
    Bool(bool),
    Number(Number),
    String(String),
    Array(Vec<Value>),
    Object(Map<String, Value>),
}
```
I think it is not exaggerated to say that this and the corresponding `match` pattern is a lot cleaner than the equivalent solutions of many other languages.

Traits, no nulls, no "hidden" effects like exceptions (that could be recoverable or not) are also some of the things that make Rust attractive (beyond memory safety).

> I don't see a future in Rust. A lot of flexibility is sacrificed for the sake of so-called "memory safety". And runtime guarantee can be found via static analysis tools. I think Rust is only publicized as a strategy by some people in Silicon Valley to drive other people off.

Well, unless you are neglecting memory safety completely (or have a GC), the *flexible* stuffs meant here (btw some examples would have been nice) should probably not be done in any language. In my humble opinion, Rust "formalizes" and forces a way of writing memory-safe code, and makes things explicit. So even if static analysis tools can find every bug related to memory safety (which is in itself a potentially fragile assumption), what would the resulting memory-safe code look like? Not that I have much experience in this field, but would the resulting code not look similar to the equivalent Rust code anyway? The things the Rust compiler doesn't let you do are the things that lead to memory "unsafety"?

And again, Rust has more to offer than just memory safety.

> "Memory safety" means nothing. Is Linux not memory safe? Linux is pure C!

Well actually, Linux is not memory safe. Not that long ago, there was even a [memory safety bug of the Rust parts of Linux](https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/) (unsafe Rust). C code is not likely to be any better than unsafe Rust, right? But at least Rust marks the parts (as unsafe) which could have safety problems. It makes you think twice. And one can argue, if there was any line of safe Rust, then it is already better than writing everything in an unsafe language (C or unsafe Rust).

> Rust relies on its compiler too much. What if the compiler has a bug?

Hmm, the current Rust borrow checker is known to have [limitations](https://blog.rust-lang.org/inside-rust/2023/10/06/polonius-update/#background-on-polonius) (false positives). But any potential bug in rustc is not going to make the produced machine code any more unsafe than code produced from unsafe languages (albeit rustc might refuse to compile at all). And all software have bugs. If you worry a lot about compiler bugs, best solution is probably to handwrite assembly XD.

> Rust syntax and features are very bad. In contrast, Go does have a number of advantages over C .

Well this is just an opinion. And to insinuate that Go syntax is better than Rust's is something that requires extensive justification (which was not provided). On the other hand, Go is a GCed language designed for things like microservices. Thus a comparison between Go and Rust (even with extensive justifications) most likely only makes sense for selected scenarios.

> Rust is not a silver bullet for speed. You can't implement an inefficient algorithm and expect it to be fast. If you really want performance, you have to think about how to process data as efficiently as possible regardless of the implementation language.
> 
> You also mention wanting to create a long term code base, which is a great goal and I'm glad you're thinking about that. But then it may be worth more heavily weighing how approachable it will be for future members. In my opinion, Python would be the best choice for that.

The context of this makes it much worse in my opinion. The other "implementation language" in question is JavaScript. In short, there was a tauri-based app, and the first coder had written too much data processing stuffs (actually pretty much everything) inside the frontend part (JS). So a second coder said he wants to move the computationally heavy parts from JS to the Rust backend for better performance. Then a 3rd person wrote the text above in response to the 2nd coder.

For starters, interpreted JS tends to be slower than compiled Rust. Even though JS engines have JIT,  it is unlikely to be faster than LLVM O3. Second of all, if Rust is not the silver bullet for speed, then Python is not the silver bullet for approachability. A complicated algorithm is not going to be suddenly easy to understand just because it is written in Python instead of say C or Rust.