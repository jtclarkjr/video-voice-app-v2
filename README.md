# Video Voice App V2

A WebRTC voice and video app built with SvelteKit 2, Svelte 5, and Vite+. Users can create or join
rooms for multi-party video calls with screen sharing, chat, and adaptive layouts. Signed-in users
can also use a private live translation tool with streamed translated text and live translated
voice playback.

Backend is handled by a separate signaling, room, auth-protected translation, and OpenAI-managed
session service.

## Stack

- [Svelte 5](https://svelte.dev/)
- [SvelteKit 2](https://svelte.dev/docs/kit)
- [Vite+](https://viteplus.dev/) toolchain
- [Tailwind CSS v4](https://tailwindcss.com/)
- Native [WebRTC](https://webrtc.org/) media, data channels, and screen sharing
- OpenAI Realtime translation via backend-managed SDP session exchange
- [Zod](https://zod.dev/) for validation

## Features

### Video Conferencing

- Lobby with active room list and live room updates
- Create-room and join-room flows
- Pre-join screen with device selection and mic level preview
- Multi-party audio/video calls
- Screen sharing
- In-call chat over WebRTC data channels
- Gallery and speaker layouts
- Reconnection handling and connection quality monitoring
- Theme support

### Live Translation

- Signed-in-only private live translation sessions outside the video call flow
- Target language selector with source language auto-detection
- Streamed translated transcript display
- Live translated voice playback from the OpenAI Realtime WebRTC audio track
- Mute/unmute and browser autoplay fallback controls
- Stop cleanup for microphone, peer connection, data channel, and translated audio

## Getting Started

Install `vp` from the [Vite+ site](https://viteplus.dev/):

```sh
curl -fsSL https://vite.plus | bash
```

Then install dependencies and start the dev server:

```sh
vp install
vp config
vp dev
```

## Commands

Use `vp` as the common command interface for normal project workflows:

```sh
vp install       # install dependencies
vp dev           # run the dev server
vp check         # project checks through Vite+
vp test          # run tests
vp build         # build for production
vp preview       # preview the production build
```

For Svelte diagnostics and formatting:

```sh
vp dlx sv check
vp fmt . --write
```
