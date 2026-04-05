/**
 * Expo config plugin: Android Network Security Configuration
 *
 * Adds an explicit network_security_config.xml that permits cleartext
 * (HTTP) traffic to all destinations.  This is the reliable way to
 * allow plain-HTTP connections to a local Home Assistant instance on
 * Android 9+ (API 28+), where cleartext is blocked by default.
 *
 * Note: `android.usesCleartextTraffic: true` in app.json should do
 * the same thing via the manifest attribute, but the Network Security
 * Config file takes precedence and is more explicit — it avoids build
 * tool inconsistencies that can silently ignore the manifest attribute.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Allows cleartext (HTTP) traffic to all destinations.
  Required to reach a local Home Assistant instance over HTTP.
-->
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

/**
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @returns {import('@expo/config-plugins').ExpoConfig}
 */
const withAndroidNetworkSecurityConfig = config => {
  // 1. Write the XML resource file into the Android project during prebuild
  config = withDangerousMod(config, [
    'android',
    modConfig => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_CONFIG_XML);
      return modConfig;
    },
  ]);

  // 2. Point the <application> element at the new file
  config = withAndroidManifest(config, modConfig => {
    const app = modConfig.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return modConfig;
  });

  return config;
};

module.exports = withAndroidNetworkSecurityConfig;
