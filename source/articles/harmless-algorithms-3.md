## Patterns

Certain Design Patterns crop up over and over again in 3d programming. For those of you unfamiliar with Design Patterns, the concept is introduced in the book (imaginatively named) 'Design Patterns' by Gamma et al. (ISBN: 0201633612) The book covers many of the most common design patterns, situations where they are usually applied and their relative strengths and weaknesses. In reading the book, you'll commonly find yourself experiencing small epiphanies as things click into place with your existing experience. Patterns provide a mechanism for talking about the mechanisms used to communicate between objects, ways to reduce redundant code, and generally provide larger building blocks for use in programming.

Programmers use patterns all the time, simply by applying approaches that worked for previous problems to current problems. A Pattern is simply an attempt to provide nomenclature for something you've been doing all along.

## Templates And Scalability

I have a passionate dislike of writing the same code multiple times. The major reason I moved to C++ from C was that I could encapsulate common actions in objects and benefit from using higher level primitives to construct my worlds. Unfortunately I still found myself duplicating effort in the interest of efficiency. Then templates came around, don't get me wrong, templates have been around for years, but now support for them (for class level templates anyways) grew ubiquitous enough that I could actually use them without worrying about whether or not my compiler will support this 'cutting edge feature'. Following this was a happy time whereupon I happily rewrote and generalized oodles and oodles of existing code. This affected my code in a landslide fashion.

Templates generally sit in headers and they are somewhat slower to compile than their hand-written counterparts. As a result, some things that were a nicety before (using large numbers of headers, generally one object to a header) become critical with the adoption of templates on a framework wide scale. People who complain about the compilation speed of templates could do well to get away from the 'kitchen sink' include philosophy promoted by Windows programming (stdafx.h including everything comes to mind) and have each header bring in other headers with just the elements required to compile the elements in the current header. This point is one of many belabored in John Lakos' excellent 'Large Scale C++ Software Design' (ISBN: 0201633620) Other tricks like #pragma once can be used to make small linear gains in compile time, but including only the constructs needed to compile each piece keeps your compilation time from bloating as you add more source files. Unfortunately, I digress.

Sticking to the design tenets that make code easily extensible can get tricky. There are times when you are tempted to introduce all sorts of circular dependancies which can make your code harder to test in small pieces. Defining an interface is an effort to conceal a great deal of activity behind a stoic facade is tricky the first few times you tackle it and there are 12 wrong ways to do it for every right way. Below is a pattern that I have found to work for my own purposes, I present it here in the hope that it may serve useful to other 3d programmers.

## The 'Boilerplate' Pattern

In an article on gamespy, Tim sweeney recently attempted to introduce a 'new' concept he wanted in object oriented programming called 'virtual classes'. The pattern I describe below can be used to provide this concept, and is very useful in cases where you need to generate a facade over a wide number of implementations that don't cleanly break down to one-class per implementation. Examples include graphs, a networking layer, your rendering api, and your sound subsystem. In each of these you have multiple related classes nodes and edges, sockets and ports, textures and models, sound snippets, etc that need to perform operations behind the scenes and often need to tie back to managers to actually do things. The java answer to this is to define a series of purely abstract interfaces (black box inheritance) and implement the connections in each set of implementations separately. This approach generally leads to code duplication as each driver has to generate a bunch of boiler plate code. The pattern below shows a way to make a template perform the busy work you usually achieve with cut & paste coding for these 'pure' implementations.

I call this the 'Boilerplate' pattern, and the first time that I saw this outside of my own code was in the Finite State Machines chapter of 'C++ Gems' by Stanley Lippman. (ISBN: 0135705819) The treatment of this pattern given by 'C++ Gems' is different than mine and if you have trouble with my half-baked code below you may want to pick it up. In fact you may want to pick it up yourself after of course you purchase the Design Patterns book if you have not already done so. This pattern twists the eye and seems deceptively simple the first couple of times you look at it, but without it you can wind up writing a lot of duplicate code.

I'll attempt to demonstrate with a skeletal interface that could be the start of a rendering API. Obviously in a fully fleshed out rendering API you'd have a lot more methods and probably a lot more classes, meshes, clippers, visibility and occlusion structures come to mind.

```cpp
#ifndef INCLUDED_RENDERER
#define INCLUDED_RENDERER

class Texture {
    public:
        virtual ~Texture() {}
        virtual void makeCurrent()=0;
};

class Renderer {
    public:
        virtual Texture * loadTexture(const char * name);
};

#endif

Figure 1. renderer.h
```

