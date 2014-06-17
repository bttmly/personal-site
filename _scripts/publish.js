#!/usr/local/bin/node

var fs = require("fs");
var args = process.argv.slice(2);
var data = fs.readFileSync("_drafts/" + args[0] + ".md"));

var date = new Date();
var month = date.getMonth() + 1;
var day = date.getDate();
var year = date.getYear() + 1900;

var fileName = year + "-" + month + "-" + date + "-" + args[0] + ".md";
fs.writeFileSync("_posts/" + fileName, data);