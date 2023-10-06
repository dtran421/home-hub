# Home Hub v2

So unfortunately, Go + Wails did not work because:

1. Wails doesn't support cross-compilation yet, so I can't build from Mac to Linux
2. Wails can't run on the Raspberry Pi for some reason (issues with gcc toolchain)

Electron also didn't work because:

1. Electron-Forge doesn't support Linux arm6vl (I think?)
2. Electron itself can't even run on the Pi because of a missing `.so` file??
3. Also tried building on Mac to run on Linux, this also doesn't work (I don't remember why though)

So all in all, we're going with a good ol' website instead.

## Development

### Stack

- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [tRPC](https://trpc.io/)
- [PlanetScale](https://planetscale.com/)
- [Drizzle](https://drizzle.studio/)
- [Vercel](https://vercel.com/)

To run the development server, run the following command:

```zsh
yarn dev
```

To run the development server on a Raspberry Pi, run the following command:

```zsh
yarn dev:pi
```

The above will handle running the server automatically. However, if you want to run the command manually, first set the `$DISPLAY` global env variable in your main shell config file (`.zshrc`, `.bashrc`, `.profile`, etc.) via:

```bash
export DISPLAY=:0
```

Then, run the following command:

```zsh
chromium-browser --start-fullscreen --app=http://localhost:3000
```

> Note: the `--app` flag is useful for hiding the 'Restore tabs' popup that appears when Chromium crashes (or is killed),
> allowing you to use Ctrl + C to kill the process without having to worry about the popup.

## TODO

- [ ] [Set up kiosk mode](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
