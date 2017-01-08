const fs = require('fs');
const util = require('util');
const cheerio = require('cheerio');
const _ = require('lodash');
const Dropbox = require('dropbox');
const wget = require('node-wget');
const async = require('async');
const mkdirp = require('mkdirp');
const shortid = require('shortid');
const chalk = require('chalk');
const log = console.log;

const config = require('./config');
const dbx = new Dropbox({
    accessToken: config.DROPBOX_TOKEN
});
const BIT_LY = 'http://bit.ly/';

// Validate the arguments
const psp_tiny_url = process.argv[2];
if (_.isEmpty(psp_tiny_url) || !_.startsWith(psp_tiny_url, BIT_LY)) {
    throw new Error('Please pass a valid bit.ly url.');
}

var folder = _.trimStart(psp_tiny_url, 'http://bit.ly/');

// Main entry point
async.auto({
    url: async.constant(psp_tiny_url),
    source_path: async.constant('./' + folder + '/source.html'),
    create_folder: async.apply(mkdirp, folder),
    get_picsshareparty_page: ['url', 'source_path', 'create_folder', (args, callback) => {
        log(chalk.green('Downloading ' + args.url + '...'));

        wget({
                url: args.url,
                dest: args.source_path
            },
            (err, res, body) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, cheerio.load(fs.readFileSync(args.source_path)));
                }
            }
        );
    }],
    parse_images: ['get_picsshareparty_page', (results, callback) => {
        log(chalk.green('Parsing images...'));

        var $ = results.get_picsshareparty_page;

        // TODO: Better protection around refs
        var images = [];
        $("img").each(function(i, elem) {
            var ref = $(this).attr('data-src');
            if (ref) {
                images.push(ref);
            }
        });

        // Delete source and remove any dups
        fs.unlink(results.source_path, (err) => callback(err, _.uniq(images)));
    }],
    get_images: ['parse_images', (results, callback) => {
        log(chalk.green('Downloading images...'));

        async.map(results.parse_images, getImage, callback);
    }],
    upload_images: ['get_images', (results, callback) => {
        log(chalk.green('Uploading images...'));

        // Getting a 429 rate limit with map
        async.mapSeries(results.get_images, uploadImage, callback);
    }],
    delete_folder: ['upload_images', (results, callback) => {
        log(chalk.green('Deleting temp folder...'));

        fs.rmdir(folder, callback);
    }]
}, (err, results) => {
    log(chalk.red.bold(err));
    log(chalk.blue('Done.'));
});

function getImage(ref, callback) {
    log(chalk.yellow(ref));

    wget({
            url: ref,
            dest: './' + folder + '/'
        },
        callback
    );
}

function uploadImage(image, callback) {
    log(chalk.yellow(image.filepath));

    fs.readFile(image.filepath, (err, contents) => {
        if (err) return callback(err);

        var filename = _.split(image.headers['content-disposition'],  '"',  2)[1];
        var path = util.format('/%s/%s-%s', folder, shortid.generate(), filename);
        dbx.filesUpload({
                path: path,
                contents: contents
            })
            .then((res) => fs.unlink(image.filepath, (err) => callback(err, res)))
            .catch(callback);
    });
}
