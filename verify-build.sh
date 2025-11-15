#!/bin/bash
# Build verification script

set -e

echo "🔍 Verifying build setup..."
echo ""

# Check TypeScript compilation
echo "1. Checking TypeScript compilation..."
npm run type-check
echo "✓ TypeScript compiles successfully"
echo ""

# Check frontend build
echo "2. Checking frontend build..."
npm run build:frontend
echo "✓ Frontend builds successfully"
echo ""

# Check dependencies
echo "3. Checking critical dependencies..."
node -e "
  const deps = {
    'express': require('express'),
    'multer': require('multer'),
    'cors': require('cors'),
    '@anthropic-ai/sdk': require('@anthropic-ai/sdk')
  };
  console.log('✓ All dependencies available');
"
echo ""

# Check environment
echo "4. Checking environment setup..."
if [ -f .env ]; then
  echo "✓ .env file exists"
  if grep -q "ANTHROPIC_API_KEY" .env; then
    echo "✓ ANTHROPIC_API_KEY found in .env"
  else
    echo "⚠️  ANTHROPIC_API_KEY not found in .env"
  fi
else
  echo "⚠️  .env file not found"
fi
echo ""

# Check file structure
echo "5. Checking file structure..."
files=(
  "server/index.ts"
  "server/services/fileProcessor.ts"
  "server/services/bomEstimator.ts"
  "frontend/src/lib/api.ts"
  "frontend/src/components/EngineeringAssetUpload.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file MISSING"
    exit 1
  fi
done
echo ""

echo "✅ All checks passed! Ready to run:"
echo "   Backend:  npm run dev:server"
echo "   Frontend: npm run dev:frontend"

