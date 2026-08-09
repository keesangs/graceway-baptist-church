/**
 * Bible API integration using faith.tools Free Use Bible API
 * Fetches scripture text for a given reference (e.g., "John 3:16")
 */

const BIBLE_API_BASE = "https://bible-api.com";

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Fetch scripture text from the Bible API
 * @param reference - Scripture reference (e.g., "John 3:16", "시편 119:105-112")
 * @returns Promise<BibleVerse> with the scripture text
 */
export async function fetchBibleVerse(reference: string): Promise<BibleVerse> {
  try {
    // Normalize the reference for the API
    const normalizedRef = reference.trim();
    
    // Try fetching from the free Bible API
    const response = await fetch(
      `${BIBLE_API_BASE}/?query=${encodeURIComponent(normalizedRef)}&translation=kbv`
    );

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      reference?: string;
      verses?: Array<{ text: string }>;
      text?: string;
    };

    // Extract verse text
    let verseText = "";
    if (data.verses && Array.isArray(data.verses)) {
      verseText = data.verses.map((v) => v.text).join("\n");
    } else if (data.text) {
      verseText = data.text;
    }

    if (!verseText) {
      throw new Error(`No verses found for reference: ${reference}`);
    }

    return {
      reference: data.reference || normalizedRef,
      text: verseText,
      translation: "개역개정",
    };
  } catch (error) {
    console.error("Bible API fetch error:", error);
    throw new Error(
      `Failed to fetch scripture for "${reference}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
