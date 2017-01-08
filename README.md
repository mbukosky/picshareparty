# Sync Pic Share Party to Dropbox

## Prerequisites

Make sure you have installed all these prerequisites on your development machine.
* Node.js - [Download & Install Node.js](http://www.nodejs.org/download/) and the npm package manager, if you encounter any problems, you can also use this [GitHub Gist](https://gist.github.com/isaacs/579814) to install Node.js.
* Yarn (optional)

## Quick Install

To install Node.js dependencies you're going to use npm again, in the application folder run this in the command-line:

`$ npm install` or `$ yarn`

## Running

`$ npm start http://bit.ly/2hRhWtC`

## Configuration

Create a `config.js` file in the root and add your dropbox token

```js
module.exports = {
    DROPBOX_TOKEN: 'dropbox_token'
};
```
