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

# Entwicklungsserver (Port 4200) - startet automatisch neu bei Dateiänderungen
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

### Versionierung
Die App zeigt eine Versionsnummer im Header an. Diese wird manuell aktualisiert bei bedeutenden Feature-Updates:

**Aktuelle Version: v0.3.0**

Versionshistorie:
- v0.1.0: Initial MVP (File Browser, Lighttable, Video Player, Rating System)
- v0.1.1: Download-Sammlung, Drag-and-Drop Sortierung, Quick Look (Spacebar), Keyboard Sort Mode
- v0.2.0: Rollensystem (Admin/Manager/User), Drag & Drop Upload, File Deletion, UI Cleanup
- v0.2.1: Header Upload-Button entfernt, subtile Drag & Drop Info, package.json Versionierung
- v0.2.2: Build-Fix für Live-Server, Comment Interface hinzugefügt
- v0.2.3: TypeScript Build-Fixes, Missing Dependencies, SSR-Guards für localStorage
- v0.2.4: SSR-Guards für document, Build-Config erweitert, not-found.tsx hinzugefügt
- v0.3.0: Admin Settings Panel, User Management mit Path-Beschränkungen, Visual Path Explorer

**Update-Richtlinien:**
- Patch (0.x.1): Bugfixes, kleine Verbesserungen, neue Features in MVP-Phase
- Minor (0.1.x): Neue größere Features, UI-Verbesserungen  
- Major (1.0.0): Production-Ready Release, Breaking Changes

**Entwicklungs-Notizen:**
- Auto-Commits bei Änderungen mit automatischer Versionierung implementieren