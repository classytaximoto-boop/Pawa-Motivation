#!/usr/bin/env python3
"""Génère twa-manifest.json pour Bubblewrap sans passer par le prompt
interactif de `bubblewrap init` (qui ne fonctionne pas en CI/CD, faute de
vrai terminal TTY). Appelé depuis .github/workflows/build-apk.yml.

Usage: python3 generate-twa-manifest.py <pwa_url> <output_path>
"""
import json
import re
import sys

if len(sys.argv) != 3:
    print("Usage: generate-twa-manifest.py <pwa_url> <output_path>")
    sys.exit(1)

pwa_url = sys.argv[1]
output_path = sys.argv[2]

if not pwa_url.endswith('/'):
    pwa_url += '/'

host = re.sub(r'^https?://', '', pwa_url).split('/')[0]

manifest = {
    'packageId': 'org.boost.app.twa',
    'host': host,
    'name': 'BOOST — Become the person you want to be',
    'launcherName': 'BOOST',
    'display': 'standalone',
    'themeColor': '#0B0D10',
    'navigationColor': '#000000',
    'navigationColorDark': '#000000',
    'navigationDividerColor': '#000000',
    'navigationDividerColorDark': '#000000',
    'backgroundColor': '#0B0D10',
    'enableNotifications': False,
    'startUrl': '/',
    'iconUrl': pwa_url + 'icons/icon-512.png',
    'maskableIconUrl': pwa_url + 'icons/icon-512.png',
    'splashScreenFadeOutDuration': 300,
    'signingKey': {'path': './android.keystore', 'alias': 'android'},
    'appVersionName': '1',
    'appVersionCode': 1,
    'shortcuts': [],
    'generatorApp': 'bubblewrap-cli',
    'webManifestUrl': pwa_url + 'manifest.webmanifest',
    'fallbackType': 'customtabs',
    'features': {},
    'alphaDependencies': {'enabled': False},
    'enableSiteSettingsShortcut': True,
    'isChromeOSOnly': False,
    'isMetaQuest': False,
    'orientation': 'portrait',
    'fullScopeUrl': pwa_url,
    'minSdkVersion': 21,
    'appVersion': '1',
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"twa-manifest.json généré -> {output_path}")
print(json.dumps(manifest, indent=2, ensure_ascii=False))
