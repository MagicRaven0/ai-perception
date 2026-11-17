# Transcripts

One WebVTT file per episode, named after the episode (e.g. `episode-1.vtt`). Link it in `content/episodes.ts` with `transcript: "episode-1.vtt"`.

Mark speakers with voice tags so the site can show who is talking:

```
WEBVTT

00:00:00.000 --> 00:00:04.200
<v Host>Welcome to the first episode.

00:00:04.200 --> 00:00:09.000
<v Professor Aqeel>Thanks for having me.
```

Free local transcription: run Whisper on the MP3 with `--output_format vtt`, then fix names by hand.
