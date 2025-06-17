# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Pikachu - Film Production Review Platform

### Overview
Pikachu ist eine dateibasierte Web-Anwendung für Filmproduktionsfirmen zum Verwalten und Bewerten von Location-Fotos und Casting-Videos. Das System nutzt eine einfache Ordnerstruktur statt einer Datenbank.

### Ordnerstruktur
```
data/
└── [client-name]/
    └── [project-name]/
        ├── locations/
        │   └── [location-name]/
        │       ├── *.jpg, *.png, *.mp4, etc.
        │       └── .metadata.json
        ├── cast/
        │   └── [person-name]/
        │       ├── *.jpg, *.mp4, etc.
        │       └── .metadata.json
        └── props/
            └── [prop-name]/
                ├── *.jpg, etc.
                └── .metadata.json
```

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (dateibasiert)
- **Storage**: Lokales Dateisystem
- **Auth**: Einfache Konfigurationsdatei mit Benutzern
- **Metadata**: JSON-Dateien pro Ordner für Kommentare/Bewertungen

### Development
```bash
# Installation
pnpm install

# Entwicklungsserver (Port 4200)
pnpm dev

# Build für Production
pnpm build
pnpm start
```

### Wichtige Konzepte
- Keine Datenbank - alles ist dateibasiert
- Ordnerstruktur = Navigationsstruktur
- `.metadata.json` Dateien speichern Kommentare und Bewertungen
- Einfache Benutzerverwaltung über `config/users.json`
- Alle Medien werden lokal im `data/` Ordner gespeichert