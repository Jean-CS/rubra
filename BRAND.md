# Comunidades Brand Kit

## Core Idea

Comunidades is the central map for Londrina's tech ecosystem. It helps developers, founders, designers, AI builders, students, hackers, and curious locals discover the communities, educational institutions, events, initiatives, and people already shaping the city's technology scene.

The product should feel like a premium civic-tech layer over the local ecosystem: polished enough to signal quality, warm enough to feel community-owned, and lively enough to make people want to participate.

## Positioning

**One-liner:** The front door to Londrina's tech scene.

**Audience:** People in and around Londrina who want to find tech communities, discover educational institutions, attend events, meet peers, organize meetups, or understand what is happening locally.

**Promise:** No more scattered links, private circles, or "I wish I knew this existed earlier." Comunidades makes the local tech scene visible.

**Category:** Local tech ecosystem hub.

**Tone:** Premium, civic, energetic, welcoming, lightly playful.

## Brand Personality

- **Curated, not corporate:** The site should feel intentionally designed, but never like enterprise software.
- **Local, not provincial:** Londrina is the center of the story, with a visual language that feels globally current.
- **Fun, not childish:** Use color, motion, and rhythm, but keep the typography and layout precise.
- **Community-first, not platform-first:** The local ecosystem is the hero. Communities carry the emotional center, and institutions, events, and initiatives help people understand the full map.

## Visual Direction

**Aesthetic lane:** Premium urban tech board.

Imagine a refined city map, a conference badge wall, and a high-end startup launch page sharing one visual system. The page should feel structured and editorial, with playful network details, event-card energy, and crisp digital polish.

**What someone should remember:** A glowing, map-like network of Londrina's tech scene that feels alive, organized, and worth joining.

## Naming And Copy

**Product name:** Comunidades

**Working headline options:**

- Onde a tecnologia de Londrina se encontra.
- A porta de entrada para a cena tech de Londrina.
- Descubra as comunidades, instituições e eventos que movem a tecnologia em Londrina.

**Recommended hero headline:** A porta de entrada para a cena tech de Londrina.

**Hero subheadline:** Encontre comunidades, Instituições de Ensino, eventos e pessoas de tecnologia em um só lugar, de GDG Londrina ao Londrina Hacker Club, UEL, UTFPR, SENAI e novas iniciativas surgindo pela cidade.

**Primary CTA:** Explorar o mapa

**Secondary CTA:** Indicar iniciativa

**Short value props:**

- Descubra comunidades ativas sem depender de grupos fechados ou links perdidos.
- Veja quais Instituições de Ensino formam, conectam e aproximam novas pessoas da tecnologia.
- Veja eventos, encontros e iniciativas em uma agenda compartilhada.
- Encontre espaços para aprender, palestrar, organizar e conhecer gente local.
- Ajude novas comunidades e instituições relevantes a ganhar visibilidade depois de aprovação editorial.

## Color System

The palette should avoid generic purple startup gradients. Use a crisp light foundation, near-black text, and high-energy accents inspired by city lights and event signage.

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#08110F` | Primary text, deep panels |
| `--paper` | `#F7F5EF` | Main page background |
| `--mist` | `#E8ECE5` | Soft dividers, quiet surfaces |
| `--lime` | `#B7FF4A` | Primary accent, CTA glow |
| `--cyan` | `#22D3C5` | Links, map lines, active states |
| `--coral` | `#FF6247` | Event highlights, warm emphasis |
| `--violet` | `#7357FF` | Secondary accent, used sparingly |
| `--steel` | `#69746F` | Secondary text |

**Usage ratio:** 60% paper, 20% ink, 10% mist, 10% accents.

## Typography

Use expressive type without making the site look like a generic startup template.

**Display:** Bricolage Grotesque

- For hero, section headings, large numbers, and community names.
- Feels human, technical, and a little unconventional.

**Body:** IBM Plex Sans

- For paragraphs, navigation, labels, and cards.
- Clear, credible, and technical without being cold.

**Mono accent:** IBM Plex Mono

- For coordinates, dates, small metadata, event tags, and UI labels.

## Layout Principles

- Lead with the product name and Londrina context immediately.
- Use a dense but breathable editorial grid instead of generic stacked marketing sections.
- Make communities and institutions feel like real entities: cards should have names, tags, cadence or role, location when useful, and a clear status.
- Include one memorable visual system: a network map, orbit, directory board, or city signal layer.
- Keep cards sharp and premium: 8px radius or less, hairline borders, precise shadows, no chunky rounded SaaS blobs.
- Avoid nested cards. Sections should be full-width bands or clean constrained layouts.

## Motion Direction

Use CSS-only motion first.

- Hero network lines slowly pulse.
- Community cards lift by 2-4px on hover.
- Accent dots drift subtly, but never distract from content.
- Page entrance uses staggered opacity and vertical movement.
- Respect `prefers-reduced-motion`.

## Imagery And Assets

Initial version can be strong without photography.

Preferred assets:

- Abstract local network map inspired by Londrina's tech groups.
- Event badge/card motifs.
- Small community logos when available.
- Simple map coordinates or neighborhood references.
- Photos from real meetups later, once quality is high enough.

Avoid:

- Generic laptop photos.
- Dark blurred city backgrounds.
- Stock people in offices.
- Overly glossy 3D objects unless they are custom and meaningful.

## Directory Data Model

The first version should be easy to maintain manually.

Suggested fields for communities:

- Name
- Description
- Category
- Tags
- Website or social link
- Meeting cadence
- Status: active, new, occasional, unknown
- Next event, if known

Starter communities:

- GDG Londrina
- Londrina Tech
- Londrina AI community
- Londrina Hacker Club

Suggested fields for Instituições de Ensino:

- Name
- Description
- Type: university, technical education, college, training center
- Tags
- Website or social link
- Role in the ecosystem
- Nature: federal, state, private, Sistema S, community suggested

Starter Instituições de Ensino:

- SENAI
- UTFPR
- IFPR
- UEL
- Positivo
- UNOPAR Anhanguera
- UniCesumar
- UniFil

## Landing Page Structure

1. **Hero:** Name, Londrina-specific headline, primary CTA, secondary CTA, animated ecosystem index visual.
2. **Community Directory:** Featured cards for known communities.
3. **Instituições de Ensino:** Initial map of educational institutions connected to the tech ecosystem.
4. **Why It Exists:** Explain the discovery problem and the value of a central hub.
5. **Events / Signals:** Placeholder for upcoming meetups and calls for speakers.
6. **Submit / Approval Flow:** Two clear paths: submit a community or submit an Instituição de Ensino. Both are reviewed before publishing.

## Voice Guidelines

Write like a thoughtful local organizer with strong taste.

Use:

- Clear Portuguese.
- Short confident sentences.
- Local specificity.
- Active verbs.

Avoid:

- Generic startup claims like "unlock your potential."
- Over-explaining what a community is.
- Heavy platform language.
- English buzzwords unless the community already uses them.

## First Build Direction

Build the first page as a static Astro landing page with no React.

Use:

- `src/pages/index.astro` for the page.
- Global CSS in the layout or a dedicated stylesheet.
- CSS variables from this brand kit.
- Hardcoded starter community data in the page for speed.
- CSS animations only.

Do not add a component library. The visual identity should come from custom CSS, typography, layout, and carefully chosen content.
