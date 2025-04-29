This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

To deploy NoteifyAI on Vercel, follow these steps:

1. Fork or clone this repository to your GitHub account
2. Create an account on [Vercel](https://vercel.com) if you don't have one
3. Click "New Project" on your Vercel dashboard
4. Import your GitHub repository
5. Configure the following environment variables in the Vercel project settings:
   - `OPENAI_API_KEY`: Your OpenAI API key for transcription, notes generation, and chat
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

6. In the project settings, under "General" tab, make sure:
   - Build Command is set to `next build`
   - Install Command is set to `npm install`
   - Output Directory is set to `.next`
   - Node.js Version is set to 18.x or higher

7. Under the "Functions" tab, set the maximum execution duration to at least 30 seconds (60 seconds recommended) to ensure transcription and note generation APIs have enough time to process requests.

8. Deploy the project

The application should deploy successfully with all features working, including real-time transcription, note generation, and the chat interface.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
