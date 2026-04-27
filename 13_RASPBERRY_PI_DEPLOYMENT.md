# Raspberry Pi Deployment

Goal: Raspberry Pi boots directly into the Still Working installation.

## Hardware

- Raspberry Pi 5 4GB
- microSD or SSD
- HDMI display or built-in screen
- reliable power supply
- optional frame/wall mount

## OS

Use Raspberry Pi OS with desktop environment for easiest kiosk setup.

## Install dependencies

```bash
sudo apt update
sudo apt install -y nodejs npm chromium-browser unclutter
```

Depending on OS version, install Node through NodeSource or nvm if apt version is old.

## App setup

```bash
git clone <repo-url> still-working
cd still-working
npm install
cp .env.example .env
nano .env
npm run build
npm start
```

## Kiosk command

Use Chromium to open the local app fullscreen:

```bash
chromium-browser --kiosk --disable-infobars --noerrdialogs --disable-session-crashed-bubble http://localhost:3000
```

## Autostart option

Create a startup script:

```bash
mkdir -p ~/bin
nano ~/bin/start-still-working.sh
```

Script:

```bash
#!/bin/bash
cd /home/pi/still-working
npm start &
sleep 8
chromium-browser --kiosk --disable-infobars --noerrdialogs --disable-session-crashed-bubble http://localhost:3000
```

Make executable:

```bash
chmod +x ~/bin/start-still-working.sh
```

Add to desktop autostart:

```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add:

```text
@/home/pi/bin/start-still-working.sh
```

## Reliability notes

- The app must work without internet using fallback director.
- If internet is available and `OPENAI_API_KEY` exists, OpenAI director may be used.
- Keep the display awake; disable screen blanking in Raspberry Pi settings.
- Consider a nightly reboot cron if long-running graphics memory becomes unstable.

## Presentation mode

For a clean art installation:

- hide mouse cursor with `unclutter`
- disable notifications
- use fullscreen/kiosk
- do not expose menus or debug data
