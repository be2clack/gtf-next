# GTF Next.js - Deployment Guide

## Vercel Deployment with Federation Subdomains

### Prerequisites

1. Vercel account
2. PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
3. Domain configured for wildcard subdomains

### Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/gtf?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Telegram Bot (for auth)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# SMS Provider (optional)
SMS_API_KEY="your-sms-api-key"
SMS_SENDER="GTF"

# PayBox (payments)
PAYBOX_MERCHANT_ID="your-merchant-id"
PAYBOX_SECRET_KEY="your-secret-key"

# Stripe (payments)
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# App URL
NEXT_PUBLIC_APP_URL="https://gtf.app"
```

### Deploy to Vercel

#### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd gtf-next
vercel

# Production deploy
vercel --prod
```

#### Option 2: GitHub Integration

1. Push code to GitHub
2. Connect repo in Vercel Dashboard
3. Select `gtf-next` as root directory
4. Deploy

### Domain Configuration

#### 1. Add Domain in Vercel

- Go to Project Settings → Domains
- Add: `gtf.app` (or your domain)
- Add: `*.gtf.app` (wildcard for federations)

#### 2. DNS Configuration

Add these DNS records at your domain registrar:

```
Type    Name    Value
A       @       76.76.21.21
A       *       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Federation Subdomains

The system automatically detects federation from subdomain:

- `gtf.app` → Global GTF (no federation filter)
- `kg.gtf.app` → Kyrgyzstan Federation
- `kz.gtf.app` → Kazakhstan Federation
- `uz.gtf.app` → Uzbekistan Federation
- `ru.gtf.app` → Russia Federation
- `ae.gtf.app` → UAE Federation

### Database Setup

After first deploy, run Prisma migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### Post-Deploy Checklist

- [ ] Database connected
- [ ] Prisma schema deployed
- [ ] Environment variables set
- [ ] Domain configured
- [ ] Wildcard SSL working
- [ ] Test federation subdomain detection
- [ ] Test authentication (PIN via Telegram)
- [ ] Test admin panel access

### Troubleshooting

#### Subdomain not working
- Check wildcard DNS record
- Verify `*.gtf.app` is added in Vercel Domains
- Clear browser cache

#### Database connection error
- Check DATABASE_URL format
- Ensure IP allowlist includes Vercel IPs
- Test connection string locally

#### Build fails
- Check `prisma generate` runs before build
- Verify all dependencies installed
- Check TypeScript errors

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma
npx prisma generate

# Run dev server
npm run dev

# Test with subdomain locally
# Add to /etc/hosts:
# 127.0.0.1 kg.localhost
# Then access: http://kg.localhost:3000