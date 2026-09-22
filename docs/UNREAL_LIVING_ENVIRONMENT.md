# MiD-Daily — UNREAL Living Environment

## Purpose

MiD-Daily uses a procedural **Living Environment** instead of photographic or video backgrounds. The environment is a lightweight digital system that reacts to time, location, astronomy, and weather while keeping application content primary.

Core principle:

> Do not put nature inside MiD. Make MiD behave like a digital world.

## Environment inputs

- Browser local time
- User-approved device coordinates when available
- Location timezone resolved by the weather response
- Solar position calculated locally
- Lunar position and phase calculated locally
- Current weather from Open-Meteo
- Cached weather fallback for degraded/offline sessions

Geolocation is only requested through the browser permission flow. No exact coordinates are sent to MiD-Daily application storage; persisted coordinates are rounded to two decimal places.

## Rendering model

The renderer is intentionally dependency-free and procedural:

1. CSS gradients define sky and horizon atmosphere.
2. SVG-free CSS shapes represent sun and moon.
3. A small deterministic star field is rendered as simple elements.
4. Clouds are a low-frequency CSS texture with slow motion.
5. Rain is a lightweight repeating gradient rather than hundreds of DOM particles.
6. Fog is built from low-opacity radial gradients.
7. Content surfaces remain opaque enough for readability.
8. No persistent backdrop-filter or full-screen video assets are used.

The renderer exposes environmental values through CSS custom properties and data attributes.

## Day phases

The environment recognizes:

- night
- dawn
- morning
- day
- golden-hour
- dusk

Transitions are continuous through solar altitude instead of a hard-coded light/dark switch.

## Weather mapping

WMO weather codes are mapped to a small visual vocabulary:

- clear
- partly-cloudy
- cloudy
- fog
- drizzle
- rain
- heavy-rain
- storm
- snow
- showers

Weather affects light, cloud density, precipitation, fog, and star visibility. It never replaces the day/night calculation.

## Location privacy and fallback

The preferred order is:

1. Stored rounded location
2. Previously granted browser geolocation
3. Current browser geolocation after user action
4. Local-time neutral environment

When location access is denied, MiD-Daily keeps working in neutral local-time mode. A cached weather snapshot may remain available when the network is unavailable.

## Refresh policy

- Environment time calculations update once per minute.
- Weather uses a 15-minute cache.
- Stale weather may remain visible for up to two hours when the network is unavailable.
- Visibility changes can trigger a refresh without starting a permanent polling loop.

## Accessibility and performance

Reduced motion disables environment animation. The environment never carries essential information, and all important content remains in normal document flow.

Performance guardrails:

- no default WebGL/3D engine
- no full-screen video backgrounds
- bounded DOM effect count
- no permanent blur filters
- minute-scale environment calculations
- cached weather requests
- environment paused from meaningful animation when reduced motion is requested

## Weather data attribution and license note

Weather data is provided by **Open-Meteo** and is attributed as **CC BY 4.0** in the UI. The Open-Meteo free API is currently intended for non-commercial use and is rate-limited; commercial deployment should move to an appropriate licensed endpoint or a self-hosted/paid arrangement. See Open-Meteo's current terms before changing MiD-Daily's deployment model.

## QA contract

Future environment changes must preserve:

- static frontend QA
- reduced-motion support
- no persistent backdrop-filter
- location-denied fallback
- cached-weather fallback
- timezone synchronization
- build/TypeScript checks
- responsive rendering
- no environment effect may obstruct interaction or reduce content readability
