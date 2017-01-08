const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const _ = require('lodash');

// TODO: Load from request
const $ = cheerio.load(fs.readFileSync('pcp-sample.html'))

// TODO: Better protection around refs
var images = [];
$("img").each(function(i, elem) {
    var ref = $(this).attr('data-src');
    if (ref) {
        images.push(ref);
    }
});
console.log(images);

// Main entry point
axios.all(getImages(images))
    .then((results) => {
        console.log(results.length);

        _.forEach(results, (x) => {
            //TODO: Upload to Dropbox
        });
    });

function getImages(refs) {
    return _.map(refs, (ref) => {
        return axios.get(ref);
    });
};
