import axios, { AxiosInstance } from "axios";
import { Connection, Destination } from "./types";

const base_url = "https://api-proxy.maurice763.workers.dev";
const api_version = "2023-01-01";
export default class HookdeckAPI {
  private api_key: string;

  constructor(api_key: string) {
    this.api_key = api_key;
  }

  createAxios = (content_type = "application/json"): AxiosInstance => {
    return axios.create({
      baseURL: `${base_url}/${api_version}`,
      headers: {
        "Content-Type": content_type,
        Authorization: `Bearer ${this.api_key}`,
      },
    });
  };

  webhooks = {
    upsert: async (data: object): Promise<Connection> => {
      const response = await this.createAxios().put<Connection>(`/webhooks`, data);
      return response.data;
    },
  };

  destinations = {
    update: async (id: string, data: { url: string }): Promise<Destination> => {
      const response = await this.createAxios().put<Destination>(`/destinations/${id}`, data);
      return response.data;
    },
  };
}
