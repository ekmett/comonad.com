Quine existed primarily to test the then-new [`gl` package](https://hackage.haskell.org/package/gl), the raw OpenGL bindings for Haskell ([source on GitHub](https://github.com/ekmett/gl)). It doubled as a graphics playground. Its README puts it simply:

> This is just me waxing nostalgic and throwing together some code for playing with graphics.

Try the two shader toys below. Choose a shader, pause it, or move through time. Generators also lets you look around by dragging the image or using the arrow keys.

<!-- demo:quine -->

## Dodecahedron

Twenty triangular frames form an interlocking compound. The shader combines distance estimates for triangular prisms, marches a ray through the resulting field, and shades the surface with two lights, shadows, and ambient occlusion. The camera circles it as time advances.

The example first appeared in Quine on [28 October 2014](https://github.com/ekmett/quine/commit/33eb8bc64a01103b1c0ff17448848fc254ed5371). Its source credits [this Shadertoy](https://www.shadertoy.com/view/MdS3Rw) as the starting point.

## Generators Redux

A camera follows a reflective ball through a repeating fractal structure. This is **Generators Redux by Kali**, reworked by **eiffie** for speed and ANGLE compatibility, then included in Quine on [8 November 2014](https://github.com/ekmett/quine/commit/2134254d4a6c8915b3eab772a23b9d58512cbc4a).

The shader keeps its original [Shadertoy attribution](https://www.shadertoy.com/view/lsXGWl) and **[CC BY-NC-SA 3.0 license](https://creativecommons.org/licenses/by-nc-sa/3.0/)**. The browser adaptation of this shader is distributed under the same license.

## Running the examples

The shaders run on the GPU through WebGL 2.

“Detail” changes the rendering resolution. The demo limits its frame rate to 30 frames per second, pauses while off screen or in a hidden tab, and starts paused when reduced motion is requested.

## Sources

- [Quine on GitHub](https://github.com/ekmett/quine), [commit 8e5ed1a](https://github.com/ekmett/quine/tree/8e5ed1a91b0ca52b442ccf4da7f7acc878e4468b).
- [Quine source archive](../../../assets/quine/original/quine-source.zip), including the Haskell application, shaders, README, and licenses.
- Dodecahedron: [original GLSL](../../../assets/quine/original/dodecahedron.frag) · [browser GLSL](../../../assets/quine/dodecahedron.frag).
- Generators Redux: [original GLSL](../../../assets/quine/original/generators.frag) · [browser GLSL](../../../assets/quine/generators.frag).
- [Haskell shader host](../../../assets/quine/original/Toy.hs) · [browser host](../../../quine-demo.js) · [Quine license](../../../assets/quine/original/LICENSE).
