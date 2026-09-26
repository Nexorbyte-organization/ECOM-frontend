This is the Next.js frontend for OO-Ushers. All application data, authentication, notifications, and Paymob test payments come from the Express backend; the old browser-only mock database has been removed.

## Getting Started

Start `usher-backend` first (it defaults to port `4000`), then configure and start `usher-frontend`:

```bash
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The frontend proxies `/api/*` to `API_URL`, which defaults to `http://localhost:4000`.

For deployment, set `API_URL` to the final backend origin and keep `NEXT_PUBLIC_API_URL=/api`. The final frontend and backend domains can be added later without changing application code.

New accounts must verify the email sent by the backend before signing in. Browser sessions use short-lived access and rotating refresh cookies; authentication tokens are never stored in browser local storage. Password recovery is available from the sign-in page.

Event photos, company logos, profile photos, and usher portfolio images are uploaded through the API to the configured image service. Referral share links are signed by the backend and can be previewed before registration and redeemed after sign-in.

Paymob is locked to test mode in the backend. Completed events expose one **Pay all ushers** action: digital recipients receive 95% automatically when Payouts sandbox credentials are configured, and recipients without a supported account are highlighted for a 95% cash payment. The 5% transfer fee is always recorded by OO-Ushers.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
