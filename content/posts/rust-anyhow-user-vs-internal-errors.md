---
title: Handling Rust errors with anyhow while still distinguishing internal vs user errors
date: 2026-04-04
draft: false
description: ""
tags:
  - rust
  - anyhow
  - errors
categories: []
series: []
slug: ""
---
Note: If you are on Desktop, enabling the Zen mode (next to the number of minutes under the post title) will widen the view for better code readability.
## The Problem
There are surprisingly many services that make the user take the fault for everything, even if it is a server software bug. I dare say I have also seen one or two services which show user-side mistakes as internal server errors.

This is kinda understandable, because it is easy to just put everything into one category and be done with it. Nonetheless distinguishing them does make sense. After all, you should not create a log message just because the user put in a letter instead of a number. Conversely, seeing "internal server error" does not help the user if the cause is as simple as a missing field for example.

In some cases it is sufficient to just validate the user input in a certain pre-defined way and then call every error that still occurs internal. For example, a search field. The user inputs some strings and expects to get a list of results back (could be empty). As long as what the user put in is a string, it should succeed. Every error that can occur here is internal (e.g., lost connection to database or whatever).

In other cases it is not so easy. For example, if you want to expose some endpoints of a S3 service: a "not found" error might only occur after the S3 service has processed the request. In this case, you need to keep track of the type of error (user or internal?) throughout the layers of the backend.

In the case of Rust applications, this means that the usual approach of using `anyhow` for everything except at api boundary (where you validate the user input) is not viable. You need to preserve information about the error kind in the middle as well. The "challenge" is that it is still desired to use `anyhow`, because not every path is like this (most paths are genuinely: errors below the API boundary are internal).

In my case, I am using the `object_store` crate for interacting with e.g. S3.  A function from this crate could return errors of type `object_store::Error`, and it could mean that something internal is wrong (e.g., `NotSupported`, `NotImplemented` or `PermissionDenied`) but it could also be `NotFound`. The latter is most likely user inquiring a file that does not exist. We still want to add context (similar to `with_context` from `anyhow`) to this error since it could still be an internal server error.

## A messy but functional solution (I think)

Define a special error that saves the context intermediately in additional to the original error (of type e.g. `object_store::Error`). Its basically a wrapper around the original typed error. This enables us to save context.
```rust
// Version that evaluates the closure immediately
// as soon as the error path is taken
// without considering whether the error is user or internal

#[derive(Debug)]
pub struct WithContextError<E, C>
where
    E: std::error::Error + Send + Sync + 'static,
    C: Display + Send + Sync + 'static,
{
    pub error: E,
    pub context: C,
}

pub trait AddContext<T> {
    type Error: std::error::Error + Send + Sync + 'static;

    fn with_context<C, F>(self, context: F) -> Result<T, WithContextError<Self::Error, C>>
    where
        C: Display + Send + Sync + 'static,
        F: FnOnce() -> C;
}

impl<T, E> AddContext<T> for Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    type Error = E;

    fn with_context<C, F>(self, context: F) -> Result<T, WithContextError<E, C>>
    where
        C: Display + Send + Sync + 'static,
        F: FnOnce() -> C,
    {
        match self {
            Ok(value) => Ok(value),
            Err(error) => Err(WithContextError {
                error,
                context: context(),
            }),
        }
    }
}
```

Here we define how to convert from the wrapped error into an app error that does not care about the specific type of the underlying error but only if it is user or internal. 
```rust
// Version that evaluates the closure immediately
// as soon as the error path is taken
// without considering whether the error is user or internal

type ObjectStoreError<C> = WithContextError<object_store::Error, C>;

impl<C> From<ObjectStoreError<C>> for OperationFailure
where
    C: Display + Send + Sync + 'static,
{
    fn from(err: ObjectStoreError<C>) -> Self {
        match err.error {
            object_store::Error::AlreadyExists { .. } => {
                Self::InvalidInput("object already exists".into())
            }

            object_store::Error::InvalidPath { .. } => {
                Self::InvalidInput("invalid object path".into())
            }

            object_store::Error::NotFound { .. } => Self::InvalidInput("object not found".into()),

            _ => Self::Internal(anyhow::Error::context(err.error.into(), err.context),
        }
    }
}
```

How the app error looks like:
```rust
#[derive(Debug)]
pub enum OperationFailure {
    /// Client fault
    InvalidInput(Cow<'static, str>),
    /// Server fault
    Internal(anyhow::Error),
}

impl From<anyhow::Error> for OperationFailure {
    #[cold]
    fn from(err: anyhow::Error) -> Self {
        Self::Internal(err)
    }
}
```

And then, because we still want to add anyhow context to this `OperationFailure` it will be turned into an `anyhow` error. This way, the context inside the `WithContextError` also nicely becomes part of the anyhow context chain. Then we can take advantage of a feature from `anyhow` to find out later whether it was internal server error or not:
```rust
impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        // if the error was an OperationFailure before getting turned into the generic anyhow::Error, map accordingly
        match err.downcast::<OperationFailure>() {
            Ok(operation_failure) => match operation_failure {
                OperationFailure::InvalidInput(msg) => Self::BadRequest(msg),
                OperationFailure::Internal(error) => Self::Internal(error),
            },
            Err(err) => Self::Internal(err),
        }
    }
}
```
Then `ApiError` contains the correct error and can return it to the user or log it as internal server error.

I say this is messy, because, well, it seems overly complex (and the naming choices are somewhat poor, but I originally didn't want to change too much stuffs as I moved to this solution from using plain `with_context` from `anyhow`).

Additionally, there is a small performance problem with this messy solution. The `context` closure is evaluated regardless of whether it was a server internal error or an user input error (in which case the context is not actually relevant). But this can be fixed relatively easily by storing a `F: FnOnce() -> C` instead of `C` inside `WithContextError`, which can then be evaluated while converting `WithContextError` to a `OperationFailure` if it is on the `Internal` path.

## Additional thoughts
First of all, I really need to make the names in the messy solution nicer and less confusing. Right now, it is not always clear which `with_context` is getting used since both mine and `anyhow` uses it (it did make moving from one to the other a bit easier though).

I have also thought about just extending `OperationFailure` to include an additional `context`. However, this has the downside that in case of an internal server error, we can not have the context nicely integrated with the chain which `anyhow` saves. Right now with the messy solution the order of the contexts is preserved, because the path is `object_store::Error -> with_context -> WithContextError -> OperationFailure -> with_context -> ... -> downcast (checking if internal or user/invalid input) -> ApiError`.

Maybe there is a fundamentally better way to approach this that I am not thinking of.