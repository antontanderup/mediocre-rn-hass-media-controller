export const en = {
  // ── Settings screen ──────────────────────────────────────────────────────────
  'settings.invalidToken':
    'Invalid token. Your access token was rejected by Home Assistant. Please enter a new one.',
  'settings.section.homeAssistant': 'Home Assistant',
  'settings.field.host.label': 'Host / IP',
  'settings.field.host.placeholder': '192.168.1.100',
  'settings.field.host.required': 'Host is required',
  'settings.field.port.label': 'Port',
  'settings.field.port.placeholder': '8123',
  'settings.field.ssl.label': 'Use SSL (wss://)',
  'settings.field.token.label': 'Long-lived access token',
  'settings.field.token.placeholder': 'eyJ...',
  'settings.field.token.required': 'Token is required',
  'settings.section.appearance': 'Appearance',
  'settings.field.sourceColor.label': 'Source color (hex)',
  'settings.field.sourceColor.placeholder': '#6750A4',
  'settings.section.appOptions': 'App Options',
  'settings.option.useArtColors': 'Use art colors',
  'settings.option.showVolumeStepButtons': 'Show volume step buttons',
  'settings.option.disablePlayerFocusSwitching': 'Disable player focus switching',
  'settings.field.playerIsActiveWhen.label': 'Player is active when',
  'settings.field.playerIsActiveWhen.playing': 'Playing',
  'settings.field.playerIsActiveWhen.playingOrPaused': 'Playing or paused',
  'settings.section.mediaPlayers': 'Media Players',
  'settings.mediaPlayers.configure': 'Configure media players',
  'settings.save': 'Save',
  'settings.saving': 'Saving\u2026',

  // ── Media Players screen ─────────────────────────────────────────────────────
  'mediaPlayers.empty.title': 'No players configured',
  'mediaPlayers.empty.description':
    'Add players from your Home Assistant instance using the buttons below.',
  'mediaPlayers.action.moveUp': 'Move up',
  'mediaPlayers.action.moveDown': 'Move down',
  'mediaPlayers.action.edit': 'Edit player',
  'mediaPlayers.action.delete': 'Delete player',
  'mediaPlayers.notConnected': 'Connect to Home Assistant to add players.',
  'mediaPlayers.allConfigured': 'All available players are already configured.',
  'mediaPlayers.addPlayer': 'Add Player',
  'mediaPlayers.addAll': 'Add All ({count})',
  'mediaPlayers.modal.title': 'Add Player',
  'mediaPlayers.modal.close': 'Close',

  // ── Player config screen ─────────────────────────────────────────────────────
  'playerConfig.notFound': 'Player not found.',
  'playerConfig.section.entity': 'Entity',
  'playerConfig.field.entityId': 'Entity ID',
  'playerConfig.section.display': 'Display',
  'playerConfig.field.nameOverride': 'Name override',
  'playerConfig.section.grouping': 'Grouping',
  'playerConfig.field.canBeGrouped': 'Can be grouped',
  'playerConfig.field.speakerGroupEntityId.label': 'Speaker group entity ID',
  'playerConfig.field.speakerGroupEntityId.placeholder': 'media_player.group_entity',
  'playerConfig.section.search': 'Search',
  'playerConfig.search.hint':
    "Add entities whose media can be searched. When empty, the player's own entity is used.",
  'playerConfig.field.searchEntity.placeholder': 'media_player.search_entity',
  'playerConfig.field.displayName.placeholder': 'Display name (optional)',
  'playerConfig.addSearchEntry': 'Add search entry',
  'playerConfig.removeEntry': 'Remove entry',
  'playerConfig.section.mediaBrowser': 'Media Browser',
  'playerConfig.mediaBrowser.hint':
    "Add entities whose media libraries can be browsed. When empty, the player's own entity is used.",
  'playerConfig.field.browseEntity.placeholder': 'media_player.browse_entity',
  'playerConfig.addBrowserEntry': 'Add browser entry',
  'playerConfig.section.musicAssistant': 'Music Assistant',
  'playerConfig.field.maEntityId.label': 'MA entity ID',
  'playerConfig.field.maEntityId.placeholder': 'media_player.music_assistant_entity',
  'playerConfig.field.maFavoriteButtonEntityId.label': 'MA favorite button entity ID',
  'playerConfig.field.maFavoriteButtonEntityId.placeholder': 'script.ma_favorite',
  'playerConfig.section.lms': 'Logitech Media Server',
  'playerConfig.field.lmsEntityId.label': 'LMS entity ID',
  'playerConfig.field.lmsEntityId.placeholder': 'media_player.lms_entity',
  'playerConfig.save': 'Save',
  'playerConfig.saving': 'Saving\u2026',
  'playerConfig.removePlayer': 'Remove Player',

  // ── Tab navigation ───────────────────────────────────────────────────────────
  'tabs.nowPlaying': 'Now Playing',
  'tabs.queue': 'Queue',
  'tabs.search': 'Search',
  'tabs.browse': 'Browse',
  'tabs.speakers': 'Speakers',
  'tabs.openSettings': 'Open settings',

  // ── Now Playing screen ───────────────────────────────────────────────────────
  'nowPlaying.playerNotAvailable': 'Player not available.',

  // ── Queue screen ─────────────────────────────────────────────────────────────
  'queue.clearQueue': 'Clear queue',
  'queue.clear': 'Clear',
  'queue.notAvailable':
    'Queue not available \u2014 configure Music Assistant or Lyrion Media Server for this player in Settings.',
  'queue.empty': 'Queue is empty',

  // ── Browser screen ───────────────────────────────────────────────────────────
  'browser.mediaSource': 'Media source',
  'browser.selectMediaSource': 'Select media source',
  'browser.selectPlayer': 'Select a player to browse media',
  'browser.notConnected': 'Not connected to Home Assistant',

  // ── Search screen ────────────────────────────────────────────────────────────
  'search.searchProvider': 'Search provider',
  'search.selectSearchProvider': 'Select search provider',
  'search.selectPlayer': 'Select a player to search',
  'search.notConnected': 'Not connected to Home Assistant',

  // ── Speakers tab ─────────────────────────────────────────────────────────────
  'speakers.joinSpeakers': 'Join speakers',
  'speakers.manageSpeakers': 'Manage which speakers play together',
  'speakers.linkVolume': 'Link volume',
  'speakers.turnOn': 'Turn on',
  'speakers.unmute': 'Unmute',
  'speakers.mute': 'Mute',
  'speakers.removeFromGroup': 'Remove from group',
  'speakers.addSpeaker': 'Add {name}',
  'speakers.switchPlayer': 'Switch player',
  'speakers.focusDifferentPlayer': 'Focus a different player',
  'speakers.empty':
    'No speakers configured for grouping. Mark players as groupable in Settings \u2192 Media Players.',

  // ── Custom Buttons ───────────────────────────────────────────────────────────
  'customButtons.comingSoon': 'Custom Buttons \u2014 coming soon',

  // ── MediaCard component ──────────────────────────────────────────────────────
  'mediaCard.state.playing': 'Playing',
  'mediaCard.state.paused': 'Paused',
  'mediaCard.state.idle': 'Idle',
  'mediaCard.state.off': 'Off',
  'mediaCard.state.unavailable': 'Unavailable',
  'mediaCard.state.unknown': 'Unknown',
  'mediaCard.state.standby': 'Standby',
  'mediaCard.state.buffering': 'Buffering',
  'mediaCard.play': 'Play',
  'mediaCard.pause': 'Pause',

  // ── PlaybackControls component ───────────────────────────────────────────────
  'playbackControls.shuffleOn': 'Shuffle on',
  'playbackControls.shuffleOff': 'Shuffle off',
  'playbackControls.previousTrack': 'Previous track',
  'playbackControls.play': 'Play',
  'playbackControls.pause': 'Pause',
  'playbackControls.nextTrack': 'Next track',
  'playbackControls.repeat': 'Repeat {mode}',

  // ── HaSearch component ───────────────────────────────────────────────────────
  'haSearch.enqueue.play': 'Play',
  'haSearch.enqueue.replaceQueue': 'Replace Queue',
  'haSearch.enqueue.addNext': 'Add Next',
  'haSearch.enqueue.addToQueue': 'Add to Queue',
  'haSearch.placeholder': 'Search...',
  'haSearch.clearSearch': 'Clear search',
  'haSearch.playbackMode': 'Playback Mode',
  'haSearch.changeEnqueueMode': 'Change enqueue mode',
  'haSearch.filterBy': 'Filter by {name}',
  'haSearch.noResults': 'No results.',
  'haSearch.notAvailable': 'Search is not available for this player.',
  'haSearch.typeToSearch': 'Type to search.',
  'haSearch.noResultsForQuery': 'No results for \u201c{query}\u201d.',

  // ── HaMediaBrowser component ─────────────────────────────────────────────────
  'haMediaBrowser.action.play': 'Play',
  'haMediaBrowser.action.replaceQueue': 'Replace queue',
  'haMediaBrowser.action.playNext': 'Play next',
  'haMediaBrowser.action.addToQueue': 'Add to queue',
  'haMediaBrowser.action.open': 'Open',
  'haMediaBrowser.filterItems': 'Filter items...',
  'haMediaBrowser.noItems': 'No media items available.',
  'haMediaBrowser.goBack': 'Go back',

  // ── SpeakersSheet component ──────────────────────────────────────────────────
  'speakersSheet.speakers': 'Speakers',
  'speakersSheet.speakersConnected': 'Speakers, {count} connected',
  'speakersSheet.off': 'Off',

  // ── SourceSelect component ───────────────────────────────────────────────────
  'sourceSelect.title': 'Source',
  'sourceSelect.selectSource': 'Select source',
} as const;
