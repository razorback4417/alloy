# Alloy - Autonomous Procurement Copilot

An AI-powered procurement system that extracts components from engineering files, sources vendors, and executes payments via Locus.

## Technical Flow

1. **File Upload** → User uploads engineering design file (PDF, CAD, etc.)
2. **File Processing** → Anthropic SDK extracts components, materials, and specs (enhanced mode extracts certifications, environmental constraints, tolerances)
3. **BOM Estimation** → Anthropic SDK estimates costs and lead times for each component
4. **Vendor Sourcing** → Anthropic SDK finds vendors (Firecrawl mode scrapes real vendor websites for contact info)
5. **Procurement Plan** → System generates structured purchasing plan with vendor recommendations
6. **User Approval** → Human reviews and approves the plan
7. **Payment Execution** → Locus MCP tools execute USDC payments to vendor wallet addresses
8. **CRM Logging** → Order details and transaction hashes logged to CRM dashboard

## Key Integrations

- **Anthropic SDK**: Component extraction, vendor sourcing, BOM estimation
- **Locus MCP**: Payment execution via `send_to_address` and `get_payment_context`
- **Firecrawl** (optional): Real vendor website scraping for contact information

## Locus Payment Integration

### Architecture
```
Frontend (ApprovalExecution.tsx)
  ↓
API Call → POST /api/execute-payment
  ↓
Payment Executor Service
  ↓
Locus MCP Tools (via Anthropic SDK)
  ↓
USDC Transfer
```

### MCP Tools Used
- **`mcp__locus__get_payment_context`**: Checks wallet balance, spending limits, and whitelisted contacts
- **`mcp__locus__send_to_address`**: Executes USDC transfers to vendor wallet addresses

### Payment Execution Flow
1. User approves the procurement plan in the UI
2. Frontend calls `/api/execute-payment` with the plan
3. Backend validates `LOCUS_API_KEY` and `ANTHROPIC_API_KEY`
4. Payment executor:
   - Retrieves payment context from Locus (balance, limits)
   - Groups vendors and calculates the payment amount
   - Executes USDC transfer via `send_to_address`
5. Returns transaction hash(es) for display in the UI and logging

### Current Configuration (Test Mode)
- **Test Amount**: $0.01 per vendor (not actual plan amounts)
- **Test Wallet**: `0x8527a8f999edac78f3bd40f706a1554a0e602858`
- **Token**: USDC

### Key Files
- `server/services/paymentExecutor.ts` — Core payment execution logic
- `server/index.ts` — API endpoint (`POST /api/execute-payment`)
- `frontend/src/components/ApprovalExecution.tsx` — Payment approval UI
- `frontend/src/lib/api.ts` — API client (`executePayment()`)

### Environment Variables
```env
LOCUS_API_KEY=locus_...          # Required for payment execution
ANTHROPIC_API_KEY=sk-ant-...     # Required for MCP tool access
```

### Transaction Verification
After payment execution, transaction hashes are available through the Locus dashboard:
- `https://app.paywithlocus.com/dashboard/transactions`

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys: ANTHROPIC_API_KEY, LOCUS_API_KEY

# Run development server
npm run dev:server

# Run frontend (in separate terminal)
npm run dev:frontend
```

## Feature Flags

Enable enhanced features via environment variables. See `FEATURE_FLAGS.md` for details.

- `ENHANCED_FILE_PROCESSING=true` - Comprehensive engineering data extraction
- `USE_FIRECRAWL=true` - Real vendor website scraping
- `USE_STRUCTURED_OUTPUTS=true` - Structured JSON schemas
- `USE_RETRY_LOGIC=true` - Automatic retry on failures
- `USE_ENHANCED_ERROR_HANDLING=true` - Better error messages

## Project Structure

```
server/
  services/
    fileProcessor.ts              # File processing (routes to enhanced if enabled)
    vendorSourcing.ts             # Vendor sourcing (routes to Firecrawl/enhanced if enabled)
    bomEstimator.ts               # BOM estimation
    paymentExecutor.ts            # Locus payment execution
  utils/
    retry.ts                      # Retry logic utility
    errorHandler.ts               # Enhanced error handling

frontend/
  src/
    components/                   # React components
    lib/
      api.ts                      # API client
```

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-...
LOCUS_API_KEY=locus_...
FIRECRAWL_API_KEY=fc-...          # Optional, for vendor scraping
ENHANCED_FILE_PROCESSING=false    # Feature flags
USE_FIRECRAWL=false
USE_STRUCTURED_OUTPUTS=false
USE_RETRY_LOGIC=false
USE_ENHANCED_ERROR_HANDLING=false
```
