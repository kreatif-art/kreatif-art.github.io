# Kreatif

> A full-stack platform where artists and musicians upload original work, and fans discover, like, and subscribe to creators they love.

## Screenshots

<!-- Add screenshots or GIFs here once deployed -->

![Kreatif Home](screenshots/home.png)
![Browse Music](screenshots/browse-music.png)
![Upload Flow](screenshots/upload.png)

## Features

- **Auth** — Email/password signup, login, logout, password reset, email verification. Unverified users can browse but not upload.
- **Profiles** — Display name, avatar, bio, and an Artist Mode toggle that unlocks uploading.
- **Uploads** — Music (MP3, max 15MB) and art (JPG/PNG/WebP, max 10MB) with server-side file validation, cover images for music, upload progress, and a mandatory originality attestation stored with user ID and timestamp.
- **Browse** — Separate Music and Art grids, filterable by genre, sorted by newest, with pagination.
- **Content Detail** — Audio player with a persistent mini-player that keeps playing while browsing, full-size image lightbox for art, like button, and report button.
- **Likes** — One like per user per item, toggleable, live count updates.
- **Subscriptions** — Subscribe/unsubscribe from artist profiles, subscriber count visible.
- **Top 10 Leaderboard** — Two tabs (Top 10 Music Artists, Top 10 Art Artists), ranked by total likes across their content.
- **Artist Profiles** — Bio, music/art tabs, subscribe button, total likes received.
- **Search** — Search by title and description across all content, with pagination.
- **Moderation** — Report button on content; a protected admin page (restricted to the admin email) to view, hide, delete, resolve, or dismiss reports.
- **Legal** — Terms of Service / Content Policy (including DMCA takedown process) and Privacy Policy pages.
- **States** — Every list, feed, and profile has empty, loading, and error states — no blank screens.
- **Responsive** — Fully responsive from mobile to desktop.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Lucide Icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Database:** PostgreSQL with Row Level Security (RLS) on every table

## Setup & Run

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kreatif.git
   cd kreatif
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.

4. Run the database migration:
   - Go to your Supabase project's SQL Editor
   - Copy and run the contents of `supabase/migrations/20260820023721_create_kreatif_schema.sql`

5. Deploy the edge function (optional, for server-side upload validation):
   - Deploy `validate-upload` via the Supabase dashboard or CLI

6. Start the dev server:
   ```bash
   npm run dev
   ```

7. Build for production:
   ```bash
   npm run build
   ```

### Admin Access

Sign up with the email `admin@kreatif.app` to get access to the moderation panel at `/admin`. To change the admin email, update the `get_is_admin()` function in the database.

## Project Structure

```
kreatif/
├── src/
│   ├── components/       # Shared UI components (Navbar, MiniPlayer, ContentCard, etc.)
│   ├── context/          # React contexts (Auth, Player)
│   ├── hooks/            # Custom hooks (useContent)
│   ├── lib/              # Utilities and Supabase client
│   ├── pages/            # Route pages (Home, Browse, Upload, Profile, etc.)
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Router and providers
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind directives
├── supabase/
│   ├── functions/        # Edge functions
│   │   └── validate-upload/
│   └── migrations/       # SQL migrations
├── .env.example
├── LICENSE
└── README.md
```

## Roadmap (Planned Features)

These items are intentionally out of scope for MVP1 and planned for future releases:

- Full admin dashboard with analytics
- Comments on content
- In-app notifications
- Duplicate detection / content fingerprinting
- Genre-filtered sub-leaderboards
- OAuth login (Google, GitHub, etc.)
- Personalized "For You" feed
- Playlists and collections
- Tipping / monetization
- Mobile app

## License

MIT — see [LICENSE](LICENSE).
