I've been transcoding a lot of Haskell to Scheme lately and one of the things that I found myself needing was a macro for dealing with Currying of functions in a way that handles partial and over-application cleanly.

I found a very elegant [macro by Piet Delport that handles partial application](http://programming-musings.org/2007/02/03/scheme-code-capsule-currying/), but that doesn't deal with the partial application of no arguments or that I'd like to also be able to say things like the following and have the extra arguments be passed along to the result.

```scheme
(define-curried (id x) x)
(id + 1 2 3) ;;=> 6
```

This of course, becomes more useful for more complicated definitions.

```scheme
(define-curried (compose f g x) (f (g x)))
(define-curried (const a _) a)
```

While I could manually associate the parentheses to the left and nest lambdas everywhere, Haskell code is rife with these sorts of applications. In the spirit of Scheme, since I couldn't find a macro on the internet that did what I want, I tried my hand at rolling my own.

```scheme
;; curried lambda
(define-syntax curried
  (syntax-rules ()
    ((_ () body)
     (lambda args
         (if (null? args)
             body
             (apply body args))))
    ((_ (arg) body)
      (letrec
        ((partial-application
          (lambda args
            (if (null? args)
                partial-application
                (let ((arg (car args))
                      (rest (cdr args)))
                  (if (null? rest)
                      body
                      (apply body rest)))))))
        partial-application))
    ((_ (arg args ...) body)
     (letrec
       ((partial-application
         (lambda all-args
           (if (null? all-args)
               partial-application
               (let ((arg (car all-args))
                     (rest (cdr all-args)))
                 (let ((next (curried (args ...) body)))
                   (if (null? rest)
                       next
                       (apply next rest))))))))
       partial-application))))

;; curried defines
(define-syntax define-curried
  (syntax-rules ()
    ((define-curried (name args ...) body)
       (define name (curried (args ...) body)))
    ((define-curried (name) body)
       (define name (curried () body)))
    ((define-curried name body)
       (define name body))))
```

While Scheme is not my usual programming language, I love the power of hygienic macros.

I welcome feedback.

\[Edit: updated to change the base case for define-curried and added the if to the base case of curried to be more consistent with the other cases per the second comment below\]
