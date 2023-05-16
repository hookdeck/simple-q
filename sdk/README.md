# SimpleQ

Introducing Pub Sub: Streamline Your Development with Effortless Asynchronous Message Queues!

SimpleQ is the ultimate tool for developers who require an asynchronous message queue. With just two lines of code, you can create a complete queue.

Built with developers in mind, SimpleQ uses Hookdeck as a backend. Our intelligent proxy bridges the gap and serves as a receiver, ensuring reliable communication.

## Features

- Easy to use: With just two lines of code, you can create a complete queue.
- Real-time asynchronous applications: Perfect for chat applications, real-time notifications, and high-frequency trading applications.
- Observability: Enjoy observability and advanced filtering features native to Hookdeck to optimize your data streams.
- Intuitive implementation: Simplify your workflow with SimpleQ's intuitive implementation.
- Works from nodeJS process and browser applications.
- Uses hookdeck as a backend - Filtering, transformations, fan-out at with no extra code

## Pre-requisites
You'll need a [hookdeck.com](https://hookdeck.com) API key to use this package, since it uses Hookdeck as a backend.

Head over to Hookdeck.com, sign up for an account, and head over to:

`workspace settings (top left corner) > Secrets tab`

and get your `API Key` to use in the code below.

## Getting started

To get started with SimpleQ, follow these simple steps:

1. Install SimpleQ using npm
```
npm i @hck23/simple-q
```

Or yarn:
```
yarn add @hck23/simple-q
```

2. Initialize a new queue

```javascript
import simpleq from '@hck23/simple-q';

const q = simpleq.init('<api-key>');
```

3. Subscribe
```javascript
q.subscribe('hck2023-chnl1', (message) => {
  console.log('Received message:', message);
});
```

4. Publish a message to the queue:
```javascript
q.publish('hck2023-chnl1', 'Hello, World!');
```

That's it! With just these four simple steps, you can start using SimpleQ to for any application where real time messaging is needed.

## License
This project is licensed under the MIT License.