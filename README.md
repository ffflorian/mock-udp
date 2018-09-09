# mock-udp [![Build Status](https://api.travis-ci.org/ffflorian/mock-udp.svg?branch=master)](https://travis-ci.org/ffflorian/mock-udp/) [![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ffflorian/mock-udp)](https://dependabot.com)

Mock dgram udp requests. Based on [node-mock-udp](https://github.com/mattrobenolt/node-mock-udp).

## Installation

Run `yarn add @ffflorian/mock-udp`.


## Usage
```ts
import * as dgram from 'dgram'
import * as mockudp from '@ffflorian/mock-udp';
// When imported, Socket gets patched immediately.

// Create scope to capture UDP requests
const scope = mockudp.add('localhost:1234');

const client = dgram.createSocket('udp4');
const message = Buffer.from('hello world');

client.send(message, 0, message.length, 1234, 'localhost', (err, bytes) => {
    scope.buffer; // scope.buffer is the buffer which would have been sent
    scope.done();  // Will return `true` if the scope was used, otherwise `false`.
});
