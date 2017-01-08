const fs = require('fs');
const cheerio = require('cheerio');
const _ = require('lodash');
const Dropbox = require('dropbox');
const wget = require('node-wget');
const async = require('async');

const config = require('./config');
const dbx = new Dropbox({
    accessToken: config.DROPBOX_TOKEN
});

// TODO: Load from request
const $ = cheerio.load(fs.readFileSync('pcp-sample.html'))

// Main entry point
async.auto({
    parse_images: function(callback) {
        // TODO: Better protection around refs
        var images = [];
        $("img").each(function(i, elem) {
            var ref = $(this).attr('data-src');
            if (ref) {
                images.push(ref);
            }
        });

        // Remove any dups
        callback(null, _.uniq(images));
    },
    get_images: ['parse_images', function(results, callback) {
        async.map(results.parse_images, getImage, callback);
    }],
    upload_images: ['get_images', function(results, callback) {
        // Getting a 429 rate limit with map
        async.mapSeries(results.get_images, uploadImage, callback);
    }]
}, function(err, results) {
    console.error('err = ', err);
    console.log('results = ', results);
});

function getImage(ref, callback) {
    wget({
            url: ref
        },
        callback
    );
}

//TODO: remove this count
var count = 0;

function uploadImage(image, callback) {
    fs.readFile(image.filepath, (err, contents) => {
        if (err) return callback(err);

        var filename = _.split(image.headers['content-disposition'],  '"',  2)[1];
        dbx.filesUpload({
                path: '/' + (count++) + '-' + filename,
                contents: contents
            })
            .then((res) => fs.unlink(image.filepath, (err) => callback(err, res)))
            .catch(callback);
    });
}
