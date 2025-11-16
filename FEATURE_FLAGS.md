# Feature Flags Guide

All technical improvements are controlled by feature flags in `.env`. Enable them individually to test and use enhanced features.

## Available Feature Flags

### 1. Firecrawl Integration (Vendor Website Scraping)
**Flag:** `USE_FIRECRAWL`

**Default:** `false` (uses Claude-only vendor sourcing)

**Enable:**
```env
USE_FIRECRAWL=true
FIRECRAWL_API_KEY=fc-your-api-key-here
```

**What it does:**
- Finds real vendor website URLs using Claude
- Scrapes vendor websites using Firecrawl
- Extracts real contact information (emails, phone numbers)
- Uses scraped data to enhance vendor information
- Falls back gracefully if scraping fails

**Requirements:**
- Firecrawl API key from https://firecrawl.dev
- Install Firecrawl SDK: `npm install @mendable/firecrawl-js`

**Benefits:**
- Real vendor contact information
- Actual website URLs
- Extracted emails from vendor sites
- Better vendor data quality

**Note:** This takes priority over `USE_STRUCTURED_OUTPUTS` for vendor sourcing (includes structured outputs automatically)

---

### 2. Enhanced File Processing
**Flag:** `ENHANCED_FILE_PROCESSING`

**Default:** `false` (uses basic processing)

**Enable:**
```env
ENHANCED_FILE_PROCESSING=true
```

**What it does:**
- Extracts comprehensive engineering data: materials, electrical/thermal/mechanical specs
- Extracts certifications (UL, IEC, CE, RoHS, ISO)
- Extracts environmental constraints (IP ratings, operating environment)
- Extracts tolerances and quantities
- Uses structured JSON schemas for reliable extraction

---

### 2. Structured Outputs (Vendor Sourcing & BOM Estimation)
**Flag:** `USE_STRUCTURED_OUTPUTS`

**Default:** `false` (uses basic JSON parsing)

**Enable:**
```env
USE_STRUCTURED_OUTPUTS=true
```

**What it does:**
- Uses comprehensive JSON schemas for vendor sourcing
- Uses structured schemas for BOM estimation
- Guarantees valid JSON responses
- Reduces parsing errors
- Better type safety

**Affects:**
- `vendorSourcing.ts` - Enhanced vendor search with structured outputs
- `bomEstimator.ts` - Enhanced BOM estimation with structured outputs

---

### 3. Retry Logic
**Flag:** `USE_RETRY_LOGIC`

**Default:** `false` (single attempt, fail immediately)

**Enable:**
```env
USE_RETRY_LOGIC=true
```

**What it does:**
- Automatically retries on rate limits (429)
- Retries on server errors (5xx)
- Uses exponential backoff (1s, 2s, 4s delays)
- Logs retry attempts
- Max 3 retries by default

**Affects:**
- All Anthropic API calls (when enabled)
- Vendor sourcing
- BOM estimation
- File processing

---

### 4. Enhanced Error Handling
**Flag:** `USE_ENHANCED_ERROR_HANDLING`

**Default:** `false` (basic error messages)

**Enable:**
```env
USE_ENHANCED_ERROR_HANDLING=true
```

**What it does:**
- Provides specific error messages for different error types
- User-friendly error messages
- Better debugging information
- Handles network errors, JSON parsing errors, API errors

**Affects:**
- All error handling throughout the application
- Better user experience
- Easier debugging

---

## Quick Setup

### Enable All Features
```env
ENHANCED_FILE_PROCESSING=true
USE_FIRECRAWL=true
FIRECRAWL_API_KEY=fc-your-api-key-here
USE_STRUCTURED_OUTPUTS=true
USE_RETRY_LOGIC=true
USE_ENHANCED_ERROR_HANDLING=true
```

### Enable Only Critical Features
```env
ENHANCED_FILE_PROCESSING=true
USE_FIRECRAWL=true
FIRECRAWL_API_KEY=fc-your-api-key-here
USE_STRUCTURED_OUTPUTS=true
```

