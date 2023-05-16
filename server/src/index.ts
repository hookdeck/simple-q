/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

interface Session {
	webSocket: WebSocket;
	quit: boolean;
}

export default {
	async fetch(
		request: Request,
		env: Env & { proxies: DurableObjectNamespace },
		ctx: ExecutionContext
	): Promise<Response> {
		let url = new URL(request.url);
		let path = url.pathname.slice(1).split('/');

		if(path[0] !== 'proxy') {
			return new Response("Not found", { status: 404 });
		}

		// team_id
		if(!path[1] || !path[2]) {
			return new Response("team_id and uniqid required", { status: 500 });
		}

		const team_id = path[1];
		const uniqid = path[2];

		if(uniqid.match(/^[0-9a-f\-_]{5-16}$/)) {
			return new Response("Invalid uniqid, must match /^[0-9a-f\-_]{5-16}$/", { status: 500 });
		}

		const proxy_id = `${team_id}:${uniqid}`;
		// console.log(proxy_id);

		const do_id = env.proxies.idFromName(proxy_id);
		const proxy = env.proxies.get(do_id);

		const new_url = new URL(request.url);

		// if it's a ws connection
		if(request.method === 'GET' && path[3] === 'websocket') {
			new_url.pathname = "/websocket";
			return proxy.fetch(new_url, request);
		}

		if(request.method === 'POST') {
			new_url.pathname = "/broadcast";
			return proxy.fetch(new_url, request);
		}

		return new Response("Not found", { status: 404 });
	},
};

async function handleErrors(request: Request, func: () => Promise<Response>) {
	try {
	  return await func();
	} catch (err: any) {
	  if (request.headers.get("Upgrade") == "websocket") {
		// Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
		// won't show us the response body! So... let's send a WebSocket response with an error
		// frame instead.
		let pair = new WebSocketPair();
		pair[1].accept();
		pair[1].send(JSON.stringify({error: err.stack}));
		pair[1].close(1011, "Uncaught exception during session setup");
		return new Response(null, { status: 101, webSocket: pair[0] });
	  } else {
		return new Response(err.stack, {status: 500});
	  }
	}
  }

export class Proxy {
	protected storage: DurableObjectStorage;
	protected env: Env;
	protected sessions: any[];
	protected lastTimestamp: number;

	constructor(controller: DurableObjectState, env: Env) {
	  // `controller.storage` provides access to our durable storage. It provides a simple KV
	  // get()/put() interface.
	  this.storage = controller.storage;

	  // `env` is our environment bindings (discussed earlier).
	  this.env = env;

	  // We will put the WebSocket objects for each client, along with some metadata, into
	  // `sessions`.
	  this.sessions = [];

	  // We keep track of the last-seen message's timestamp just so that we can assign monotonically
	  // increasing timestamps even if multiple messages arrive simultaneously (see below). There's
	  // no need to store this to disk since we assume if the object is destroyed and recreated, much
	  // more than a millisecond will have gone by.
	  this.lastTimestamp = 0;
	}

	// The system will call fetch() whenever an HTTP request is sent to this Object. Such requests
	// can only be sent from other Worker code, such as the code above; these requests don't come
	// directly from the internet. In the future, we will support other formats than HTTP for these
	// communications, but we started with HTTP for its familiarity.
	async fetch(request: Request) {
	  return await handleErrors(request, async () => {
		let url = new URL(request.url);

		switch (url.pathname) {
		  case "/websocket": {
			// The request is to `/api/room/<name>/websocket`. A client is trying to establish a new
			// WebSocket session.
			if (request.headers.get("Upgrade") != "websocket") {
			  return new Response("expected websocket", {status: 400});
			}

			// Get the client's IP address for use with the rate limiter.
			let ip = request.headers.get("CF-Connecting-IP") ?? '';

			// To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
			// i.e. two WebSockets that talk to each other), we return one end of the pair in the
			// response, and we operate on the other end. Note that this API is not part of the
			// Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
			// any way to act as a WebSocket server today.
			let pair = new WebSocketPair();

			// We're going to take pair[1] as our end, and return pair[0] to the client.
			await this.handleSession(pair[1], ip);

			// Now we return the other end of the pair to the client.
			return new Response(null, { status: 101, webSocket: pair[0] });
		  }

		  case "/broadcast": {
			this.broadcast(await request.text());
			return new Response(null, { status: 204 });
		  }

		  default:
			return new Response("Not found", {status: 404});
		}
	  });
	}

	// handleSession() implements our WebSocket-based chat protocol.
	async handleSession(websocket: WebSocket, ip: string) {
	  // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
	  // WebSocket in JavaScript, not sending it elsewhere.
	  websocket.accept();

	  // Create our session and add it to the sessions list.
	  // We don't send any messages to the client until it has sent us the initial user info
	  // message. Until then, we will queue messages in `session.blockedMessages`.
	  let session: Session = { webSocket: websocket, quit: false };

	  this.sessions.push(session);

	  // Set event handlers to receive messages.
	  websocket.addEventListener("message", async msg => {
		try {
		  if (session.quit) {
			// Whoops, when trying to send to this WebSocket in the past, it threw an exception and
			// we marked it broken. But somehow we got another message? I guess try sending a
			// close(), which might throw, in which case we'll try to send an error, which will also
			// throw, and whatever, at least we won't accept the message. (This probably can't
			// actually happen. This is defensive coding.)
			websocket.close(1011, "WebSocket broken.");
			return;
		  }

		  // I guess we'll use JSON.
		  let data = JSON.parse(msg.data as string);

		  // Construct sanitized message for storage and broadcast.
		//   data = { name: session.name, message: "" + data.message };

		  // Add timestamp. Here's where this.lastTimestamp comes in -- if we receive a bunch of
		  // messages at the same time (or if the clock somehow goes backwards????), we'll assign
		  // them sequential timestamps, so at least the ordering is maintained.
		  data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
		  this.lastTimestamp = data.timestamp;

		  // Broadcast the message to all other WebSockets.
		  let data_str = JSON.stringify(data);

		  this.broadcast(data_str);

		  // Save message.
		//   let key = new Date(data.timestamp).toISOString();
		//   await this.storage.put(key, dataStr);
		} catch (err) {
		  // Report any exceptions directly back to the client. As with our handleErrors() this
		  // probably isn't what you'd want to do in production, but it's convenient when testing.
		  websocket.send(JSON.stringify({error: (err as any).stack}));
		}
	  });
	}

	// // broadcast() broadcasts a message to all clients.
	broadcast(message: string | object) {
	  // Apply JSON if we weren't given a string to start with.
	  if (typeof message !== "string") {
		message = JSON.stringify(message);
	  }

	  this.sessions = this.sessions.filter(session => {
		  try {
			session.webSocket.send(message);
			return true;
		  } catch (err) {
			// Whoops, this connection is dead.
			session.quit = true;
			return false;
		  }
	  });
	}
}