export const en = {
  settings: {
    invalidToken:
      'Invalid token. Your access token was rejected by Home Assistant. Please enter a new one.',
    section: {
      homeAssistant: 'Home Assistant',
      appearance: 'Appearance',
      appOptions: 'App Options',
      mediaPlayers: 'Media Players',
    },
    field: {
      host: {
        label: 'Host / IP',
        placeholder: '192.168.1.100',
        required: 'Host is required',
      },
      port: {
        label: 'Port',
        placeholder: '8123',
      },
      ssl: {
        label: 'Use SSL (wss://)',
      },
      token: {
        label: 'Long-lived access token',
        placeholder: 'eyJ...',
        required: 'Token is required',
      },
      sourceColor: {
        label: 'Source color (hex)',
        placeholder: '#6750A4',
      },
      playerIsActiveWhen: {
        label: 'Player is active when',
        playing: 'Playing',
        playingOrPaused: 'Playing or paused',
      },
    },
    option: {
      useArtColors: 'Use art colors',
    },
    mediaPlayers: {
      configure: 'Configure media players',
    },
    save: 'Save',
    saving: 'Saving\u2026',
  },

  mediaPlayers: {
    empty: {
      title: 'No players configured',
      description: 'Add players from your Home Assistant instance using the buttons below.',
    },
    action: {
      moveUp: 'Move up',
      moveDown: 'Move down',
      edit: 'Edit player',
      delete: 'Delete player',
    },
    notConnected: 'Connect to Home Assistant to add players.',
    allConfigured: 'All available players are already configured.',
    addPlayer: 'Add Player',
    addAll: 'Add All (%{count})',
    modal: {
      title: 'Add Player',
      close: 'Close',
    },
  },

  playerConfig: {
    notFound: 'Player not found.',
    section: {
      entity: 'Entity',
      display: 'Display',
      grouping: 'Grouping',
      search: 'Search',
      mediaBrowser: 'Media Browser',
      musicAssistant: 'Music Assistant',
      lms: 'Logitech Media Server',
    },
    field: {
      entityId: 'Entity ID',
      nameOverride: 'Name override',
      canBeGrouped: 'Can be grouped',
      speakerGroupEntityId: {
        label: 'Speaker group entity ID',
        placeholder: 'media_player.group_entity',
      },
      searchEntity: {
        label: 'Search entity',
        placeholder: 'media_player.search_entity',
      },
      displayName: {
        placeholder: 'Display name (optional)',
      },
      browseEntity: {
        label: 'Browse entity',
        placeholder: 'media_player.browse_entity',
      },
      maEntityId: {
        label: 'MA entity ID',
        placeholder: 'media_player.music_assistant_entity',
      },
      maFavoriteButtonEntityId: {
        label: 'MA favorite button entity ID',
        placeholder: 'button.ma_favorite',
      },
      lmsEntityId: {
        label: 'LMS entity ID',
        placeholder: 'media_player.lms_entity',
      },
    },
    search: {
      hint: "Add entities whose media can be searched. When empty, the player's own entity is used.",
    },
    mediaBrowser: {
      hint: "Add entities whose media libraries can be browsed. When empty, the player's own entity is used.",
    },
    addSearchEntry: 'Add search entry',
    addBrowserEntry: 'Add browser entry',
    removeEntry: 'Remove entry',
    save: 'Save',
    saving: 'Saving\u2026',
    removePlayer: 'Remove Player',
  },

  tabs: {
    nowPlaying: 'Now Playing',
    queue: 'Queue',
    search: 'Search',
    browse: 'Browse',
    speakers: 'Speakers',
    openSettings: 'Open settings',
  },

  nowPlaying: {
    playerNotAvailable: 'Player not available.',
    turnOn: 'Turn on',
  },

  queue: {
    clearQueue: 'Clear queue',
    clear: 'Clear',
    refresh: 'Refresh queue',
    transferQueue: 'Transfer queue',
    notAvailable: 'Queue not available for this player.',
    notConfigured:
      'Queue not available \u2014 configure Music Assistant or Lyrion Media Server for this player in Settings.',
    empty: 'Queue is empty',
  },

  browser: {
    mediaSource: 'Media source',
    selectMediaSource: 'Select media source',
    selectPlayer: 'Select a player to browse media',
    notConnected: 'Not connected to Home Assistant',
  },

  search: {
    searchProvider: 'Search provider',
    selectSearchProvider: 'Select search provider',
    selectPlayer: 'Select a player to search',
    notConnected: 'Not connected to Home Assistant',
  },

  speakers: {
    joinSpeakers: 'Join speakers',
    manageSpeakers: 'Manage which speakers play together',
    linkVolume: 'Link volume',
    turnOn: 'Turn on',
    unmute: 'Unmute',
    mute: 'Mute',
    removeFromGroup: 'Remove from group',
    addSpeakers: 'Add speakers',
    addSpeaker: 'Add %{name}',
  },

  customButtons: {
    comingSoon: 'Custom Buttons \u2014 coming soon',
  },

  mediaCard: {
    state: {
      playing: 'Playing',
      paused: 'Paused',
      idle: 'Idle',
      off: 'Off',
      unavailable: 'Unavailable',
      unknown: 'Unknown',
      standby: 'Standby',
      buffering: 'Buffering',
    },
    play: 'Play',
    pause: 'Pause',
  },

  playbackControls: {
    shuffleOn: 'Shuffle on',
    shuffleOff: 'Shuffle off',
    previousTrack: 'Previous track',
    play: 'Play',
    pause: 'Pause',
    nextTrack: 'Next track',
    repeat: 'Repeat %{mode}',
  },

  haSearch: {
    enqueue: {
      play: 'Play',
      replaceQueue: 'Replace Queue',
      addNext: 'Add Next',
      addToQueue: 'Add to Queue',
    },
    placeholder: 'Search...',
    clearSearch: 'Clear search',
    playbackMode: 'Playback Mode',
    changeEnqueueMode: 'Change enqueue mode',
    filterBy: 'Filter by %{name}',
    noResults: 'No results.',
    notAvailable: 'Search is not available for this player.',
    typeToSearch: 'Type to search.',
    noResultsForQuery: 'No results for \u201c%{query}\u201d.',
  },

  haMediaBrowser: {
    action: {
      play: 'Play',
      replaceQueue: 'Replace queue',
      playNext: 'Play next',
      addToQueue: 'Add to queue',
      open: 'Open',
    },
    filterItems: 'Filter items...',
    noItems: 'No media items available.',
    goBack: 'Go back',
  },

  speakersSheet: {
    speakers: 'Speakers',
    speakersConnected: 'Speakers, %{count} connected',
    off: 'Off',
  },

  sourceSelect: {
    title: 'Source',
    selectSource: 'Select source',
  },
} as const;
