# Group Audio Chat with WebRTC and Firebase

Build an audio-only group call feature with WebRTC mesh signaling via Firestore and JavaScript.

Watch the [WebRTC Explanation on YouTube](https://youtu.be/WmR9IMUD_CY) and follow the full [WebRTC Firebase Tutorial](https://fireship.io/lessons/webrtc-firebase-video-chat) on Fireship.io. 


## Usage

1. Update the Firebase project config in `main.js` (in this **`WebRTC/`** folder).
2. From the **repository root**, enter this folder and run:

```
cd WebRTC
npm install
npm run dev
```

If your terminal is already in **`WebRTC/`**, run only `npm install` and `npm run dev`.

3. Open multiple browser tabs/devices on the same room:
   - Click `Start microphone`
   - One user clicks `Create Room`
   - Other users paste Room ID and click `Join Room`
