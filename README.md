# Provenance core

Javascript library to create and manipulate a provenance graph.
The provenance graph can be usesd as a non-linear undo graph.

[![Build Status](https://travis-ci.org/VisualStorytelling/provenance-core.svg?branch=master)](https://travis-ci.org/VisualStorytelling/provenance-core)
[![Coverage Status](https://coveralls.io/repos/github/VisualStorytelling/provenance-core/badge.svg?branch=master)](https://coveralls.io/github/VisualStorytelling/provenance-core?branch=master)

## Example

Record the actions performed on a simple calculator.
Traverse undo graph to any point will undo/redo all actions to get to that point.

```ts
import { ActionFunctionRegistry, ProvenanceGraph, ProvenanceGraphTraverser, ProvenanceTracker } from 'provenance-core';

class Calculator {
    result = 0;
    async add(offset) {
        this.result += offset;
    }
    async substract(offset) {
        this.result -+ offset;
    }
}

const calculator = new Calculator();
const registry = new ActionFunctionRegistry();
registry.register('add', calculator.add, calculator);
registry.register('substract', calculator.substract, calculator);
const graph = new ProvenanceGraph({name: 'myapplication', version:'1.2.3'});
const tracker = new ProvenanceTracker(registry, graph);
const traverser = new ProvenanceGraphTraverser(registry, graph);


result = await tracker.applyAction({
    do: 'add',
    doArguments: [13],
    undo: 'subtract',
    undoArguments: [13],
    metadata: {
        createdBy: 'me',
        createdOn: 'now',
        tags: [],
        userIntent: 'Because I want to'
    }
});

// calculator.result == 13

// Undo action by going back to parent
traverser.toStateNode(result.parent.id);

// calculator.result == 0
```

## Install

```
npm install provenance-core
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
