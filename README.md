# Videotelefonie

## Lokal starten

Das Projekt braucht zwei Prozesse:

```sh
npm run dev
npm run dev:signal
```

Das Frontend laeuft lokal ueber Vite. Der Signaling-Server laeuft lokal standardmaessig auf `ws://localhost:8080`.

## Umgebungsvariable

Lege fuer das Frontend bei Bedarf eine `.env` an:

```sh
PUBLIC_SIGNAL_URL=ws://localhost:8080
```

Ohne gesetzte Variable verwendet die App ebenfalls `ws://localhost:8080`.

Fuer TURN/STUN kannst du optional weitere Variablen setzen:

```sh
PUBLIC_STUN_URLS=stun:stun.l.google.com:19302
PUBLIC_TURN_URLS=turn:your-turn-host:3478
PUBLIC_TURN_USERNAME=your-username
PUBLIC_TURN_CREDENTIAL=your-password
```

`PUBLIC_TURN_URLS` kann mehrere durch Komma getrennte URLs enthalten.

## Deployment

Die Svelte-App und der Signaling-Server sollten getrennt deployed werden.

- Frontend: z. B. Vercel
- Signaling-Server: z. B. Render, Railway oder Fly.io

Der Signaling-Server nutzt automatisch `process.env.PORT` und kann deshalb auf solchen Plattformen direkt mit diesem Startbefehl laufen:

```sh
node server/websocket.js
```

Setze im Frontend-Hosting dann die Variable `PUBLIC_SIGNAL_URL`, zum Beispiel:

```sh
PUBLIC_SIGNAL_URL=wss://dein-signal-server.example.com
```

## Render fuer den Signaling-Server

In diesem Repo liegt bereits eine [render.yaml](c:\Users\User\Desktop\Shkoll\Media\ProjektITP\videocall\render.yaml). Du kannst deshalb direkt dieses Repository bei Render importieren.

Render verwendet dann:

```sh
npm install
npm run start:signal
```

Nach dem Deploy bekommst du eine URL wie:

```sh
wss://videocall-signal.onrender.com
```

Diese URL traegst du in Vercel als `PUBLIC_SIGNAL_URL` ein und startest danach ein neues Deployment.
