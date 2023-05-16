import SimplePubSub from "../src";

const pubsub = SimplePubSub.init("091d6cw8whdvpr1njbn6xyrbzp4vftxf30xdcxoy9nse3n7fn8");

pubsub
  .subscribe("channel_2", (message) => {
    console.log("message received", message);
  })
  .then(() => {
    console.log("subscribed");
  });
