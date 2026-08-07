# How to Build the Native Android App (.APK) in Android Studio

Follow these simple steps to compile **Ultimate Joy Home** into a standalone Android APK using Android Studio on your laptop:

### Step 1: Create New Android Studio Project
1. Launch **Android Studio**.
2. Select **New Project** &rarr; **Empty Views Activity**.
3. Fill in the project details:
   - **Name**: `Ultimate Joy Home`
   - **Package name**: `com.ultimatejoyhome.estimate`
   - **Save location**: Choose any folder on your laptop
   - **Language**: `Java`
   - **Minimum SDK**: `API 21: Android 5.0 (Lollipop)`
4. Click **Finish** and wait for Gradle setup to complete.

### Step 2: Add Web Assets
1. In Android Studio's **Project View** (left panel), switch view mode to **Project**.
2. Navigate to `app/src/main/`.
3. Create a folder named `assets` inside `main`, and inside `assets` create a folder named `www`.
   (Directory structure: `app/src/main/assets/www/`)
4. Copy all files from `c:\Users\Sherifa\Desktop\estimate\` (including `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, and the `assets/` folder) into `app/src/main/assets/www/`.

### Step 3: Replace MainActivity.java & AndroidManifest.xml
1. Open `app/src/main/java/com/ultimatejoyhome/estimate/MainActivity.java` and paste the code from `android/MainActivity.java`.
2. Open `app/src/main/AndroidManifest.xml` and paste the contents from `android/AndroidManifest.xml`.

### Step 4: Build APK
1. In Android Studio top menu, click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
2. Android Studio will generate `app-debug.apk`.
3. Transfer the `.apk` file to your mobile phone or install it on an Android emulator!
