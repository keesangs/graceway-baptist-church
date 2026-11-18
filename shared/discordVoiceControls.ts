// Preset snapshot from DeepInfra's exact Inworld 1.5 Mini input schema.
// https://api.deepinfra.com/models/inworld-ai/realtime-tts-1.5-mini
// Verified 2026-11-18, model version DuCYVWIF: 127 preset names.
// The server refreshes this list and merges the account's custom voices.
export const INWORLD_MODEL_METADATA_URL = "https://api.deepinfra.com/models/inworld-ai/realtime-tts-1.5-mini";
export const DEFAULT_VOICE_CONTROLS = { speaker: "Dennis", speed: 1.1, temperature: 1.1 };
export const SPEAKING_RATE_LIMITS = { min: 0.5, max: 1.5, step: 0.01 };
export const EXPRESSION_LIMITS = { min: 0, max: 2, step: 0.01 };
export const INWORLD_PRESET_VOICES = [
  "Abby", "Alain", "Alex", "Amina", "Anjali", "Arjun", "Ashley", "Asuka", "Avery",
  "Bianca", "Blake", "Brandon", "Brian", "Callum", "Carter", "Cedric", "Celeste",
  "Chloe", "Claire", "Clive", "Conrad", "Craig", "Damon", "Darlene", "Deborah",
  "Dennis", "Derek", "Diego", "Dmitry", "Dominus", "Edward", "Elena", "Elizabeth",
  "Elliot", "Erik", "Ethan", "Evan", "Evelyn", "Gareth", "Gianni", "Graham", "Grant",
  "Hades", "Hamish", "Hana", "Hank", "Heitor", "Hyunwoo", "Jake", "James", "Jason",
  "Jessica", "Jing", "Johanna", "Jonah", "Josef", "Julia", "Katrien", "Kayla", "Kelsey",
  "Lauren", "Lennart", "Levi", "Liam", "Lore", "Loretta", "Lucian", "Luna", "Lupita",
  "Malcolm", "Manoj", "Marcus", "Mark", "Marlene", "Mathieu", "Mia", "Miguel", "Minji",
  "Miranda", "Mortimer", "Nadia", "Naomi", "Nate", "Nikolai", "Nour", "Oliver", "Olivia",
  "Omar", "Oren", "Orietta", "Pippa", "Pixie", "Priya", "Rafael", "Riley", "Riya",
  "Ronald", "Rupert", "Saanvi", "Sarah", "Satoshi", "Sebastian", "Selene", "Seojun",
  "Serena", "Shaun", "Simon", "Snik", "Svetlana", "Szymon", "Tessa", "Theodore",
  "Timothy", "Trevor", "Tristan", "Tyler", "Veronica", "Victor", "Victoria", "Vinny",
  "Wendy", "Wojciech", "Xiaoyin", "Xinyi", "Yael", "Yichen", "Yoona",
] as const;
