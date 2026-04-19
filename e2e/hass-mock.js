/**
 * Injected via page.addInitScript() before every screenshot test.
 *
 * - Replaces window.WebSocket so HASS connections are handled locally.
 * - Pre-populates localStorage with a fake config so the app connects and
 *   lands on the Now Playing screen without needing a real HA instance.
 */
(function () {
  'use strict';

  const NOW_TS = Date.now() / 1000;

  // ── Fake entity snapshot (compressed home-assistant-js-websocket format) ──────
  // Field mapping: s=state, a=attributes, lc=last_changed (unix secs), c=context
  const ENTITIES = {
    'media_player.living_room': {
      s: 'playing',
      a: {
        friendly_name: 'Living Room',
        media_title: 'Bohemian Rhapsody',
        media_artist: 'Queen',
        media_album_name: 'A Night at the Opera',
        media_duration: 354,
        media_position: 127,
        media_position_updated_at: new Date().toISOString(),
        volume_level: 0.65,
        is_volume_muted: false,
        shuffle: false,
        repeat: 'off',
        source: 'Spotify',
        source_list: ['Spotify', 'Radio', 'Bluetooth'],
        supported_features: 445887,
        media_content_type: 'music',
        entity_picture: '/api/mock-artwork',
      },
      lc: NOW_TS,
      c: 'ctx1',
    },
    'media_player.kitchen': {
      s: 'idle',
      a: {
        friendly_name: 'Kitchen',
        volume_level: 0.30,
        is_volume_muted: false,
        supported_features: 4,
      },
      lc: NOW_TS,
      c: 'ctx2',
    },
    'media_player.bedroom': {
      s: 'off',
      a: {
        friendly_name: 'Bedroom',
        volume_level: 0.50,
        is_volume_muted: false,
        supported_features: 4,
      },
      lc: NOW_TS,
      c: 'ctx3',
    },
  };

  // ── Mock WebSocket ────────────────────────────────────────────────────────────

  const OrigWebSocket = window.WebSocket;

  function HassWebSocket(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this._listeners = {};

    const self = this;
    setTimeout(function () {
      self.readyState = 1; // OPEN
      self._emit('open', {});
    }, 5);
  }

  HassWebSocket.prototype.send = function (rawData) {
    const msg = JSON.parse(rawData);
    const self = this;
    const id = msg.id;

    if (msg.type === 'auth') {
      setTimeout(function () {
        self._emit('message', {
          data: JSON.stringify({ type: 'auth_ok', ha_version: '2024.12.0' }),
        });
      }, 5);
      return;
    }

    if (msg.type === 'ping') {
      setTimeout(function () {
        self._emit('message', { data: JSON.stringify({ id: id, type: 'pong' }) });
      }, 5);
      return;
    }

    if (msg.type === 'subscribe_entities') {
      setTimeout(function () {
        self._reply(id, null);
        self._emit('message', {
          data: JSON.stringify({
            id: id,
            type: 'event',
            event: { a: ENTITIES, c: {}, r: [] },
          }),
        });
      }, 10);
      return;
    }

    // supported_features, call_service, unsubscribe_events, get_states, etc.
    if (id != null) {
      setTimeout(function () { self._reply(id, null); }, 10);
    }
  };

  HassWebSocket.prototype._reply = function (id, result) {
    this._emit('message', {
      data: JSON.stringify({ id: id, type: 'result', success: true, result: result }),
    });
  };

  HassWebSocket.prototype.addEventListener = function (type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
  };

  HassWebSocket.prototype.removeEventListener = function (type, fn) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter(function (f) { return f !== fn; });
    }
  };

  HassWebSocket.prototype._emit = function (type, event) {
    (this._listeners[type] || []).forEach(function (fn) { fn(event); });
  };

  HassWebSocket.prototype.close = function () {
    this.readyState = 3;
    this._emit('close', { code: 1000, wasClean: true });
  };

  HassWebSocket.CONNECTING = 0;
  HassWebSocket.OPEN = 1;
  HassWebSocket.CLOSING = 2;
  HassWebSocket.CLOSED = 3;

  // home-assistant-js-websocket checks `this.socket.OPEN` (instance property),
  // not the static class constant, so these must be on the prototype too.
  HassWebSocket.prototype.CONNECTING = 0;
  HassWebSocket.prototype.OPEN = 1;
  HassWebSocket.prototype.CLOSING = 2;
  HassWebSocket.prototype.CLOSED = 3;

  function MockWebSocket(url, protocols) {
    if (url.indexOf('/api/websocket') !== -1) {
      return new HassWebSocket(url);
    }
    return new OrigWebSocket(url, protocols);
  }
  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSING = 2;
  MockWebSocket.CLOSED = 3;
  MockWebSocket.prototype = HassWebSocket.prototype;

  window.WebSocket = MockWebSocket;

  // ── Fake stored config ────────────────────────────────────────────────────────

  // expo-secure-store on web writes directly to localStorage
  localStorage.setItem('hass_config', JSON.stringify({
    host: '127.0.0.1',
    port: 8123,
    ssl: false,
    token: 'fake_ll_token',
  }));

  // @react-native-async-storage/async-storage on web writes directly to localStorage
  localStorage.setItem('app_config', JSON.stringify({
    mediaPlayers: [
      {
        entityId: 'media_player.living_room',
        name: 'Living Room',
        canBeGrouped: true,
        speakerGroupEntityId: null,
        maEntityId: null,
        lmsEntityId: null,
        searchEntries: [],
        mediaBrowserEntries: [],
      },
      {
        entityId: 'media_player.kitchen',
        name: 'Kitchen',
        canBeGrouped: true,
        speakerGroupEntityId: null,
        maEntityId: null,
        lmsEntityId: null,
        searchEntries: [],
        mediaBrowserEntries: [],
      },
      {
        entityId: 'media_player.bedroom',
        name: 'Bedroom',
        canBeGrouped: false,
        speakerGroupEntityId: null,
        maEntityId: null,
        lmsEntityId: null,
        searchEntries: [],
        mediaBrowserEntries: [],
      },
    ],
    options: {
      useArtColors: false,
      disablePlayerFocusSwitching: false,
      playerIsActiveWhen: 'playing',
      showVolumeStepButtons: true,
    },
  }));
}());
