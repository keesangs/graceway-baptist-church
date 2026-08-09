/**
 * Bible API integration using YouVersion API
 * Fetches scripture text for a given reference (e.g., "John 3:16", "에스겔 37:1-14")
 */

import { ENV } from "./_core/env";

// YouVersion API uses a different endpoint structure
// Format: /api/bibles/{bible_id}/verses/{verse_id}
// We'll use the public YouVersion endpoint that doesn't require authentication for basic queries

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Fetch scripture text from YouVersion API
 * @param reference - Scripture reference (e.g., "John 3:16", "에스겔 37:1-14")
 * @returns Promise<BibleVerse> with the scripture text
 */
export async function fetchBibleVerse(reference: string): Promise<BibleVerse> {
  try {
    const normalizedRef = reference.trim();

    // YouVersion API endpoint for verse search
    // Using the public API that works with verse references
    const apiUrl = `https://www.youversion.com/api/bibles/1/verses/search`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.youversionApiKey}`,
      },
      body: JSON.stringify({
        query: normalizedRef,
        limit: 1,
      }),
    });

    if (!response.ok) {
      // Try alternative endpoint
      return await fetchFromAlternativeAPI(normalizedRef);
    }

    const data = await response.json() as {
      data?: Array<{
        id: string;
        reference: string;
        text: string;
      }>;
    };

    if (!data.data || data.data.length === 0) {
      return await fetchFromAlternativeAPI(normalizedRef);
    }

    const verse = data.data[0];

    return {
      reference: verse.reference || normalizedRef,
      text: verse.text || "",
      translation: "개역개정",
    };
  } catch (error) {
    console.error("YouVersion Bible API fetch error:", error);
    throw new Error(
      `Failed to fetch scripture for "${reference}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Alternative API endpoint for scripture fetching
 * Uses Bible API (bible-api.com) as fallback
 */
async function fetchFromAlternativeAPI(reference: string): Promise<BibleVerse> {
  try {
    // Parse the reference to extract book, chapter, verse
    // Format: "에스겔 37:1-14" or "Ezekiel 37:1-14"
    const match = reference.match(/^([가-힣a-zA-Z\s]+)\s+(\d+):(\d+)(?:-(\d+))?/);
    
    if (!match) {
      throw new Error(`Invalid scripture reference format: ${reference}`);
    }

    const [, book, chapter, startVerse, endVerse] = match;
    
    // Map Korean book names to English
    const koreanToEnglish: Record<string, string> = {
      "창세기": "Genesis",
      "출애굽기": "Exodus",
      "레위기": "Leviticus",
      "민수기": "Numbers",
      "신명기": "Deuteronomy",
      "여호수아": "Joshua",
      "사사기": "Judges",
      "룻기": "Ruth",
      "사무엘상": "1 Samuel",
      "사무엘하": "2 Samuel",
      "열왕기상": "1 Kings",
      "열왕기하": "2 Kings",
      "역대상": "1 Chronicles",
      "역대하": "2 Chronicles",
      "에스라": "Ezra",
      "느헤미야": "Nehemiah",
      "에스더": "Esther",
      "욥기": "Job",
      "시편": "Psalm",
      "잠언": "Proverbs",
      "전도서": "Ecclesiastes",
      "이사야": "Isaiah",
      "예레미야": "Jeremiah",
      "예레미야애가": "Lamentations",
      "에스겔": "Ezekiel",
      "다니엘": "Daniel",
      "호세아": "Hosea",
      "요엘": "Joel",
      "아모스": "Amos",
      "오바댜": "Obadiah",
      "요나": "Jonah",
      "미가": "Micah",
      "나훔": "Nahum",
      "하박국": "Habakkuk",
      "스바냐": "Zephaniah",
      "학개": "Haggai",
      "스가랴": "Zechariah",
      "말라기": "Malachi",
      "마태복음": "Matthew",
      "마가복음": "Mark",
      "누가복음": "Luke",
      "요한복음": "John",
      "사도행전": "Acts",
      "로마서": "Romans",
      "고린도전서": "1 Corinthians",
      "고린도후서": "2 Corinthians",
      "갈라디아서": "Galatians",
      "에베소서": "Ephesians",
      "빌립보서": "Philippians",
      "골로새서": "Colossians",
      "데살로니가전서": "1 Thessalonians",
      "데살로니가후서": "2 Thessalonians",
      "디모데전서": "1 Timothy",
      "디모데후서": "2 Timothy",
      "디도서": "Titus",
      "빌레몬서": "Philemon",
      "히브리서": "Hebrews",
      "야고보서": "James",
      "베드로전서": "1 Peter",
      "베드로후서": "2 Peter",
      "요한일서": "1 John",
      "요한이서": "2 John",
      "요한삼서": "3 John",
      "유다서": "Jude",
      "요한계시록": "Revelation",
    };

    const englishBook = koreanToEnglish[book.trim()] || book.trim();
    const verseRange = endVerse ? `${startVerse}-${endVerse}` : startVerse;
    const query = `${englishBook} ${chapter}:${verseRange}`;

    // Use Bible API (bible-api.com)
    const bibleApiUrl = new URL("https://bible-api.com/");
    bibleApiUrl.searchParams.set("query", query);
    bibleApiUrl.searchParams.set("translation", "kbv"); // Korean Bible Version

    const response = await fetch(bibleApiUrl.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as {
      reference?: string;
      text?: string;
      translation?: string;
    };

    if (!data.text) {
      throw new Error("No verse text found");
    }

    return {
      reference: data.reference || reference,
      text: data.text,
      translation: data.translation || "개역개정",
    };
  } catch (error) {
    console.error("Alternative Bible API fetch error:", error);
    throw new Error(
      `Failed to fetch scripture: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
