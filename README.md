# Simple-Q

This project demonstrates building a simple pubsub queue application on top of [Hookdeck](https://hookdeck.com).

It consists of two components:
- sdk: This is the thin SDK that clients can install and can use to publish and subscribe events
- server: A thin proxy that translates that forwards the payloads it receives over a websocket connection initiated by the SDK's `.subscribe`