# brat for Android

A fully offline Android wrapper for the existing vanilla HTML/CSS/JS editor in `main/brat/`.

## Get an APK without Android Studio

1. Open **Actions** in GitHub.
2. Select **Build BRAT Android APK**.
3. Select **Run workflow** (or push changes to `main/brat/` or `android/brat/`).
4. After a successful build, open the run's **Artifacts** and download **brat-debug-apk**.
5. Unzip the artifact and install `app-debug.apk` on your Android phone.

This is a **debug-signed APK** for personal testing, not a Play Store release. Android may ask you to allow installing from this source.

## Build locally

Requirements: Node.js 22, JDK 21, Android SDK.

```sh
cd android/brat
npm install
npm run android:add
npm run android:build
```

The APK is created at `android/brat/android/app/build/outputs/apk/debug/app-debug.apk`.

## Offline design

The build copies the full `main/brat/` directory (including `assets/css/` and `assets/js/`) into the Capacitor web directory, then changes absolute `/brat/` asset URLs to relative URLs. No live website or remote server is loaded. Images can be selected from the device; generated images are exported using the existing browser download implementation. Gallery-saving behavior depends on the Capacitor integration and Android permissions; verify it on a device.
