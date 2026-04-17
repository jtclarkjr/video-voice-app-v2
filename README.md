# Video Voice App V2

A WebRTC video calling app built with SvelteKit 2, Svelte 5, and Vite+. Users can create or join
rooms from a lobby and participate in multi-party video calls with screen sharing, chat, and
adaptive layouts.

Backend is handled by a separate signaling and room service.

## Stack

- [Svelte 5](https://svelte.dev/)
- [SvelteKit 2](https://svelte.dev/docs/kit)
- [Vite+](https://viteplus.dev/) toolchain
- [Tailwind CSS v4](https://tailwindcss.com/)
- Native [WebRTC](https://webrtc.org/) media, data channels, and screen sharing
- [Zod](https://zod.dev/) for validation

## Features

- Lobby with active room list and live room updates
- Create-room and join-room flows
- Pre-join screen with device selection and mic level preview
- Multi-party audio/video calls
- Screen sharing
- In-call chat over WebRTC data channels
- Gallery and speaker layouts
- Reconnection handling and connection quality monitoring
- Theme support

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

For Svelte file checks and formatting, use the project's Svelte-specific commands:

```sh
vp dlx sv check
vp run fmt:sv
```
