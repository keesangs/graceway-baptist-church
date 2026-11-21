New

Introducing Inworld Inference, built for consumer AI.

**Nearly 8×** faster time to first token than most other providers.

[Read the launch post →](https://inworld.ai/blog/introducing-inworld-inference)

Skip to content

[](https://inworld.ai/)

Products Developers Company [Models](https://inworld.ai/models) [Pricing](https://inworld.ai/pricing) 

[Talk to us](https://inworld.ai/contact-sales) [Get Started](https://platform.inworld.ai/signup)

Cooking along

Tonight's episode

Bedtime story

Ordering in French

A voice of their own

Late bus chat

Podcast, any language

Joke time

Morning weather

Ride on its way

Sing-along

Choosing a model

Pace coach

A poem in Japanese

Walking directions

Support call

Korean flashcards

Wind-down story

Audiobook chapter

Breathing exercise

# Text to speech API  
built for people

REST, HTTP streaming and WebSocket, with first audio in as little as 50 ms.

[Get an API key](https://platform.inworld.ai/) [API reference ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech)

Bedtime story

Ordering in French

Late bus chat

Pace coach

Wind-down story

Cooking along

Tonight's episode

A voice of their own

Joke time

Morning weather

Ride on its way

Sing-along

Walking directions

Support call

Korean flashcards

Audiobook chapter

Choosing a model

## REST, streaming and WebSocket

[API reference ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech)

First audio in as little as 50 ms. Stream over WebSocket and playback starts up to 5.2× sooner.

**50 ms** to first audio, at its fastest

**5\.2×** sooner playback over the WebSocket

**0\.7¢** a minute of speech

**2,000** concurrent user sessions on Growth

01 **Time to first audio**

As little as 50 ms, and up to 5.2× sooner over the WebSocket than waiting for the whole file. 02 **REST returns one file**

POST /tts/v1/voice returns the whole clip as base64. Use it for audio you make ahead of time. 03 **HTTP streaming returns NDJSON chunks**

One JSON line per chunk. A 4.2-second line arrived in 366 ms, 11.5× faster than it plays. 04 **WebSocket takes text as your LLM writes it**

Audio starts before the reply is finished. One connection carries many contexts and stays open between turns. 05 **Timestamps and lip-sync**

Word, character and viseme timings come back with the audio, for captions and mouth movement. 06 **Direction and languages**

Direct a line in plain words, and switch language mid-sentence with a tag. 07 **Clone or design a voice**

Clone from 3 seconds of audio, or describe a voice in one sentence. Both return a voice ID that you pass as voiceId.

[REST ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech) [Streaming ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech-stream) [WebSocket ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech-websocket)

text to speech api · time to first audio

**116 ms** fastest full call to first audio, WebSocket, Flash; median 121 ms

**5\.2×** sooner to first audio than a REST file, 785 → 152 ms

**50 ms** Flash first audio at its fastest, Coval

time since the request **0 ms**

At the 90th percentile, WebSocket took 127 ms on Flash and 158 ms on Realtime TTS-2, and streaming 142 and 169 ms. Grey lanes wait for the whole file.

curl Copy

```
curl -s https://api.inworld.ai/tts/v1/voice \
  -H "Authorization: Basic $INWORLD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text" : "Your ride is two minutes away. Look for a blue hatchback." ,
    "voiceId" : "Sarah" ,
    "modelId" : "inworld-tts-2-flash" ,
    "audioConfig" : { "audioEncoding" : "MP3" , "sampleRateHertz" : 48000}
  }' | jq -r .audioContent | base64 --decode > ride.mp3
```

0:03

Realtime TTS-2 Flash, voice Sarah, MP3 at 48 kHz. Wrote ride.mp3.

The response

```
{
  "audioContent": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYx...",
  "usage": {
    "processedCharactersCount": 57,
    "modelId": "inworld-tts-2-flash"
  }
}
```

The player is the file it wrote. Text up to 2,000 characters per request; output up to 16 MB.

Python Copy

```
import base64, json, os, time, requests

start = time.perf_counter()
r = requests.post(
    "https://api.inworld.ai/tts/v1/voice:stream" ,
    headers={ "Authorization" : f "Basic {os.environ['INWORLD_API_KEY']}" },
    json={
        "text" : "Good morning. Light rain until ten, then sunshine for the rest of the day." ,
        "voiceId" : "Dennis" ,
        "modelId" : "inworld-tts-2-flash" ,
        "audioConfig" : { "audioEncoding" : "MP3" },
    },
    stream=True,
)
r.raise_for_status()
with open( "weather.mp3" , "wb" ) as f:
    for line in r.iter_lines():  # NDJSON: one JSON object per line
        if not line:
            continue
        msg = json.loads(line)
        if "error" in msg:
            raise RuntimeError(msg[ "error" ])
        if f.tell() == 0:
            print(f "first audio after {(time.perf_counter() - start) * 1000:.0f} ms" )
        f.write(base64.b64decode(msg[ "result" ][ "audioContent" ]))
```

0:04

Realtime TTS-2 Flash, voice Dennis. Printed “first audio after 219 ms”. Wrote weather.mp3.

Chunks as they arrived, same request **waiting**

Each line is {"result": {"audioContent": base64, "usage": …}}. HTTP streaming takes up to 4,000 characters per request.

**121 ms** median full call to first audio after send\_text, Flash

**152 ms** the same on Realtime TTS-2

**196 ms** to open the connection, once per session

Python Copy

```
import asyncio, base64, json, os, websockets

URL = "wss://api.inworld.ai/tts/v1/voice:streamBidirectional" 
AUTH = { "Authorization" : f "Basic {os.environ['INWORLD_API_KEY']}" }

async def main():
    async with websockets.connect(URL, additional_headers=AUTH) as ws:
        await ws.send(json.dumps({ "contextId" : "reply-1" , "create" : {
            "voiceId" : "Olivia" , "modelId" : "inworld-tts-2-flash" ,
            "audioConfig" : { "audioEncoding" : "MP3" }}}))
        # text arrives in pieces, the way an LLM streams it 
        for part in [ "Sure, I can help with that. " , "Your order shipped this morning " , "and arrives on Thursday." ]:
            await ws.send(json.dumps({ "contextId" : "reply-1" , "send_text" : { "text" : part}}))
        await ws.send(json.dumps({ "contextId" : "reply-1" , "flush_context" : {}}))
        with open( "reply.mp3" , "wb" ) as f:
            async for raw in ws:
                result = json.loads(raw)[ "result" ]
                if "audioChunk" in result:
                    f.write(base64.b64decode(result[ "audioChunk" ][ "audioContent" ]))
                elif "flushCompleted" in result:
                    break
        await ws.send(json.dumps({ "contextId" : "reply-1" , "close_context" : {}}))

asyncio.run(main())
```

0:05

Realtime TTS-2 Flash, voice Olivia: three pieces of text, one flush, one file. Wrote reply.mp3.

The client sends create, send\_text, flush\_context and close\_context messages, and each audioChunk carries base64 audio and, if you ask, timestamps. A connection closes after 10 minutes with no activity.

0\.00 Turn 0\.32 left 0\.64 on 0\.78 Market 1\.15 Street, 1\.62 then 1\.95 walk 2\.22 two 2\.45 blocks 2\.88 to 2\.99 the 3\.08 station.

0:04

Python Copy

```
import base64, os, requests

r = requests.post(
    "https://api.inworld.ai/tts/v1/voice" ,
    headers={ "Authorization" : f "Basic {os.environ['INWORLD_API_KEY']}" },
    json={
        "text" : "Turn left on Market Street, then walk two blocks to the station." ,
        "voiceId" : "Ashley" ,
        "modelId" : "inworld-tts-2" ,
        "timestampType" : "WORD" ,
        "audioConfig" : { "audioEncoding" : "MP3" },
    },
)
r.raise_for_status()
body = r.json()
open( "directions.mp3" , "wb" ).write(base64.b64decode(body[ "audioContent" ]))
words = body[ "timestampInfo" ][ "wordAlignment" ]
for word, t in zip(words[ "words" ], words[ "wordStartTimeSeconds" ]):
    if word.strip():
        print(f "{t:5.2f}s  {word.strip()}" )
```

Realtime TTS-2, voice Ashley. Printed each word with its start time. Wrote directions.mp3.

The words light on the start times this request returned. Set timestampType to WORD or CHARACTER; add lipsyncConfig for visemes. Alignment can add latency. Timestamps work in every language the model speaks.

**Direction** warm and playful, like a friend recommending a bakery

You have to try the croissant aux amandes. [laugh] Trust me.

curl Copy

```
curl -s https://api.inworld.ai/tts/v1/voice \
  -H "Authorization: Basic $INWORLD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text" : "<lang lang=\" en-US\ ">You have to try the</lang> <lang lang=\" fr-FR\ ">croissant aux amandes.</lang> <lang lang=\" en-US\ ">[laugh] Trust me.</lang>" ,
    "voiceId" : "Hana" ,
    "modelId" : "inworld-tts-2" ,
    "instruction" : "warm and playful, like a friend recommending a bakery" ,
    "audioConfig" : { "audioEncoding" : "MP3" }
  }' | jq -r .audioContent | base64 --decode > bakery.mp3
```

0:05

Realtime TTS-2, voice Hana: an instruction, a [laugh] and a French phrase in a <lang> tag. Wrote bakery.mp3.

Realtime TTS-2 performs a direction in plain words: send it as the request's instruction, or in brackets where the delivery changes partway through a line. Flash speaks sounds such as [laugh] and [sigh]. Set the whole request's language with a BCP-47 tag in language.

Clone from a clip Design from a sentence

curl Copy

```
curl -s https://api.inworld.ai/voices/v1/voices:clone \
  -H "Authorization: Basic $INWORLD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName" : "My voice" ,
    "languageCode" : "en-US" ,
    "voiceSamples" : [{ "audioData" : "'" $(base64 < sample.mp3 | tr -d '\n') "'" }]
  }' | jq -r .voice.voiceId
```

Printed:<workspace>\_\_my\_voice-ibg9k

The clip · 3.4 s

0:03

The clone · a new line

0:04

Printed the new voice ID. The second clip is that voice reading a new line through POST /tts/v1/voice.

Instant cloning takes 3 to 30 seconds of WAV, MP3 or WebM, up to 12 MB. The clip here was made with voice design, then cloned. Voice design takes a 7 to 1,024 character description; inline voiceDesign is a preview on Realtime TTS-2.

A coach that answers mid-stride

**Python and Node.js SDKs**

`pip install inworld-tts` or `npm install @inworld/tts` . Set `modelId` yourself, because SDK defaults can name older models.

**Inworld CLI**

`npm install -g @inworld/cli` , then `inworld tts synthesize` from the shell or a script.

**OpenAI-compatible endpoint**

Point the OpenAI SDK at api.inworld.ai/v1, pick an Inworld model and voice, and keep the rest of your code.

**LiveKit and Pipecat plugins**

Both voice agent frameworks ship an Inworld TTS service in their own repositories, over the WebSocket.

**Async and batch**

Long scripts and large jobs run as async and batch synthesis, alongside the realtime endpoints.

**MCP server**

Your coding agent can call text to speech through MCP while it writes the integration.

## Request fields

[Full reference ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech)

REST and streaming share one request. On the WebSocket, set the voice once, then send text.

`text` string, required

Up to 2,000 characters; 4,000 on HTTP streaming. May hold sounds such as [laugh], <lang> tags, and a [direction] where the delivery changes partway through a line.

`voiceId` string

A system voice, or the ID that cloning or design returned. Use voiceId or voiceDesign, not both.

`modelId` string, required

inworld-tts-2 or inworld-tts-2-flash.

`language` BCP-47 tag

For example ja-JP. Left out, the language is detected from the text.

`audioConfig` object

audioEncoding, one of 8: MP3 (the default), LINEAR16, WAV, PCM, OGG\_OPUS, FLAC, ALAW or MULAW (no FLAC on the WebSocket); sampleRateHertz from 8,000 for phone audio to 48,000; bitRate; speakingRate 0.5 to 1.5.

`instruction` string

One written direction for the whole request, on Realtime TTS-2.

`deliveryMode` STABLE, BALANCED, CREATIVE

How much the read may vary, on Realtime TTS-2. Balanced when unset.

`timestampType` WORD or CHARACTER

Returns timings with the audio; WORD adds phonemes.

`lipsyncConfig` object

Returns visemes for lip-sync. An empty object turns it on.

`synthesisContext` object

Up to 2,000 characters of the lines before this one, for short or ambiguous text. Not billed.

`applyTextNormalization` ON or OFF

Off reads the text exactly as written and can lower latency.

`voiceDesign` object, preview

A designPrompt of 7 to 1,024 characters instead of a voiceId, on Realtime TTS-2.

## Limits and price by plan

[Pricing ↗](https://inworld.ai/pricing)

Up to 2,000 concurrent user sessions on Growth. About 0.7¢ a minute of speech.

**30,000** custom voices on Growth, 100 free on On-Demand

**10 min** of quiet before a WebSocket closes, so one connection covers a session

Plan Plan fee Realtime TTS-2 per 1M characters Realtime TTS-2 Flash per 1M characters Concurrent requests Concurrent user sessions estimate

On-Demand Free to start $25 $15 5 20

Creator $25 a month $20 $10 10 40

Builder $100 a month $17.50 $9 50 200

Developer $300 a month $15 $8 150 600

Growth $1,500 a month $12.50 $7 500 2,000

Enterprise Custom down to $10 down to $5 Custom Custom

On-Demand includes up to 70 minutes of text to speech and 100 custom voices. Voice cloning and voice design are on every plan, and cloned and designed voices bill at the same rate. The same key calls LLM Inference, with open models from $0.07 per 1M input tokens.

## For teams building for people

[Case studies →](https://inworld.ai/customers)

[Status Status Story ↗](https://inworld.ai/customers/status "Status customer story") [Latitude Latitude Story ↗](https://inworld.ai/customers/latitude "Latitude customer story") [LiveKit LiveKit Story ↗](https://inworld.ai/customers/livekit "LiveKit customer story") [Talkpal Talkpal Story ↗](https://inworld.ai/customers/talkpal "Talkpal customer story")

Bible Chat Bible Chat

[Particle Particle Story ↗](https://inworld.ai/customers/particle "Particle customer story") [Astrobeam Astrobeam Story ↗](https://inworld.ai/customers/astrobeam "Astrobeam customer story") [Luvu Luvu Story ↗](https://inworld.ai/customers/luvu "Luvu customer story")

LingQ LingQ

Strella Strella

Stream Stream

[NLX NLX Story ↗](https://inworld.ai/customers/nlx "NLX customer story")

Pipecat Pipecat

k-ID k-ID

VoiceRun VoiceRun

Watch · 1:47

Latitude Latitude

### Every story beat, read aloud.

**97%** of the voice in Latitude's Voyage, on Inworld

**up to 5×** faster than the closest alternative

[Read the story ↗](https://inworld.ai/customers/latitude)

**Ten million** language learners on Talkpal

Talkpal Talkpal

### Talkpal's AI teachers speak in Inworld voices.

**40%** lower TTS cost

**4%** lift in retention, in a four-week A/B test

[Read the story ↗](https://inworld.ai/customers/talkpal)

Watch · 1:58

LiveKit LiveKit

### Inworld voices in LiveKit Agents, with no second API key.

**TTS + STT** in LiveKit Agents

**One flag** turns on Expressive mode

[Read the story ↗](https://inworld.ai/customers/livekit)

## Start building

Ask your agent to add Inworld.

Copy skill ⧉ Paste it into your agent

Docs [Quickstart ↗](https://docs.inworld.ai/quickstart-tts) [REST reference ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech) [Streaming ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech-stream) [WebSocket ↗](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech-websocket) [Voice cloning ↗](https://docs.inworld.ai/tts/instant-voice-cloning) [Voice design ↗](https://docs.inworld.ai/tts/voice-design) [Code examples ↗](https://github.com/inworld-ai/inworld-api-examples/tree/main/tts) [LLM Inference ↗](https://docs.inworld.ai/router/introduction) [Pricing ↗](https://inworld.ai/pricing)

Text to speech API built for people runs on Inworld. Who are you building for?

[Get an API key](https://platform.inworld.ai/) [Talk to us →](https://inworld.ai/contact-sales)

## Questions

What is a TTS API?

A text to speech API turns written text into spoken audio, and Inworld AI's TTS API serves Realtime TTS-2 and Realtime TTS-2 Flash over REST, HTTP streaming and WebSocket. You send text, a voice and a model to an endpoint and receive audio back, as MP3, WAV or streaming chunks. Realtime TTS-2 speaks about 500 languages and dialects, and the API includes instant voice cloning and voice design. What's the difference between REST, streaming, and WebSocket TTS APIs?

Inworld AI's text to speech API offers all three, and they differ in when audio arrives. REST returns complete audio after all text is processed, which suits batch jobs and short text. HTTP streaming returns audio chunks progressively, so playback starts sooner. WebSocket keeps a persistent connection open both ways, which suits voice agents where an LLM writes the text a piece at a time. On Realtime TTS-2, the WebSocket started playback 5.2× sooner than waiting for the REST file, 152 ms against 785 ms. How do I call the TTS API from Python or JavaScript?

To call Inworld AI's text to speech API, send a POST request to https://api.inworld.ai/tts/v1/voice with your text, voiceId, modelId and audioConfig, and an Authorization header of Basic and your API key. The audio comes back base64-encoded in audioContent. The streaming endpoint returns newline-delimited JSON with one base64 audio chunk per line, and the WebSocket sends chunks as they are made. It works with curl, any HTTP client, or the SDKs, installed with pip install inworld-tts or npm install @inworld/tts. How much does the TTS API cost?

Inworld AI's text to speech API costs from $7 per million characters, for Realtime TTS-2 Flash on the Growth plan, which is about 0.7 cents a minute of speech, and $15 on demand. Realtime TTS-2 costs from $12.50 on Growth and $25 on demand. On Enterprise, Realtime TTS-2 goes down to $10 and Realtime TTS-2 Flash down to $5. A minute of speech is about 1,000 characters. What are the TTS API rate limits?

The Growth plan allows 500 concurrent requests on Inworld AI's text to speech API, an estimated 2,000 concurrent user sessions, and Enterprise limits are custom. The other plans allow 5 on demand, 10 on Creator, 50 on Builder and 150 on Developer. Limits apply per account and are shared by every API key. A request takes up to 2,000 characters of text, or 4,000 on HTTP streaming. How fast is the TTS API?

Inworld AI's text to speech API returns first audio in as little as 50 ms on Realtime TTS-2 Flash and as little as 90 ms on Realtime TTS-2 at P90. Streaming lets playback start before the whole file is ready: over the WebSocket, Realtime TTS-2 started playback up to 5.2× sooner than a REST file. To keep latency low in your app, stream over the WebSocket and keep one connection open for the whole conversation, so later turns skip the connection setup. Can I clone voices via a TTS API?

Yes, Inworld AI's text to speech API clones a voice from 3 to 30 seconds of audio sent to POST /voices/v1/voices:clone, and the voice ID it returns works in any TTS request. Clips can be WAV, MP3 or WebM, up to 12 MB. Professional voice cloning, in beta, trains on at least 10 minutes of audio and has its own API. Cloning itself is free, and you pay only for the speech you generate. Can I switch to Inworld from OpenAI or ElevenLabs text to speech?

Yes, Inworld AI's text to speech API serves an OpenAI-compatible speech endpoint, so the OpenAI SDKs work once you change the base URL to api.inworld.ai/v1 and choose an Inworld model and voice. For ElevenLabs, a free migration tool, published on GitHub, moves your cloned voices across in a batch. On Enterprise, Realtime TTS-2 Flash costs up to 16× less than the $80 per million characters Eleven v4 lists.

Text to speech API built for people runs on Inworld.