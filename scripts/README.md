# Scripts Directory

This directory contains utility scripts for managing the Patrick Travel Services application.

---

##  Available Scripts

### 1. GDPR Scheduled Deletion Script

**File:** `process-scheduled-deletions.ts`

**Purpose:** Permanently deletes user accounts that have been scheduled for deletion (30 days after deletion request).

**When to use:**

- Automatically via cron job (recommended)
- Manually for testing or maintenance

**Run manually:**

```bash
npx tsx scripts/process-scheduled-deletions.ts
```

**What it does:**

1. Finds users where `deletionScheduledFor <= NOW()`
2. Deletes all related data (cases, documents, messages, notifications)
3. Deletes Firebase account
4. Deletes user record
5. Logs all deletions for audit trail

**Output example:**

```
  Starting scheduled account deletions...
 Date: 2025-01-20T02:00:00.000Z
 Found 3 account(s) to delete.

 Processing user: abc-123
   Email: deleted_abc-123@deleted.local
   Name: John Doe
   Scheduled: 2025-01-20T02:00:00.000Z
   Reason: No longer needed
    Firebase account deleted
    User permanently deleted

==================================================
 DELETION SUMMARY
==================================================
 Users deleted:         3
 Cases deleted:         5
 Documents deleted:     15
 Messages deleted:      42
 Notifications deleted: 23
 Errors:                0
==================================================
```

---

### 2. Cron Job Setup Script

**File:** `setup-cron.sh`

**Purpose:** Automatically configures a cron job to run the deletion script daily.

**Run:**

```bash
./scripts/setup-cron.sh
```

**What it does:**

1. Verifies script and dependencies exist
2. Creates logs directory
3. Backs up existing crontab
4. Adds cron job to run daily at 2:00 AM
5. Verifies installation

**Cron schedule:**

- Runs daily at 2:00 AM
- Logs saved to `logs/gdpr-deletions.log`

**Manual cron setup:**
If you prefer to set up manually:

```bash
crontab -e
```

Add this line:

```
0 2 * * * cd /path/to/project && npx tsx scripts/process-scheduled-deletions.ts >> /path/to/project/logs/gdpr-deletions.log 2>&1
```

---

### 3. Other Existing Scripts

**create-admin-user.ts** - Creates an admin user account

```bash
npx tsx scripts/create-admin-user.ts
```

**seed-faqs.ts** - Seeds FAQ data into database

```bash
npx tsx scripts/seed-faqs.ts
```

**create_project_db.sh** - Creates PostgreSQL database

```bash
./scripts/create_project_db.sh
```

**generate-pwa-icons.js** - Generates PWA icons

```bash
node scripts/generate-pwa-icons.js
```

**optimize-images.sh** - Optimizes images for web

```bash
./scripts/optimize-images.sh
```

---

##  Deployment Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

The app includes Vercel Cron configuration in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scheduled-deletions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Setup:**

1. Add `CRON_SECRET` to your Vercel environment variables:

   ```
   CRON_SECRET=your-random-secret-key-here
   ```

2. Deploy to Vercel - cron job is automatically configured

3. Verify in Vercel Dashboard → Settings → Cron Jobs

**Endpoint:** `GET /api/cron/scheduled-deletions`

**Security:** Requires `CRON_SECRET` in Authorization header

---

### Option 2: Traditional Cron (VPS/Self-hosted)

Use the setup script:

```bash
./scripts/setup-cron.sh
```

Or set up manually with crontab (see above).

---

### Option 3: GitHub Actions (Alternative)

Create `.github/workflows/scheduled-deletions.yml`:

```yaml
name: GDPR Scheduled Deletions

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2:00 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  delete-scheduled-accounts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run deletion script
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          FIREBASE_ADMIN_SDK: ${{ secrets.FIREBASE_ADMIN_SDK }}
        run: npx tsx scripts/process-scheduled-deletions.ts
```

---

##  Testing the Deletion Script

### Test with staging data:

1. Create a test user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-delete@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "Delete"
  }'
```

2. Request account deletion:

```bash
curl -X DELETE http://localhost:3000/api/users/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing deletion"}'
```

3. Manually set deletion date to past (in database):

```sql
UPDATE "User"
SET "deletionScheduledFor" = NOW() - INTERVAL '1 day'
WHERE email LIKE 'deleted_%test-delete%';
```

4. Run the script:

```bash
npx tsx scripts/process-scheduled-deletions.ts
```

5. Verify user is deleted:

```sql
SELECT * FROM "User" WHERE email LIKE '%test-delete%';
-- Should return no results
```

---

##  Monitoring & Logs

### View logs (traditional cron):

```bash
tail -f logs/gdpr-deletions.log
```

### View logs (Vercel):

Check Vercel Dashboard → Functions → Logs

### Key metrics to monitor:

- Number of users deleted per day
- Any errors during deletion
- Deletion success rate
- Time taken for deletions

### Database query to check pending deletions:

```sql
SELECT
  COUNT(*) as pending_deletions,
  MIN("deletionScheduledFor") as next_deletion_date
FROM "User"
WHERE "deletionScheduledFor" IS NOT NULL
  AND "deletionScheduledFor" <= NOW();
```

---

##  Security Considerations

### Vercel Cron Security:

- Always use `CRON_SECRET` in production
- Rotate `CRON_SECRET` periodically
- Monitor cron endpoint for unauthorized access

### Traditional Cron Security:

- Ensure cron runs with correct user permissions
- Protect log files (may contain user IDs)
- Set up log rotation to prevent disk space issues

### Script Security:

- Script uses database transactions for atomicity
- Continues processing other users if one fails
- Never exposes PII in logs (only user IDs)
- Firebase deletion errors don't block database cleanup

---

##  Troubleshooting

### Problem: Cron job not running

**Solution:**

```bash
# Check if cron service is running
sudo service cron status

# Check crontab is installed
crontab -l

# Check cron logs
grep CRON /var/log/syslog
```

### Problem: Script fails with database connection error

**Solution:**

- Verify DATABASE_URL is set correctly
- Check database server is accessible
- Ensure Prisma client is generated: `npx prisma generate`

### Problem: Firebase deletion fails

**Solution:**

- Verify FIREBASE_ADMIN_SDK credentials are correct
- Check Firebase Admin SDK is initialized
- Script continues even if Firebase fails (database is cleaned up)

### Problem: Script runs but no users deleted

**Solution:**

```bash
# Check if any users are scheduled for deletion
npx prisma studio
# Navigate to User table, filter by deletionScheduledFor

# Or run SQL:
# SELECT * FROM "User" WHERE "deletionScheduledFor" IS NOT NULL;
```

---

##  Support

For issues or questions:

- Check logs first: `logs/gdpr-deletions.log`
- Review implementation docs: `docs/GDPR_IMPLEMENTATION_SUMMARY.md`
- Contact backend team

---

**Last Updated:** January 20, 2025
**Maintainer:** Backend Team
