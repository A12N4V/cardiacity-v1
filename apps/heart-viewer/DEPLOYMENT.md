# Cardiacity - Deployment Guide

## 🌐 Deployment Options

This standalone app can be deployed to various platforms. Choose the one that fits your needs.

---

## 1. Vercel (Recommended) ⚡

**Best for**: Quick deployment, automatic SSL, global CDN

### Steps:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? cardiacity
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

**Live in**: ~2 minutes
**URL**: `https://cardiacity.vercel.app` (or custom domain)

### Custom Domain (Vercel)
```bash
vercel domains add yourdomain.com
vercel alias set cardiacity.vercel.app yourdomain.com
```

---

## 2. Netlify 🦸

**Best for**: Easy deployment, form handling, serverless functions

### Steps:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

Or use Netlify Dashboard:
1. Connect Git repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Deploy

**Live in**: ~3 minutes

---

## 3. Docker 🐳

**Best for**: Self-hosting, containerized deployments

### Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3001
CMD ["node", "server.js"]
```

### Build & Run:
```bash
# Build image
docker build -t cardiacity .

# Run container
docker run -p 3001:3001 cardiacity

# Access at http://localhost:3001
```

### Docker Compose:
```yaml
version: '3.8'
services:
  cardiacity:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## 4. AWS (Amplify) ☁️

**Best for**: AWS ecosystem, scalability

### Steps:

1. **Install AWS Amplify CLI**:
```bash
npm i -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify**:
```bash
amplify init
# Choose defaults for Next.js
```

3. **Add hosting**:
```bash
amplify add hosting
# Choose: Hosting with Amplify Console
```

4. **Deploy**:
```bash
amplify publish
```

**Live in**: ~5 minutes

---

## 5. DigitalOcean App Platform 🌊

**Best for**: Simple cloud deployment, managed infrastructure

### Steps:

1. Create app on DigitalOcean
2. Connect GitHub/GitLab repo
3. Configure:
   - **Build command**: `npm run build`
   - **Run command**: `npm start`
   - **Port**: 3001
4. Deploy

**Live in**: ~4 minutes

---

## 6. Railway 🚂

**Best for**: Quick deployment from Git

### Steps:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

Or use Railway Dashboard:
1. New Project → Deploy from GitHub
2. Auto-detects Next.js
3. Deploys automatically

**Live in**: ~2 minutes

---

## 7. Self-Hosted (PM2) 🖥️

**Best for**: VPS/dedicated servers

### Steps:

```bash
# Install PM2
npm i -g pm2

# Build app
npm run build

# Start with PM2
pm2 start npm --name "cardiacity" -- start

# Save PM2 config
pm2 save

# Auto-restart on server reboot
pm2 startup
```

### Nginx Reverse Proxy:
```nginx
server {
    listen 80;
    server_name cardiacity.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Cloudflare Pages ☁️

**Best for**: Free hosting, global CDN

### Steps:

1. **Install Wrangler CLI**:
```bash
npm i -g wrangler
wrangler login
```

2. **Build**:
```bash
npm run build
```

3. **Deploy**:
```bash
npx wrangler pages deploy .next
```

**Live in**: ~3 minutes

---

## 🔐 Environment Variables

If using environment variables (optional):

```bash
# .env.local (for local dev)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Vercel**: Settings → Environment Variables
**Netlify**: Site settings → Build & deploy → Environment
**Docker**: Pass via `-e` flag or docker-compose

---

## 🚀 Performance Optimizations

### 1. Enable Compression (Nginx)
```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

### 2. CDN for Models (Optional)
Upload `/public/cardiacity-models/` to CDN (Cloudflare, AWS S3):
```typescript
// In Heart3D.tsx, change path:
const path = `https://cdn.yourdomain.com/models/${filename}`;
```

### 3. Cache Headers
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/cardiacity-models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 📊 Monitoring

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry Error Tracking
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## ✅ Pre-Deployment Checklist

- [ ] `npm run build` succeeds locally
- [ ] All 127 model files in `/public/cardiacity-models/`
- [ ] Environment variables configured (if any)
- [ ] SSL certificate configured
- [ ] Custom domain DNS pointing correctly
- [ ] Performance tested with Lighthouse
- [ ] Error tracking configured
- [ ] Backup strategy in place

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### 404 on Models
- Check `/public/cardiacity-models/` exists
- Verify 127 `.obj` files present
- Check file permissions (755 for directories, 644 for files)

### High Memory Usage
- Reduce model quality (decimate OBJ files)
- Enable lazy loading for models
- Increase server memory allocation

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)
- Use load balancer (AWS ALB, Nginx)
- Session affinity not required (stateless app)
- Share model files via CDN

### Vertical Scaling
- Increase server RAM (recommended: 2GB minimum)
- Upgrade CPU for faster initial load
- Use SSD for faster file reads

---

**Ready to deploy? Choose your platform and follow the steps above!** 🚀
