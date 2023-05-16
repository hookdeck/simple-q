import axios from "axios";
import WebSocket from "isomorphic-ws";
import HookdeckAPI from "./api";
import { Connection, PublisherResponse } from "./types";

const ws_server_url = "server.maurice763.workers.dev/proxy";
export default class SimplePubSub {
  private static instance: SimplePubSub;
  private hookdeck_api: HookdeckAPI;
  private connection: Connection | null;
  private ws_by_channel: { [channel_id: string]: WebSocket };

  private constructor(api_key: string) {
    this.hookdeck_api = new HookdeckAPI(api_key);
    this.connection = null;
    this.ws_by_channel = {};
  }

  static init(api_key: string) {
    if (!this.instance) {
      this.instance = new SimplePubSub(api_key);
    }

    return this.instance;
  }

  private async newConnection(channel_id: string) {
    if (this.connection === null) {
      const data = {
        name: channel_id,
        source: {
          name: `source-${channel_id}`,
        },
        destination: {
          name: `destination-${channel_id}`,
          url: `https://${ws_server_url}/${channel_id}`,
        },
      };

      const response = await this.hookdeck_api.webhooks.upsert(data);

      const destination_url = `https://${ws_server_url}/${response.id}/${channel_id}`;
      if (response.destination.url !== destination_url) {
        response.destination.url = destination_url;

        await this.hookdeck_api.destinations.update(response.destination.id, {
          url: response.destination.url,
        });
      }

      this.connection = response;
    }
  }

  async publish(channel_id: string, message: any) {
    await this.newConnection(channel_id);

    return axios.post<PublisherResponse>(this.connection?.source.url || "", message, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async subscribe(channel_id: string, callback: (message: any) => void) {
    await this.newConnection(channel_id);

    if (!this.ws_by_channel[channel_id]) {
      this.ws_by_channel[channel_id] = new WebSocket(
        `wss://${ws_server_url}/${this.connection?.id}/${channel_id}/websocket`,
      );
    }

    // this.ws_by_channel[channel_id].onopen = () => {
    // //   console.log("connected");
    // };

    this.ws_by_channel[channel_id].onerror = (event: WebSocket.ErrorEvent) => {
      // console.log("error", event);
      throw event;
    };

    this.ws_by_channel[channel_id].onmessage = (event: WebSocket.MessageEvent) => {
      const data = JSON.parse(event.data.toString());
      // console.log("message", data);
      callback(data);
    };
  }
}
