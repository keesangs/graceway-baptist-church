/**
 * Bible API integration using YouVersion API
 * Fetches scripture text for a given reference (e.g., "John 3:16", "에스겔 37:15-28")
 */

import { ENV } from "./_core/env";

const YOUVERSION_API_BASE = "https://www.youversion.com/api/bible";

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Fetch scripture text from YouVersion API
 * @param reference - Scripture reference (e.g., "John 3:16", "에스겔 37:15-28")
 * @returns Promise<BibleVerse> with the scripture text
 */
export async function fetchBibleVerse(reference: string): Promise<BibleVerse> {
  try {
    if (!ENV.youversionApiKey) {
      throw new Error("YOUVERSION_API_KEY environment variable not set");
    }

    const normalizedRef = reference.trim();

    // YouVersion API endpoint for searching verses
    const searchUrl = new URL(`${YOUVERSION_API_BASE}/search`);
    searchUrl.searchParams.set("q", normalizedRef);
    searchUrl.searchParams.set("limit", "1");

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        "X-API-Key": ENV.youversionApiKey,
        "Accept": "application/json",
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json() as {
      data?: Array<{
        id: string;
        reference: string;
        text: string;
        translation?: string;
      }>;
    };

    if (!searchData.data || searchData.data.length === 0) {
      throw new Error("No verses found");
    }

    const verse = searchData.data[0];

    return {
      reference: verse.reference || normalizedRef,
      text: verse.text || "",
      translation: verse.translation || "개역개정",
    };
  } catch (error) {
    console.error("YouVersion Bible API fetch error:", error);
    throw new Error(
      `Failed to fetch scripture for "${reference}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
