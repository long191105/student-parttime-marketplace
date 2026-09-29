# Marketplace database

`schema.sql` creates the `marketplace` schema in the existing PostgreSQL database and references `public.user_accounts` for student, employer, and admin identities.

Apply it to the configured `student_marketplace` database with:

```powershell
psql -h localhost -U postgres -d student_marketplace -f DB/schema.sql
```

Tables cover job posts, applications and attached resume URLs, two-way reviews, notifications, and saved jobs. Resume files should be stored by an upload service; `resume_url` stores the resulting private or signed URL, not the file contents.