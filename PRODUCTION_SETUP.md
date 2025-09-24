# Production Setup Guide

## MongoDB Atlas Production Database

### Current Configuration

**Development Database:**
- URL: `mongodb+srv://winniengiew:Orion888!@cluster0.axqvcva.mongodb.net/testcasewriter`
- Cluster: Cluster0

**Production Database:**
- URL: `mongodb+srv://winniengiew:Orion888!@prod.zq1ynq1.mongodb.net/testcasewriter`
- Cluster: Prod

### Steps to Deploy to Production

#### 1. Update Production Environment Variables

On your production server (Vercel, Railway, etc.), set these environment variables:

```bash
DATABASE_URL=mongodb+srv://winniengiew:Orion888!@prod.zq1ynq1.mongodb.net/testcasewriter?retryWrites=true&w=majority&appName=Prod
JWT_SECRET=<generate-a-secure-random-string>
```

#### 2. Initialize Production Database

Run these commands to set up the database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to production MongoDB
npx prisma db push

# Seed default admin user
npm run db:seed
```

This will create the default admin user:
- **Email**: admin@merquri.io
- **Username**: admin
- **Password**: Password888!

#### 3. Verify Database Connection

```bash
# Check if connection works
npx prisma db pull
```

### Security Recommendations

1. **Change JWT Secret**: Generate a secure random string for production
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update MongoDB Password**: Consider using a different password for production

3. **IP Whitelist**: In MongoDB Atlas, configure IP whitelist for production servers only

4. **Connection String**: Store in environment variables, never commit to git

### Platform-Specific Setup

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add `DATABASE_URL` and `JWT_SECRET`
3. Redeploy the application

#### Railway
1. Go to Variables tab
2. Add `DATABASE_URL` and `JWT_SECRET`
3. Redeploy automatically

#### Other Platforms
Copy `.env.production` to your server and rename to `.env`

### Troubleshooting

**Connection Issues:**
- Verify MongoDB Atlas IP whitelist includes production server IP
- Check if database name is correct in connection string
- Ensure credentials are properly URL-encoded

**Schema Issues:**
- Run `npx prisma db push` to sync schema
- Check Prisma logs for migration errors

### Migration from Development

If you need to migrate data from dev to production:

```bash
# Export from development
npx prisma db pull --schema=./prisma/schema.prisma

# Import to production (set DATABASE_URL to production first)
npx prisma db push
```

⚠️ **Note**: Test thoroughly in a staging environment before production deployment!