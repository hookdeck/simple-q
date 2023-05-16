import SimplePubSub from "../src";

const pubsub = SimplePubSub.init("091d6cw8whdvpr1njbn6xyrbzp4vftxf30xdcxoy9nse3n7fn8");

pubsub.publish("channel_1", "Hello World!");
