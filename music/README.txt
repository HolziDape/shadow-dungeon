MUSIC FOLDER
============

MENU TRACKS (Hauptscreen + nach Game Over)
  menu.mp3          — Track 1
  menu2.mp3         — Track 2  (optional)
  menu3.mp3         — Track 3  (optional)
  ... bis menu9.mp3

FIGHT TRACKS (während einem normalen Run)
  fight.mp3         — Track 1
  fight2.mp3        — Track 2  (optional)
  fight3.mp3        — Track 3  (optional)
  ... bis fight9.mp3

BOSS TRACK (Boss-Kämpfe)
  boss.mp3          — Einzel-Track, loopt automatisch

PACK TRACK (Pack Opening Screen)
  pack.mp3          — Einzel-Track, loopt automatisch

Alle menu*.mp3 und fight*.mp3 werden beim Start zufällig
gemischt und automatisch nacheinander abgespielt.
Fehlende Dateien werden einfach übersprungen.

──────────────────────────────────────────────────────
Pixel-Arcade-Redesign: menu/menu2/fight/boss/pack.mp3 sind
prozedural synthetisierte Chiptune-Loops (Pulse-/Triangle-
Wellen + Noise-Drums, per Python/numpy gebaut), passend
zum neuen Pixel-Look statt der alten atmosphärischen Tracks.

  menu.mp3   100 BPM, C-Dur,  8 Takte  (I-V-vi-IV, ruhig)
  menu2.mp3   92 BPM, G-Dur,  8 Takte  (Variante, leichter)
  fight.mp3  140 BPM, a-Moll, 8 Takte  (treibender Bass, Backbeat)
  boss.mp3   152 BPM, d-Moll, 8 Takte  (16tel-Arpeggio-Bass,
             sample-genau auf Taktlänge getrimmt + 15ms
             Fade an beiden Enden, damit die native Loop
             ohne Klick durchläuft — läuft über .loop=true)
  pack.mp3   128 BPM, D-Dur,  8 Takte  (I-V-vi-IV x2, helles
             Pulse-Arpeggio + Shimmer-Chimes alle 2 Takte,
             passend zum Sunburst/Glow-Reveal-Screen)

Originale (atmosphärische) Tracks liegen unverändert unter
../../redesign/music/, falls die alte Stimmung zurück soll.