### Disable All (Use Basic Mode)
```env
ENHANCED_FILE_PROCESSING=false
USE_FIRECRAWL=false
USE_STRUCTURED_OUTPUTS=false
USE_RETRY_LOGIC=false
USE_ENHANCED_ERROR_HANDLING=false
# Or simply don't set them (defaults to false)
```

---

## Technical Benefits

### For Hackathon Judging

**Anthropic Track:**
- ✅ Structured outputs show SDK best practices
- ✅ Retry logic shows professional implementation
- ✅ Enhanced error handling shows attention to detail

**Locus Track:**
- ✅ Enhanced file processing extracts better vendor data
- ✅ Structured outputs ensure reliable data extraction
- ✅ Better error handling improves reliability

**Overall:**
- ✅ Feature flags allow easy testing
- ✅ Backward compatible (doesn't break existing code)
- ✅ Professional implementation patterns

---

## Implementation Details

### File Structure
```
server/
  services/
    fileProcessor.ts                    # Routes to enhanced if flag set
    fileProcessorEnhanced.ts            # Enhanced file processing
    vendorSourcing.ts                   # Routes to enhanced/Firecrawl if flag set
    vendorSourcingEnhanced.ts           # Enhanced vendor sourcing (structured outputs)
    vendorSourcingWithFirecrawl.ts     # Firecrawl integration (includes structured outputs)
    bomEstimator.ts                     # Routes to enhanced if flag set
    bomEstimatorEnhanced.ts             # Enhanced BOM estimation
    firecrawlService.ts                 # Firecrawl scraping utilities
  utils/
    retry.ts                            # Retry utility (used if flag set)
    errorHandler.ts                     # Enhanced error handling (used if flag set)
```

### How It Works

1. **Feature Flag Check**: Each service checks the environment variable
2. **Route to Enhanced**: If flag is `true`, imports and uses enhanced version
3. **Fallback to Basic**: If flag is `false` or not set, uses original implementation
4. **No Breaking Changes**: All existing code continues to work

### Example Flow

```typescript
// In vendorSourcing.ts
async function searchVendorsForComponent(...) {
  const useStructuredOutputs = process.env.USE_STRUCTURED_OUTPUTS === 'true';

  if (useStructuredOutputs) {
    const { searchVendorsForComponentEnhanced } = await import('./vendorSourcingEnhanced.js');
    return searchVendorsForComponentEnhanced(...);
  }

  // Original implementation
  // ... existing code ...
}
```

---

## Testing

### Test Enhanced Mode
```bash
# Set flags in .env
ENHANCED_FILE_PROCESSING=true
USE_STRUCTURED_OUTPUTS=true
USE_RETRY_LOGIC=true
USE_ENHANCED_ERROR_HANDLING=true

# Run server
npm run dev:server
```

### Test Basic Mode
```bash
# Don't set flags or set to false
# Run server
npm run dev:server
```

### Test Individual Features
```bash
# Test only file processing enhancement
ENHANCED_FILE_PROCESSING=true npm run dev:server

# Test only structured outputs
USE_STRUCTURED_OUTPUTS=true npm run dev:server
```

---

## Notes

- All features are **backward compatible**
- Existing code works without changes
- Feature flags can be toggled independently
- No breaking changes to API or interfaces
- Enhanced features use more tokens (for comprehensive extraction)
- Retry logic adds delays but improves reliability
- Error handling improves UX without changing functionality

---

## Recommended Configuration for Hackathon

For maximum technical points:

```env
# Enable all enhancements
ENHANCED_FILE_PROCESSING=true
USE_FIRECRAWL=true
FIRECRAWL_API_KEY=fc-your-api-key-here
USE_STRUCTURED_OUTPUTS=true
USE_RETRY_LOGIC=true
USE_ENHANCED_ERROR_HANDLING=true
```

This demonstrates:
- ✅ Proper use of Anthropic SDK (structured outputs)
- ✅ Real vendor data extraction (Firecrawl)
- ✅ Professional error handling
- ✅ Retry logic for reliability
- ✅ Comprehensive data extraction
- ✅ Best practices implementation
- ✅ Real-world integration (Firecrawl for web scraping)

