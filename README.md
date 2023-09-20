# Home Hub v2

So unfortunately, Go + Wails did not work because:

1. Wails doesn't support cross-compilation yet, so I can't build from Mac to Linux
2. Wails can't run on the Raspberry Pi for some reason (issues with gcc toolcahin)

Electron also didn't work because:

1. Electron-Forge doesn't support Linux arm6vl (I think?)
2. Electron itself can't even run on the Pi because of a missing `.so` file??
3. Also tried building on Mac to run on Linux, this also doesn't work (I don't remember why though)

So all in all, we're going with a good ol' website instead.

## Development

To run on a Raspberry Pi, first set the `$DISPLAY` global env variable in your main shell config file (`.zshrc`, `.bashrc`, `.profile`, etc.) via:

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

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
