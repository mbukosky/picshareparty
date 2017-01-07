const fs = require('fs');
const cheerio = require('cheerio')

// TODO: Load from request
const $ = cheerio.load(fs.readFileSync('pcp-sample.html'))

// TODO: Better protection around refs
var images =[];
$("img").each(function(i, elem) {
    var ref = $(this).attr('data-src');
    if (ref) {
      images.push(ref);
    }
});

console.log(images);
