import { buildWsUrl } from '../buildWsUrl';

describe('buildWsUrl', () => {
  it('builds a plain ws URL', () => {
    expect(buildWsUrl({ host: '192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'ws://192.168.1.1:8123/api/websocket',
    );
  });

  it('builds a wss URL when ssl is true', () => {
    expect(buildWsUrl({ host: 'ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'wss://ha.example.com:443/api/websocket',
    );
  });

  it('uses the provided port', () => {
    const url = buildWsUrl({ host: 'localhost', port: 9000, ssl: false, token: '' });
    expect(url).toContain(':9000/');
  });

  it('strips http:// prefix from host', () => {
    expect(buildWsUrl({ host: 'http://192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'ws://192.168.1.1:8123/api/websocket',
    );
  });

  it('strips https:// prefix from host', () => {
    expect(buildWsUrl({ host: 'https://ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'wss://ha.example.com:443/api/websocket',
    );
  });

  it('strips ws:// prefix from host', () => {
    expect(buildWsUrl({ host: 'ws://192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'ws://192.168.1.1:8123/api/websocket',
    );
  });

  it('strips wss:// prefix from host', () => {
    expect(buildWsUrl({ host: 'wss://ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'wss://ha.example.com:443/api/websocket',
    );
  });

  it('strips trailing slashes from host', () => {
    expect(buildWsUrl({ host: '192.168.1.1/', port: 8123, ssl: false, token: '' })).toBe(
      'ws://192.168.1.1:8123/api/websocket',
    );
  });

  it('strips both protocol prefix and trailing slash', () => {
    expect(buildWsUrl({ host: 'http://192.168.1.1/', port: 8123, ssl: false, token: '' })).toBe(
      'ws://192.168.1.1:8123/api/websocket',
    );
  });
});
