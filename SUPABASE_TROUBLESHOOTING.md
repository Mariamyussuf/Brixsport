# Supabase Connection Troubleshooting Guide

## Error: "Network error: Unable to connect to the database"

This error indicates that your frontend cannot connect to your Supabase database. Follow these steps to diagnose and fix the issue:

### Step 1: Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify the following variables are set:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Important**: 
   - The URL must start with `https://`
   - The URL should be your **project URL**, not a database connection string
   - Do NOT use URLs starting with `db.` - that's a database connection string, not the API URL
   - The URL format should be: `https://[project-id].supabase.co`

### Step 2: Verify Supabase Project Status

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Check if your project is **paused**
   - Paused projects cannot accept connections
   - If paused, click "Resume" to reactivate

### Step 3: Check Browser Console

Open your browser's developer console (F12) and look for:

1. **Supabase initialization logs**:
   ```
   [Supabase] Client initialized with hostname: [your-hostname]
   [Supabase] Environment check - URL set: true, Anon key set: true
   ```

2. **Error details**:
   ```
   [DatabaseService] Network error details: {
     error: "...",
     supabaseUrlConfigured: true/false,
     supabaseHostname: "...",
     sport: "..."
   }
   ```

### Step 4: Common Issues and Solutions

#### Issue: "ERR_NAME_NOT_RESOLVED"
**Cause**: The Supabase URL is incorrect or the project doesn't exist
**Solution**: 
- Verify the URL in Supabase dashboard → Settings → API
- Ensure the URL matches exactly (including `https://`)

#### Issue: Environment variables not set
**Cause**: Variables missing in Vercel
**Solution**:
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- **Redeploy** after adding variables (Vercel requires a new deployment)

#### Issue: Project is paused
**Cause**: Supabase free tier projects pause after inactivity
**Solution**:
- Go to Supabase dashboard
- Click "Resume" on your project
- Wait a few minutes for the project to fully restart

#### Issue: CORS errors
**Cause**: Domain not allowed in Supabase settings
**Solution**:
- Go to Supabase dashboard → Settings → API
- Add your Vercel domain to allowed origins
- Or use `*` for development (not recommended for production)

### Step 5: Test Connection

After fixing the configuration:

1. **Redeploy** your Vercel application (required after env var changes)
2. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the browser console for successful connection logs

### Step 6: Get Your Supabase Credentials

If you need to find your Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel
- [ ] URL starts with `https://`
- [ ] URL format is `https://[project-id].supabase.co`
- [ ] Supabase project is not paused
- [ ] Application has been redeployed after setting variables
- [ ] Browser console shows Supabase initialization logs

### Still Having Issues?

If the problem persists:

1. Check the browser console for detailed error messages
2. Verify the Supabase project is active in the dashboard
3. Try accessing the Supabase API directly in your browser:
   ```
   https://[your-project-id].supabase.co/rest/v1/
   ```
   (You should see a JSON response, not an error)

4. Check Vercel deployment logs for any environment variable warnings

