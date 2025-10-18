# FAQ System Documentation

## Overview

A modern, performant FAQ management system following 2025 web standards with:

- ✅ Database-driven content (Neon PostgreSQL)
- ✅ Admin CRUD interface
- ✅ Public-facing display with SEO
- ✅ Schema.org FAQPage markup for Google rich snippets
- ✅ Client-side search (no API calls needed)
- ✅ Category-based organization
- ✅ React Query caching (1-hour stale time)
- ✅ Mobile-first responsive design
- ✅ ISR (Incremental Static Regeneration) support

## Architecture

```
┌─────────────────────────────────────────┐
│ PUBLIC HOMEPAGE                         │
│ <FAQSection />                          │
│ - Client-side search                    │
│ - Category filtering                    │
│ - Schema.org markup                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ API ENDPOINT /api/faq                   │
│ - GET: Public (no auth)                 │
│ - POST: Admin only                      │
│ - Response cached by React Query        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ DATABASE (Neon PostgreSQL)              │
│ FAQ Model:                              │
│ - question, answer, category            │
│ - order, isActive                       │
│ - Indexed for performance               │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│ ADMIN DASHBOARD                         │
│ /dashboard/faq                          │
│ <FAQManagement />                       │
│ - Create, Edit, Delete FAQs             │
│ - Drag-drop ordering                    │
│ - Live preview                          │
└─────────────────────────────────────────┘
```

## Performance Features

### 1. Caching Strategy

- **React Query Cache**: 1 hour stale time, 2 hour garbage collection
- **ISR (Next.js)**: Static generation with revalidation on update
- **Client-side Search**: No API calls, instant results

### 2. Database Optimization

- Indexed fields: `category`, `isActive`
- Ordered queries for consistent results
- Only active FAQs returned to public

### 3. Mobile Optimization

- Mobile-first design
- Lazy-loaded accordion items
- Optimized bundle size
- Fast interaction times

## Usage

### Public FAQ Display (Homepage)

```tsx
import { FAQSection } from '@/features/faq/components';

export default function HomePage() {
  return (
    <>
      {/* Other sections */}

      <FAQSection
        showCategories={true}
        showSearch={true}
        showContactSupport={true}
        limit={undefined} // Show all FAQs
      />

      {/* More sections */}
    </>
  );
}
```

### Options

```typescript
interface FAQSectionProps {
  limit?: number; // Max FAQs to show (default: all)
  showCategories?: boolean; // Show category tabs (default: true)
  showSearch?: boolean; // Show search bar (default: true)
  showContactSupport?: boolean; // Show contact card (default: true)
  title?: string; // Custom title
  description?: string; // Custom description
}
```

### Admin Management

Access at `/dashboard/faq` (ADMIN role required)

Features:

- ✅ Create new FAQs
- ✅ Edit existing FAQs
- ✅ Delete FAQs
- ✅ Toggle active/inactive
- ✅ Set display order
- ✅ Organize by category
- ✅ Search and filter

## API Endpoints

### GET /api/faq

**Public endpoint** - Fetch all active FAQs

**Query Parameters:**

- `category` (optional): Filter by category
- `includeInactive` (optional): Include inactive FAQs (admin only)

**Response:**

```json
{
  "success": true,
  "data": {
    "faqs": [...],
    "faqsByCategory": {...},
    "categories": [...],
    "total": 10
  }
}
```

### POST /api/faq

**Admin only** - Create new FAQ

**Request Body:**

```json
{
  "question": "How long does processing take?",
  "answer": "Typically 4-6 weeks...",
  "category": "Visa Process",
  "order": 0,
  "isActive": true
}
```

### PUT /api/faq/:id

**Admin only** - Update FAQ

### DELETE /api/faq/:id

**Admin only** - Delete FAQ

## SEO Optimization

The FAQ section includes **Schema.org FAQPage** markup for Google rich snippets:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does processing take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Typically 4-6 weeks..."
        }
      }
    ]
  }
</script>
```

This enables:

- 🔍 Rich snippets in Google search results
- 🚀 Improved CTR from search
- 📈 Better SEO ranking

## Categories

Default categories (customizable):

- Visa Process
- Documents
- Payment
- Account
- General
- Technical Support

## Best Practices

### 1. Content Guidelines

**Questions should be:**

- Clear and concise
- Written from user perspective
- Common actual questions

**Answers should be:**

- Accurate and up-to-date
- Easy to understand
- Include specifics (numbers, steps)

### 2. Organization

- Use `order` field to prioritize important FAQs
- Group related questions in same category
- Keep active count under 30 for best UX
- Archive outdated FAQs (set `isActive: false`)

### 3. Performance

- Keep FAQ count reasonable (<50 active)
- Use categories to organize large sets
- Client-side search = no API overhead
- Cached responses = fast loads

## Migration from Hardcoded FAQs

The old `FAQList.tsx` component has been kept for backwards compatibility. To migrate:

1. **Create FAQs in database:**
   - Go to `/dashboard/faq`
   - Add existing FAQs from the hardcoded array

2. **Update homepage:**

   ```tsx
   // Before
   import { FAQList } from '@/features/faq/components';

   // After
   import { FAQSection } from '@/features/faq/components';

   <FAQSection />;
   ```

3. **Remove hardcoded data:**
   - The old `FAQList.tsx` can be deleted after migration

## Roadmap

Future enhancements:

- [ ] Multi-language support (i18n)
- [ ] Analytics tracking (most viewed FAQs)
- [ ] AI-powered answer suggestions
- [ ] Related questions recommendations
- [ ] Video/image attachments in answers

## Support

For issues or questions:

- Check console logs for errors
- Verify admin role for management access
- Check network tab for API responses
- Review React Query DevTools for cache status
