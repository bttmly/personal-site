---
layout: post
title: Front-End Testing With Travis CI and Testling
---

Continuous integration is great, and with [Travis CI](https://travis-ci.org/), it's incredibly easy to get up and running. That said, their documentation for headless browser testing is a little lacking. Travis boxes have PhantomJS installed, but the PhantomJS API isn't all that intuitive. In particular most examples demonstrate how to load an existing page from the web and running tests against that. I wanted to just throw the code from my repo into a new page and test against that, but there  isn't much guidance on how to do this.

Enter [Testling](https://github.com/substack/testling). Testling sits on top of PhantomJS and lets you do exactly what I described above. By simply adding a few lines to your `package.json`, you can tell Testling what files you want to test and which other scripts (i.e. jQuery, etc.) it should inject into the page. [Testling CI](https://ci.testling.com/) is a continuous integration service based around the Testling npm package which runs your tests in a number of browsers, giving you an idea of where your code will work and where it won't; you've probably seen these badges on GitHub repos.

Unfortunately, Testling CI has some warts. Most notably, it seems to have some pretty [consistent problems](https://github.com/substack/testling/issues/88) getting webhooks from GitHub. Also, its not implemented as a full-fledged "GitHub Service", meaning it doesn't provide information integrated into the GitHub UI. In contrast, Travis automatically runs your tests against pull requests, and the status is clearly noted right in the pull request thread.

So, let's run Testling on Travis, shall we? To be clear, we won't get the primary benefit of using Testling CI (cross-browser testing), but we will be able to take advantage of the dead-simple Testling set up, and have Travis report Testling results to us on each pull request.

Here are the relevant bits from `package.json`

```json
{
  "dependencies": {
    "testling": "^1.7.0"
  }
  "scripts": {
    "test": "testling"
  },
  "testling": {
    "harness": "mocha-bdd"
    "files": [
      "./app/**/*-spec.js"
    ],
    "scripts": [
      "./bower_components/jquery/dist/jquery.js"
    ]
  }
}
```

You'll also want to include some stuff in your `.travis.yml`

```yaml
language: node_js
node_js:
  - "0.10"
before_install:
  - "npm install -g bower"
  - "bower install"
  - "export DISPLAY=:99.0"
  - "sh -e /etc/init.d/xvfb start"
```

The last two lines here I just grabbed straight from their docs; they do some setup stuff for PhantomJS. The only other 'gotcha' is to make sure your front-end dependencies are available. You can either check them in to source control or install your package manager and fetch your dependencies on the fly. By default Travis runs `npm test`, which we've set to simply the command `testling`, which in turn automatically reads the testling field from `package.json`.

You can check out a working example in this [demo repo](https://github.com/omnibus-app/testling-backbone-boilerplate).

Thanks for reading. [Tweet me]({{site.networks.twitter}}) with any questions or comments, or open an [issue]({{site.github_repo}}/issues) on this repo.

