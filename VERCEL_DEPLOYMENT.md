# Vercel Deployment Guide

## Step-by-Step Setup for Production

### Prerequisites
- GitHub repository with your code (✅ Already pushed)
- MongoDB Atlas production database (✅ Already set up)
- Vercel account (free tier works fine)

---

## Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repositories

---

## Step 2: Import Your Project

1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository: **`nwinnie450/TestCaseWriter`**
3. Click **"Import"**

---

## Step 3: Configure Project Settings

### Framework Preset
- **Framework**: Next.js (should auto-detect)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)

### Environment Variables
Click **"Environment Variables"** and add these:

#### Required Variables:
```
DATABASE_URL = mongodb+srv://winniengiew:Orion888!@prod.zq1ynq1.mongodb.net/testcasewriter?retryWrites=true&w=majority&appName=Prod

JWT_SECRET = [generate a secure random string - see below]
```

#### Optional (if using AI features):
```
OPENAI_API_KEY = your-openai-api-key
ANTHROPIC_API_KEY = your-anthropic-api-key
```

**To generate JWT_SECRET:**
Open your terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as the JWT_SECRET value.

---

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see "Congratulations!" when done

---

## Step 5: Initialize Database (First Time Only)

After first deployment, you need to seed the admin user:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run seed script
vercel env pull .env.production.local
npm run db:seed
```

### Option B: Manual Database Setup
1. Connect to MongoDB Atlas directly
2. Go to Collections → users
3. Insert this document:
```json
{
  "email": "admin@merquri.io",
  "name": "Admin User",
  "username": "admin",
  "password": "UGFzc3dvcmQ4ODgh",
  "role": "admin",
  "avatar": "https://ui-avatars.com/api/?name=Admin User&background=1f2937&color=fff",
  "createdAt": {"$date": "2025-01-01T00:00:00.000Z"},
  "updatedAt": {"$date": "2025-01-01T00:00:00.000Z"}
}
```

---

## Step 6: Access Your App

1. Vercel will give you a URL like: `https://test-case-writer-xyz.vercel.app`
2. Open it in your browser
3. Login with:
   - **Email**: admin@merquri.io
   - **Password**: Password888!

---

## Step 7: Custom Domain (Optional)

1. In Vercel project settings, go to **"Domains"**
2. Add your custom domain (e.g., `testcases.yourcompany.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatic!

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Make sure MongoDB connection string is correct

### Database Connection Error
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all) for Vercel
- Check DATABASE_URL is correct
- Ensure database user has read/write permissions

### Admin User Not Working
- Run the seed script (see Step 5)
- Or manually insert admin user in MongoDB Atlas

### Application Crashes
- Check Vercel Function logs
- Verify all dependencies are in package.json
- Check that `tsx` is in devDependencies

---

## Production Checklist

- [x] Code pushed to GitHub
- [x] MongoDB production database created
- [x] Environment variables configured in Vercel
- [x] JWT_SECRET generated and added
- [x] Project deployed successfully
- [ ] Admin user seeded
- [ ] Test login with admin credentials
- [ ] Custom domain configured (optional)

---

## Next Deployments

After the initial setup, deployments are automatic:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin master
   ```
3. Vercel automatically detects the push and redeploys!

---

## Support

**Vercel Issues**: [vercel.com/support](https://vercel.com/support)
**MongoDB Issues**: [MongoDB Atlas Support](https://www.mongodb.com/support)

🎉 **Your Test Case Manager is now live in production!**