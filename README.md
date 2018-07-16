# Provenance core

Javascript library to create and manipulate a provenance graph.
The provenance graph can be used as a non-linear undo graph.

[![Build Status](https://travis-ci.org/VisualStorytelling/provenance-core.svg?branch=master)](https://travis-ci.org/VisualStorytelling/provenance-core)
[![Coverage Status](https://coveralls.io/repos/github/VisualStorytelling/provenance-core/badge.svg?branch=master)](https://coveralls.io/github/VisualStorytelling/provenance-core?branch=master)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.1248827.svg)](https://doi.org/10.5281/zenodo.1248827)

API documentation at https://visualstorytelling.github.io/provenance-core/

## What does it do?
`provenance-core` is designed to record and replay user interaction in web applications. Furthermore the aim is to provide tools around it to recombine this interaction history data into slides / stories (see e.g. [@visualstorytelling/provenance-tree-visualization](https://github.com/VisualStorytelling/provenance-tree-visualization) and [@visualstorytelling/slide-deck-visualization](https://github.com/VisualStorytelling/slide-deck-visualization).

For a simple demo, see: [provenance-tree-calculator-demo](https://visualstorytelling.github.io/provenance-tree-calculator-demo/).

## How to use it?
If `provenance-core` is to track the provenance in your application you will need to provide it with user actions. This probably means hooking up your event emitters to a [ProvenanceGraph](https://visualstorytelling.github.io/provenance-core/classes/provenancegraph.html) through a [ProvenanceTracker](https://visualstorytelling.github.io/provenance-core/classes/provenancetracker.html).
By applying [Actions](https://visualstorytelling.github.io/provenance-core/globals.html#reversibleaction) that are mapped to `ActionFunctions` in an [ActionFunctionRegistry](https://visualstorytelling.github.io/provenance-core/classes/actionfunctionregistry.html), we can build a serializable graph that can undo and replay all actions.
[ProvenanceTraverser](https://visualstorytelling.github.io/provenance-core/classes/provenancegraphtraverser.html) can then be used to go back and forward to any previous/future state: it will figure out the path through the graph and execute all the actions to get to the target [Node](https://visualstorytelling.github.io/provenance-core/globals.html#provenancenode).

`ProvenanceGraph`s can be (de-)serialized using [serializeProvenanceGraph()](https://visualstorytelling.github.io/provenance-core/globals.html#serializeprovenancegraph) and [restoreProvenanceGraph()](https://visualstorytelling.github.io/provenance-core/globals.html#restoreprovenancegraph) so that they can be stored and retrieved.

### Example 1
For a simple example on how to track provenance (in this case, of a basic button) see [this JSFiddle](https://jsfiddle.net/5e67pxbL/43/)

### Example 2
Record the actions performed on a simple calculator.
Traverse undo graph to any point will undo/redo all actions to get to that point.

```ts
import { 
    ActionFunctionRegistry, 
    ProvenanceGraph, 
    ProvenanceGraphTraverser, 
    ProvenanceTracker 
} from '@visualstorytelling/provenance-core';

class Calculator {
    result = 0;
    async add(offset) {
        this.result += offset;
    }
    async subtract(offset) {
        this.result -= offset;
    }
}

async function runme() {
    const calculator = new Calculator();
    const registry = new ActionFunctionRegistry();
    registry.register('add', calculator.add, calculator);
    registry.register('subtract', calculator.subtract, calculator);
    const graph = new ProvenanceGraph({name: 'myapplication', version:'1.2.3'});
    const tracker = new ProvenanceTracker(registry, graph);
    const traverser = new ProvenanceGraphTraverser(registry, graph);

    // Call the add function on the calculator via the provenance tracker
    result = await tracker.applyAction({
        do: 'add',
        doArguments: [13],
        undo: 'subtract',
        undoArguments: [13]
    });
    
    // calculator.result == 13

    // Undo action by going back to parent
    traverser.toStateNode(result.parent.id);

    // calculator.result == 0
}
runme();
```

## Slides / presentations
- [ProvenanceSlide](https://visualstorytelling.github.io/provenance-core/classes/provenanceslide.html)
- [ProvenanceSlidedeck](https://visualstorytelling.github.io/provenance-core/classes/provenanceslidedeck.html)
- [ProvenanceSlidedeckPlayer](https://visualstorytelling.github.io/provenance-core/classes/provenanceslidedeck.html)

## User interface
- [ProvenanceTreeVisualization](https://github.com/VisualStorytelling/provenance-tree-visualization): A user interface based on `d3` for displaying / navigating through the graph.
- [SlidedeckVisualization](https://github.com/VisualStorytelling/slidedeck-visualization): A user interface based on `d3` for creating presentation slide decks / stories.

## Install

```
npm install @visualstorytelling/provenance-core
```

### Develop

```bash
git clone https://github.com/VisualStorytelling/provenance-core.git
cd provenance-core

npm install
```

### NPM scripts

 - `npm t`: Run test suite
 - `npm start`: Run `npm run build` in watch mode
 - `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
 - `npm run test:prod`: Run linting and generate coverage
 - `npm run build`: Generate bundles and typings, create docs
 - `npm run lint`: Lints code
 - `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

### Excluding peerDependencies

On library development, one might want to set some peer dependencies, and thus remove those from the final bundle. You can see in [Rollup docs](https://rollupjs.org/#peer-dependencies) how to do that.

Good news: the setup is here for you, you must only include the dependency name in `external` property within `rollup.config.js`. For example, if you want to exclude `lodash`, just write there `external: ['lodash']`.

### Automatic releases

_**Prerequisites**: you need to create/login accounts and add your project to:_
 - [npm](https://www.npmjs.com/)
 - [Travis CI](https://travis-ci.org)
 - [Coveralls](https://coveralls.io)

_**Prerequisite for Windows**: Semantic-release uses
**[node-gyp](https://github.com/nodejs/node-gyp)** so you will need to
install
[Microsoft's windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)
using this command:_

```bash
npm install --global --production windows-build-tools
```

#### Setup steps

Follow the console instructions to install semantic release and run it (answer NO to "Do you want a `.travis.yml` file with semantic-release setup?").

```bash
npm install -g semantic-release-cli
semantic-release-cli setup
# IMPORTANT!! Answer NO to "Do you want a `.travis.yml` file with semantic-release setup?" question. It is already prepared for you :P
```

From now on, you'll need to use `npm run commit`, which is a convenient way to create conventional commits.

Automatic releases are possible thanks to [semantic release](https://github.com/semantic-release/semantic-release), which publishes your code automatically on [github](https://github.com/) and [npm](https://www.npmjs.com/), plus generates automatically a changelog. This setup is highly influenced by [Kent C. Dodds course on egghead.io](https://egghead.io/courses/how-to-write-an-open-source-javascript-library)

### Git Hooks

There is already set a `precommit` hook for formatting your code with Prettier :nail_care:

By default, there are two disabled git hooks. They're set up when you run the `npm run semantic-release-prepare` script. They make sure:
 - You follow a [conventional commit message](https://github.com/conventional-changelog/conventional-changelog)
 - Your build is not going to fail in [Travis](https://travis-ci.org) (or your CI server), since it's runned locally before `git push`

This makes more sense in combination with [automatic releases](#automatic-releases)

# Release

1. Bump the version in package.json
2. Run `npm run build`
3. Publish on npmjs
3.1 Login to npmjs with `npm login`
3.2 `npm publish --access public` to publish package
4. Create a GitHub release
5. Verify Zenodo entry
