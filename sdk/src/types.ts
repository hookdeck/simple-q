export interface Source {
  name: string;
  url: string;
}

export interface Destination {
  id: string;
  name: string;
  url: string;
}

export interface Connection {
  id: string;
  name: string;
  destination: Destination;
  source: Source;
}

export interface PublisherResponse {
  status: string;
  message: string;
  request_id: string;
}
