require('babel-register')
require('babel-polyfill')
const port = process.env.PORT || 6363
require('./server').boot(port).then(function() {
  console.log('MTG-Parser listening', port)
})