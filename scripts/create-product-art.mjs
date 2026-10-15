import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
mkdirSync("public/products", { recursive: true });
const artworks = {
  tote: `<path d="M102 113h116l17 145c-38 14-111 14-150 0Z" fill="#bc9b6c"/><path d="M119 119V88c0-48 82-48 82 0v31" fill="none" stroke="#9c7b4e" stroke-width="10"/><path d="m102 113-17 145 21-10 12-135Z" fill="#aa895d"/><path d="M113 139h94l11 103c-33 9-70 9-104 0Z" fill="#c8a97e"/><path d="M136 183h49v42h-49z" fill="#b89666"/><path d="M142 182v-7h37v7" fill="none" stroke="#aa8758" stroke-width="2"/><path d="M121 125v112m76-112v112" stroke="#d4b98f" stroke-width="2" stroke-dasharray="3 3"/>`,
  tee: `<path d="m110 80-63 54 35 43 31-21-7 115h109l-7-115 30 21 35-43-63-54-30-9h-40Z" fill="#eff0e9"/><path d="m110 80 30-9c0 25 40 25 40 0l30 9c-6 50-94 50-100 0Z" fill="#d9ddd3"/><path d="M115 109c-7 31-10 45-8 48m99-48c7 31 10 45 8 48M110 260h100" fill="none" stroke="#d6dbcf" stroke-width="2"/><path d="m77 151 12 16m143-16-12 16" stroke="#cdd5c4" stroke-width="2"/><path d="M153 144h15v5h-15Z" fill="#d8c5a5"/>`,
  headphones: `<path d="M77 180v-41c0-112 166-112 166 0v41" fill="none" stroke="#3b3c3e" stroke-width="22"/><path d="M79 138c0-102 162-102 162 0" fill="none" stroke="#64615c" stroke-width="9"/><path d="M78 149v51m164-51v51" stroke="#aaa292" stroke-width="13"/><rect x="54" y="155" width="54" height="96" rx="24" fill="#4d4e50" transform="rotate(-9 81 203)"/><rect x="65" y="164" width="34" height="78" rx="17" fill="#26282b" transform="rotate(-9 81 203)"/><rect x="212" y="155" width="54" height="96" rx="24" fill="#4d4e50" transform="rotate(9 239 203)"/><rect x="220" y="164" width="34" height="78" rx="17" fill="#26282b" transform="rotate(9 239 203)"/><path d="M87 107c18-47 39-59 73-59s63 20 74 60" fill="none" stroke="#7b766d" stroke-width="6"/>`,
  ceramic: `<ellipse cx="158" cy="260" rx="96" ry="17" fill="#b9a58a"/><ellipse cx="158" cy="255" rx="89" ry="14" fill="#e1cdb1"/><path d="M87 152h137l-13 82c-3 29-105 29-110 0Z" fill="#c0ab8e"/><path d="M218 170c75-21 58 68-9 54" fill="none" stroke="#b5a082" stroke-width="15"/><ellipse cx="156" cy="151" rx="69" ry="19" fill="#e2cdb1"/><ellipse cx="156" cy="153" rx="57" ry="12" fill="#645041"/><path d="m106 128 12-56h77l15 56c-15 22-89 22-104 0Z" fill="#d2b797"/><ellipse cx="157" cy="72" rx="38" ry="10" fill="#e5d0b4"/><ellipse cx="157" cy="73" rx="29" ry="6" fill="#7d6651"/><path d="m130 86-4 36m20-34-1 39m20-39 3 38m16-40 7 35" stroke="#b69b7a" stroke-width="2"/>`,
  sneaker: `<path d="M55 188c6-25 15-69 36-67 16 32 33 32 56 28l31-17c29 29 54 35 88 42 12 3 24 19 20 34-3 15-42 29-72 28l-137-9c-28-3-32-17-22-39Z" fill="#eeede4"/><path d="M55 203c71 21 161 31 229-2l3 22c-75 32-157 13-230 2Z" fill="#c4b89e"/><path d="m88 129 15 47 56 12 31-38-13-13-30 16c-22 7-43 4-59-24Z" fill="#dfdccd"/><path d="m120 158 35 8m-28 4 36 7m-29 4 34 8" stroke="#b1ab97" stroke-width="5" stroke-linecap="round"/><path d="m198 158-12 48m15-43 49 25" fill="none" stroke="#d4d0c1" stroke-width="3"/><path d="M64 215c70 19 149 29 214 2" fill="none" stroke="#a99d84" stroke-width="2"/>`,
  serum: `<rect x="112" y="116" width="96" height="160" rx="16" fill="#b1844a"/><rect x="117" y="120" width="86" height="147" rx="13" fill="#bc945d"/><path d="M132 114V96h56v18" fill="#977342"/><rect x="127" y="77" width="66" height="32" rx="4" fill="#e4d6b8"/><path d="M144 77V49c0-23 32-23 32 0v28" fill="#d8c6a4"/><rect x="124" y="160" width="72" height="78" rx="1" fill="#eee5d1"/><text x="160" y="183" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#8c7a5b" letter-spacing="3">AR DAILY</text><text x="160" y="201" text-anchor="middle" font-family="serif" font-size="13" fill="#756242">Hydration</text><text x="160" y="215" text-anchor="middle" font-family="sans-serif" font-size="7" fill="#9f8c6a" letter-spacing="2">SERUM</text><text x="160" y="229" text-anchor="middle" font-family="sans-serif" font-size="6" fill="#ab9874">30 mL / 1.0 fl oz</text><path d="M123 135v99" stroke="#d3b07e" stroke-width="4" stroke-linecap="round"/>`,
  bag: `<path d="M100 143c-35-126 149-135 122 17" fill="none" stroke="#6a513b" stroke-width="8"/><path d="M83 156c46-15 107-15 154 0l7 108c-43 18-112 18-163 0Z" fill="#99734d"/><path d="M83 156c45-10 111-12 154 0l-9 61c-29 17-105 18-137 0Z" fill="#af885d"/><path d="M160 211v27" stroke="#d2b58a" stroke-width="9"/><rect x="147" y="211" width="26" height="20" rx="3" fill="none" stroke="#dbbe87" stroke-width="4"/><path d="M88 166c42-13 102-14 144-1M90 257c47 14 99 14 144 0" stroke="#c09a6a" stroke-width="2" stroke-dasharray="3 3"/>`,
  shirt: `<path d="m111 76-38 22-37 133 37 12 37-91-10 126h121l-10-126 37 91 37-12-37-133-38-22-29-8h-41Z" fill="#b9b3a0"/><path d="m111 76 29-8 20 30-29 25-20-47Zm99 0-29-8-21 30 29 25 21-47Z" fill="#cbc4af"/><path d="M160 99v179" stroke="#a09a87" stroke-width="3"/><path d="M174 139h30v38h-30Z" fill="#aea895"/><path d="M174 140h30v8h-30" fill="#c5bda7"/><path d="M109 265h102M42 220l34 12m169-12 32-11" fill="none" stroke="#9f9987" stroke-width="2"/><g fill="#e1d8c0"><circle cx="160" cy="139" r="2"/><circle cx="160" cy="175" r="2"/><circle cx="160" cy="212" r="2"/><circle cx="160" cy="248" r="2"/></g>`,
};
const backgrounds = {
  tote: "#eee8dd",
  tee: "#e5e9e0",
  headphones: "#eee5dc",
  ceramic: "#f0e6d8",
  sneaker: "#e6e9e9",
  serum: "#eee9df",
  bag: "#e9dfd2",
  shirt: "#e7e8df",
};
for (const [name, art] of Object.entries(artworks))
  writeFileSync(
    `public/products/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><filter id="shadow"><feGaussianBlur stdDeviation="9"/></filter><radialGradient id="light"><stop stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="320" height="320" fill="${backgrounds[name]}"/><circle cx="125" cy="90" r="190" fill="url(#light)"/><ellipse cx="163" cy="279" rx="82" ry="7" fill="#483523" opacity=".13" filter="url(#shadow)"/>${art}</svg>`,
  );
const data = JSON.parse(readFileSync("data/retail.json", "utf8"));
data.products.forEach((p) => (p.image = p.image.replace(".jpg", ".svg")));
writeFileSync("data/retail.json", JSON.stringify(data, null, 2));
const seed = readFileSync("scripts/seed-retail.mjs", "utf8").replaceAll(
  ".jpg",
  ".svg",
);
writeFileSync("scripts/seed-retail.mjs", seed);
console.log("Created eight local product illustrations.");
