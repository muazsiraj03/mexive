
# File Reviewer Tool for Marketplaces

## Overview

Build an AI-powered **File Reviewer** tool that analyzes files (images, vectors, videos) before submission to stock marketplaces (Adobe Stock, Freepik, Shutterstock). The tool identifies potential rejection reasons based on marketplace-specific quality standards, helping users fix issues before submitting.

---

## What This Tool Does

Users upload files, and the AI analyzes each one for:
- **Visual quality issues** (blur, noise, low resolution, poor lighting)
- **Technical problems** (broken shapes, messy paths, missing fonts for vectors)
- **Content issues** (watermarks, half-cut subjects, unrealistic elements)
- **Marketplace compliance** (stock usability, commercial friendliness)

The tool provides:
- Pass/Fail verdict per file
- List of detected issues with severity
- Improvement suggestions
- Marketplace-specific recommendations

---

## Architecture

```
text
+-------------------+       +----------------------+       +------------------+
|   Upload Files    | ----> | Process & Upload to  | ----> | AI Edge Function |
|   (Batch/Single)  |       | Supabase Storage     |       | (review-file)    |
+-------------------+       +----------------------+       +------------------+
                                                                    |
                                                                    v
+-------------------+       +----------------------+       +------------------+
|   Review History  | <---- |  Save to Database    | <---- | Analysis Results |
|   (Searchable)    |       |  (file_reviews)      |       | (Issues + Score) |
+-------------------+       +----------------------+       +------------------+
```

---

## Implementation Plan

### Phase 1: Edge Function for AI Review

**New Edge Function: `supabase/functions/review-file/index.ts`**

The AI will analyze files using Gemini's vision capabilities with a specialized prompt that checks for:

| File Type | Checks Performed |
|-----------|-----------------|
| JPG/PNG/WEBP | Visual quality, resolution, noise, blur, subject clarity, watermarks, over-editing, stock usability |
| SVG | Shape integrity, path cleanliness, stroke consistency, text outlining, zoom quality, design clarity |
| EPS | File structure, clipping issues, anchor points, stroke expansion, raster elements, hidden objects |
| AI | File integrity, linked images, hidden layers, artboard quality, text outlining, vector quality |
| Video | Video quality, stability, blur/noise, lighting, subject clarity, motion realism, watermarks |

**Rejection Reasons Catalog**: The system prompt will contain all ~50 rejection reasons you provided in Bengali/English, organized by file type.

---

### Phase 2: Database Schema

**New table: `file_reviews`**
```
Columns:
- id (UUID, primary key)
- user_id (UUID, references profiles)
- file_name (TEXT)
- file_type (TEXT) - jpg, png, svg, eps, ai, mp4, etc.
- image_url (TEXT) - uploaded file URL for reference
- overall_score (INTEGER) - 0-100 quality score
- verdict (TEXT) - 'pass', 'warning', 'fail'
- issues (JSONB) - array of detected issues
- suggestions (JSONB) - improvement recommendations
- marketplace_notes (JSONB) - per-marketplace specific notes
- created_at (TIMESTAMPTZ)
```

**Issue structure**:
```
{
  "code": "BLUR_DETECTED",
  "severity": "high",
  "category": "image_quality",
  "message": "Image appears blurry or out of focus",
  "message_bn": "ছবি blur বা out of focus"
}
```

---

### Phase 3: Frontend Components

**New Page: `FileReviewerPage.tsx`**

Located at `/dashboard/file-reviewer` with:

1. **Upload Section**
   - Reuse existing `ImageUploader` component
   - Support all file types: JPG, PNG, WEBP, SVG, EPS, AI, MP4, MOV, WEBM
   - Batch upload support

2. **Review Results Panel**
   - Per-file review cards showing:
     - Thumbnail/preview
     - Verdict badge (Pass/Warning/Fail with color coding)
     - Quality score (0-100)
     - Expandable issues list with severity indicators
     - Improvement suggestions
   - Marketplace-specific tabs (Adobe, Freepik, Shutterstock)

3. **Batch Review Queue**
   - Progress indicator for batch processing
   - Summary statistics (X passed, Y warnings, Z failed)

4. **Review History**
   - Searchable history of past reviews
   - Filter by verdict, file type, date

---

### Phase 4: Sidebar Navigation

Add "File Reviewer" to the Tools section in `DashboardSidebar.tsx`:
```
Tools:
- Metadata Generator
- Image to Prompt
- BG Remover
- File Reviewer (new)
```

---

## Technical Details

### Edge Function Request/Response

**Request:**
```
{
  "imageUrl": "https://...",
  "fileType": "jpg",
  "fileName": "photo-123.jpg",
  "marketplaces": ["Adobe Stock", "Freepik", "Shutterstock"]
}
```

**Response:**
```
{
  "overallScore": 75,
  "verdict": "warning",
  "issues": [
    {
      "code": "LOW_RESOLUTION",
      "severity": "medium",
      "category": "technical",
      "message": "Resolution is below 4MP",
      "message_bn": "resolution কম (4MP এর নিচে)"
    }
  ],
  "suggestions": [
    "Consider upscaling the image to at least 4000x3000 pixels",
    "Use noise reduction while maintaining detail"
  ],
  "marketplaceNotes": {
    "Adobe Stock": "May be rejected due to resolution requirements",
    "Freepik": "Acceptable for web-only category",
    "Shutterstock": "Requires minimum 4MP for acceptance"
  }
}
```

### File Type Processing

- **Raster images (JPG/PNG/WEBP)**: Process directly via AI vision
- **SVG**: Convert to PNG for AI analysis (reuse existing `convertSvgToPng`)
- **Video**: Extract frame for analysis (reuse existing `extractVideoFrame`)
- **EPS/AI**: Show message that these require preview export; cannot analyze directly in browser

### Credit System

Each file review consumes 1 credit (same as other tools).

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/review-file/index.ts` | Edge function for AI file analysis |
| `src/components/dashboard/FileReviewerPage.tsx` | Main page component |
| `src/components/dashboard/ReviewResultCard.tsx` | Individual file review result display |
| `src/components/dashboard/ReviewHistoryDrawer.tsx` | Past reviews history panel |
| `src/lib/file-reviewer.ts` | Helper functions and types |
| `src/hooks/use-file-reviews.tsx` | Hook for managing review state and history |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardSidebar.tsx` | Add File Reviewer to Tools section |
| `src/pages/Dashboard.tsx` | Add route for `/file-reviewer` |
| `supabase/config.toml` | Add `review-file` function configuration |

---

## Database Migration

```
SQL migration to create:
- file_reviews table
- RLS policies for user data isolation
- Index on user_id and created_at for efficient queries
```

---

## Summary

This plan creates a comprehensive File Reviewer tool that:
1. Analyzes all supported file types for marketplace rejection reasons
2. Provides bilingual feedback (English + Bengali)
3. Gives marketplace-specific recommendations
4. Maintains review history for reference
5. Follows existing patterns from Image to Prompt and Metadata Generator
6. Uses the existing Lovable AI Gateway for analysis
