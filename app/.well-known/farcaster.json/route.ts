import { NextResponse } from "next/dist/server/web/spec-extension/response";

const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://base-hackathon-2025.vercel.app/');

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    frame: {
      version: "1",
      name: "Piggyfi",
      iconUrl: `${ROOT_URL}/blue-icon.png`,
      homeUrl: `${ROOT_URL}`,
      imageUrl: `${ROOT_URL}/blue-hero.png`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp", "game"],
      primaryCategory: "hha",
      buttonTitle: "jabjsba",
      splashImageUrl: `${ROOT_URL}/blue-splash.png`,
      splashBackgroundColor: "#14051a",
      subtitle: "Piggyfi",
      description: "",
      webhookUrl: `${ROOT_URL}/api/webhook`,
      tagline: "Tets",
      ogTitle: "ahsb",
      ogDescription: "asjsasnjsn",
      ogImageUrl: `${ROOT_URL}/blue-hero.png`,
      heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    },
  };
  return NextResponse.json(farcasterConfig);
}
