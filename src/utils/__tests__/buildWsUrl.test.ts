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
});
