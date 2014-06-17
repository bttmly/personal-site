#!/usr/local/bin/node

var fs = require("fs");
var args = process.argv.slice(2);
fs.writeFileSync("_drafts/" + args[0] + ".md", fs.readFileSync("_drafts/draft-skeleton.md"));