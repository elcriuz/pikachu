# Pikachu - Film Production Media Review Platform

Eine einfache, dateibasierte Web-App für Filmproduktionsfirmen zum Verwalten und Bewerten von Location-Fotos und Casting-Videos.

## Features

- 📁 Dateibasierte Struktur (keine Datenbank erforderlich)
- 📸 Drag & Drop Upload von Fotos und Videos
- 💬 Kommentare und Bewertungen pro Ordner
- 🔐 Einfache Authentifizierung
- 🎨 Moderne, responsive Oberfläche

## Ordnerstruktur

```
data/
└── [client]/
    └── [projekt]/
        ├── locations/
        │   └── [location-name]/
        │       ├── foto1.jpg
        │       ├── video1.mp4
        │       └── .metadata.json
        ├── cast/
        └── props/
```

## Installation

```bash
# Repository klonen
git clone <repo-url>
cd pikachu

# Dependencies installieren
pnpm install

# Konfiguration
cp .env.example .env

# Benutzer anlegen (config/users.json bearbeiten)
mkdir -p config
echo '{"users":[{"email":"admin@example.com","name":"Admin","role":"admin"}]}' > config/users.json

# Data-Verzeichnis erstellen
mkdir -p data

# Entwicklungsserver starten (Port 4200)
pnpm dev
```

## Verwendung

1. Öffnen Sie http://localhost:4200
2. Melden Sie sich mit einer E-Mail aus `config/users.json` an
3. Navigieren Sie durch die Ordnerstruktur
4. Laden Sie Medien per Drag & Drop hoch
5. Fügen Sie Kommentare und Bewertungen hinzu

## Deployment

```bash
# Production Build
pnpm build
pnpm start
```

Für Deployment auf einer VM:
- Node.js 18+ installieren
- App kopieren und `pnpm install --production` ausführen
- Mit PM2 oder systemd als Service einrichten
- Nginx als Reverse Proxy konfigurieren

## Dateistruktur

- `/data` - Alle Mediendateien und Metadaten
- `/config/users.json` - Benutzerverwaltung
- `/.metadata.json` - Kommentare und Bewertungen pro Ordner