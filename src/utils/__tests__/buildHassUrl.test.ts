import { buildHassUrl } from '../buildHassUrl';

describe('buildHassUrl', () => {
  it('builds a plain http URL', () => {
    expect(buildHassUrl({ host: '192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'http://192.168.1.1:8123',
    );
  });

  it('builds an https URL when ssl is true', () => {
    expect(buildHassUrl({ host: 'ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'https://ha.example.com:443',
    );
  });

  it('uses the provided port', () => {
    const url = buildHassUrl({ host: 'localhost', port: 9000, ssl: false, token: '' });
    expect(url).toContain(':9000');
  });

  it('strips http:// prefix from host', () => {
    expect(buildHassUrl({ host: 'http://192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'http://192.168.1.1:8123',
    );
  });

  it('strips https:// prefix from host', () => {
    expect(buildHassUrl({ host: 'https://ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'https://ha.example.com:443',
    );
  });

  it('strips ws:// prefix from host', () => {
    expect(buildHassUrl({ host: 'ws://192.168.1.1', port: 8123, ssl: false, token: '' })).toBe(
      'http://192.168.1.1:8123',
    );
  });

  it('strips wss:// prefix from host', () => {
    expect(buildHassUrl({ host: 'wss://ha.example.com', port: 443, ssl: true, token: '' })).toBe(
      'https://ha.example.com:443',
    );
  });

  it('strips trailing slashes from host', () => {
    expect(buildHassUrl({ host: '192.168.1.1/', port: 8123, ssl: false, token: '' })).toBe(
      'http://192.168.1.1:8123',
    );
  });

  it('strips both protocol prefix and trailing slash', () => {
    expect(buildHassUrl({ host: 'http://192.168.1.1/', port: 8123, ssl: false, token: '' })).toBe(
      'http://192.168.1.1:8123',
    );
  });
});