All is well and good, given a Renderer, you can ask for a Texture, and have that Texture make itself current. If your Renderer had a set of other operations for rendering polygons and managing matrices, hacking out code to use this interface looks like a straightforward proposition.

Unfortunately implementing all of your Renderer and Texture classes for different 3d APIs could lead to the onset of repetitive strain injury and if you now have to deal with several duplicate implementations of the behind the scenes linkages between the Texture class and the Renderer. Admittedly in this contrived example we're probably only talking about 3 Implementations so its not so bad, but envision a case where you may have 50-100 implementations, perhaps your monster AI if this all seems like too much work.

The real evil in cut & paste code comes when you discover a bug. If the code that you cut&pasted in 30 places to manage a linked list leaks memory whenever you delete a node, you may wind up discovering and fixing each of these mistakes as you find them rather than fixing them all at once, simply because you're apt to forget all the locations you pasted the code to, so OOP came around and people started generalizing algorithms and structures and the C++ Standard Library was born, which had all sorts of handy-dandy containers that worked of void\*'s to juggle and sort and mangle your objects, these ran afoul of the fact that void\*'s could be cast to anything and miscasting is a source of a good deal of bugs. The Standard Template Library implements these algorithms and structures using templates, trading a bit of compiler time for type checking your code.

Continuing with the example, I'm going to use templates that change who they inherit from based on a passed in parameter. This is a sneaky way to avoid the overhead of writing repetitive proxy code for mixin classes and other such busywork.

```cpp
#ifndef INCLUDED_RENDERER_TEMPLATES
#define INCLUDED_RENDERER_TEMPLATES

#include "renderer.h"

template <class Baseclass, class Renderer> class TextureTemplate : public Baseclass {
    private:
        Renderer * m_renderer;
    public:
        TextureTemplate(Renderer & rend, const char * name) : m_renderer(&rend), Baseclass(name) { }
        ~TextureTemplate() {
            m_renderer->unregisterTexture(this);
        }
        void makeCurrent() {
            m_renderer->makeCurrent(this);
        }
};

template <class Baseclass, class TextureBase> class RendererTemplate : public Baseclass {
    public:
        typedef TextureTemplate<TextureBase> MyTexture;

        Texture * loadTexture(const char * name) {
            return new MyTexture(this,name)
        }
};

#endif

Figure 2. renderer_templates.h
```

Now we've got 2 classes and 2 templates that don't seem to do anything. The templates lie in a separate header because we don't want to trouble anyone who is just using the interface with templates that are only useful for implementing the interface.

```cpp
#ifndef INCLUDED_GLRENDERER
#define INCLUDED_GLRENDERER

#include "renderer_templates.h"

class GLTextureImpl : public Texture {
    public:
        GLTextureImpl(const char * name, blah blah blah) {
            load up texture using opengl...
        }
        virtual ~GLTextureImpl() {}
};

class GLRendererImpl : public Renderer {
    public:
        void makeCurrent(GLTextureImpl & texture) {
            ... do gl texture stuff here ...
        }
    void unregisterTexture(GLTextureImpl & texture) {
        ... do gl texture stuff here ...
        }

};

typedef TextureTemplate<GLTextureImpl,GLRendererImpl> GLTexture;
typedef RendererTemplate<GLRendererImpl,GLTextureImpl> GLRenderer;

#endif

Figure 3. glrenderer.h
```

The templates are initially a fair chunk of work, but the work pays off as you add implementations by reducing mindless repetitive tasks and letting you focus on real work. The templates do not affect your overall compile time appreciably as they are included only in the individual source files that have to do with implementing your Renderer. You gain implementation while maintaining type safety by sandwiching your code between the templated typed code and the abstract implementation. Inheritance allows you to let calls trickle down the hierarchy and the template allows calls to be made 'up' the hierarchy without the virtual function call overhead.

```text
Interface
    Implementation : public Interface
        TemplateWrapper<Implementation> : public Implementation

Figure 4. Hierarchy
```

Combined with other patterns like the Singleton and Factory you can reduce the repetitiveness of your code. While this may have perverse effects when a customer or old fashioned manager rates you by lines of code written, it can make for much more maintainable code and gain you the respect and fear of your peers. =)

*Harmless*  
January 26, 2000

*This document is (C) 1999 Edward Kmett and may not be reproduced in any way without explicit permission from the author (Edward Kmett).*
