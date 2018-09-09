import {Socket} from 'dgram';

type SendCallback = (error: Error | null, bytes: number) => void;

let intercepts: {
  [path: string]: Scope[];
} = {};

const defaultPort: number = 0;
const oldSocketSend = Socket.prototype.send;

class Scope {
  public _done: boolean;
  public address?: string;
  public buffer?: Buffer | string | Uint8Array | any[];
  public length?: number;
  public offset?: number;
  public port: number;

  constructor() {
    this._done = false;
    this.port = defaultPort;
  }

  public done(): boolean {
    if (!this._done) {
      //throw new Error('Scope was not used!');
      return false;
    }
    return true;
  }
}

function overriddenSocketSend(
  msg: Buffer | string | Uint8Array | any[],
  port: number,
  address?: string,
  callback?: SendCallback
): void;
function overriddenSocketSend(
  msg: Buffer | string | Uint8Array,
  offset: number,
  length: number,
  port: number,
  address?: string,
  callback?: SendCallback
): void;
function overriddenSocketSend(
  msg: Buffer | string | Uint8Array | any[],
  offsetOrPort: number,
  lengthOrAddress?: number | string,
  portOrCallback?: number | SendCallback,
  addressOrUndefined?: string,
  callbackOrUndefined?: (error: Error | null, bytes: number) => void
): void {
  let offset = 0;
  let length = 0;
  let port = defaultPort;
  let address = 'localhost';
  let callback: SendCallback | undefined;

  if (typeof portOrCallback === 'number') {
    port = portOrCallback;
    address = addressOrUndefined || address;
    callback = callbackOrUndefined;
    length = (lengthOrAddress as number) || length;
    offset = offsetOrPort;
  } else {
    address = (lengthOrAddress as string) || address;
    callback = portOrCallback;
    port = offsetOrPort;
  }

  if (offset >= msg.length) {
    throw new Error('Offset into buffer too large.');
  }

  if (offset + length > msg.length) {
    throw new Error('Offset + length beyond buffer length.');
  }

  const newBuffer = msg.slice(offset, offset + length);
  const host = `${address}:${port}`;

  if (intercepts.hasOwnProperty(host)) {
    intercepts[host].forEach(scope => {
      scope._done = true;
      scope.address = address;
      scope.buffer = newBuffer;
      scope.length = length;
      scope.offset = offset;
      scope.port = port;
    });

    delete intercepts[host];

    if (callback) {
      callback(null, length);
    }

    return;
  }

  throw new Error(`Request sent to unmocked path: ${host}.`);
}

(overriddenSocketSend as any)._mocked = true;

function add(path: string): Scope {
  if (!intercepts.hasOwnProperty(path)) {
    intercepts[path] = [];
  }
  const scope = new Scope();
  intercepts[path].push(scope);
  return scope;
}

function cleanInterceptions(): void {
  intercepts = {};
}

function restoreSocketSend(): void {
  Socket.prototype.send = oldSocketSend;
}

function interceptSocketSend(): void {
  Socket.prototype.send = overriddenSocketSend;
}

function isMocked() {
  return Socket.prototype.send.hasOwnProperty('_mocked');
}

interceptSocketSend();

const clean = cleanInterceptions;
const intercept = interceptSocketSend;
const revert = restoreSocketSend;

export default add;
export {
  add, revert, intercept, clean, isMocked, Scope,
};

