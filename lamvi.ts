/// <reference path="typings/browser.d.ts" />

function helloWorld() {
  console.log("hello world");
}

helloWorld();
helloWorld();

d3.select('h1').append('h2').text('big success');

d3.select('body').append('button').classed('btn', true).classed('btn-success', true).text('Click Here??');

