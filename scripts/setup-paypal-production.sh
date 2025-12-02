#!/bin/bash
# Setup PayPal Production Subscription Plans for Mirror of Dreams

# Production credentials
CLIENT_ID="AYi3--5aZaMtxU36QcQgqzvyzN13xQv-N9HLGJWDDCsAki6gAXsr2HOxiLhZJXRVgeF9Mmu_vE-UgkEZ"
CLIENT_SECRET="EMMy0kPje6estVDFx9ivNeq_5nronOIh-aITvHL8IDGB6LCZNoNJ7yrn2L5YvLRzaPszYLZ54VYwTKuH"
API_BASE="https://api-m.paypal.com"

echo "=== Mirror of Dreams - PayPal Production Setup ==="
echo ""

# Get access token
echo "1. Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/oauth2/token" \
  -u "${CLIENT_ID}:${CLIENT_SECRET}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  echo "$TOKEN_RESPONSE"
  exit 1
fi
echo "   Access token obtained!"

# Create Product
echo ""
echo "2. Creating product..."
PRODUCT_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/catalogs/products" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mirror of Dreams Subscription",
    "description": "AI-powered self-reflection and dream journaling platform",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "home_url": "https://mirror-of-truth.com"
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.id')

if [ "$PRODUCT_ID" == "null" ] || [ -z "$PRODUCT_ID" ]; then
  echo "ERROR: Failed to create product"
  echo "$PRODUCT_RESPONSE"
  exit 1
fi
echo "   Product created: $PRODUCT_ID"

# Create Pro Monthly Plan ($15/month)
echo ""
echo "3. Creating Pro Monthly plan ($15/month)..."
PRO_MONTHLY_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/billing/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"${PRODUCT_ID}\",
    \"name\": \"Pro Monthly\",
    \"description\": \"Pro tier - 5 dreams, 30 reflections/month (max 1/day)\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"MONTH\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"value\": \"15\",
            \"currency_code\": \"USD\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

PRO_MONTHLY_ID=$(echo $PRO_MONTHLY_RESPONSE | jq -r '.id')
echo "   Pro Monthly plan created: $PRO_MONTHLY_ID"

# Create Pro Yearly Plan ($150/year)
echo ""
echo "4. Creating Pro Yearly plan ($150/year)..."
PRO_YEARLY_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/billing/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"${PRODUCT_ID}\",
    \"name\": \"Pro Yearly\",
    \"description\": \"Pro tier - 5 dreams, 30 reflections/month (max 1/day) - Annual billing\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"YEAR\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"value\": \"150\",
            \"currency_code\": \"USD\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

PRO_YEARLY_ID=$(echo $PRO_YEARLY_RESPONSE | jq -r '.id')
echo "   Pro Yearly plan created: $PRO_YEARLY_ID"

# Create Unlimited Monthly Plan ($29/month)
echo ""
echo "5. Creating Unlimited Monthly plan ($29/month)..."
UNLIMITED_MONTHLY_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/billing/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"${PRODUCT_ID}\",
    \"name\": \"Unlimited Monthly\",
    \"description\": \"Unlimited tier - unlimited dreams, 60 reflections/month (max 2/day)\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"MONTH\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"value\": \"29\",
            \"currency_code\": \"USD\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

UNLIMITED_MONTHLY_ID=$(echo $UNLIMITED_MONTHLY_RESPONSE | jq -r '.id')
echo "   Unlimited Monthly plan created: $UNLIMITED_MONTHLY_ID"

# Create Unlimited Yearly Plan ($290/year)
echo ""
echo "6. Creating Unlimited Yearly plan ($290/year)..."
UNLIMITED_YEARLY_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/billing/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"${PRODUCT_ID}\",
    \"name\": \"Unlimited Yearly\",
    \"description\": \"Unlimited tier - unlimited dreams, 60 reflections/month (max 2/day) - Annual billing\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"YEAR\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"value\": \"290\",
            \"currency_code\": \"USD\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

UNLIMITED_YEARLY_ID=$(echo $UNLIMITED_YEARLY_RESPONSE | jq -r '.id')
echo "   Unlimited Yearly plan created: $UNLIMITED_YEARLY_ID"

# Output environment variables
echo ""
echo "=== ENVIRONMENT VARIABLES FOR VERCEL ==="
echo ""
echo "# PayPal Production"
echo "PAYPAL_CLIENT_ID=${CLIENT_ID}"
echo "PAYPAL_CLIENT_SECRET=${CLIENT_SECRET}"
echo "PAYPAL_ENVIRONMENT=live"
echo "PAYPAL_PRODUCT_ID=${PRODUCT_ID}"
echo "PAYPAL_PRO_MONTHLY_PLAN_ID=${PRO_MONTHLY_ID}"
echo "PAYPAL_PRO_YEARLY_PLAN_ID=${PRO_YEARLY_ID}"
echo "PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=${UNLIMITED_MONTHLY_ID}"
echo "PAYPAL_UNLIMITED_YEARLY_PLAN_ID=${UNLIMITED_YEARLY_ID}"
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "IMPORTANT: You still need to create a webhook in PayPal Developer Dashboard:"
echo "1. Go to https://developer.paypal.com/dashboard/applications/live"
echo "2. Select your app"
echo "3. Add webhook URL: https://mirror-of-truth.com/api/webhooks/paypal"
echo "4. Subscribe to these events:"
echo "   - BILLING.SUBSCRIPTION.ACTIVATED"
echo "   - BILLING.SUBSCRIPTION.CANCELLED"
echo "   - BILLING.SUBSCRIPTION.EXPIRED"
echo "   - BILLING.SUBSCRIPTION.SUSPENDED"
echo "   - PAYMENT.SALE.COMPLETED"
echo "5. Copy the Webhook ID and add it as PAYPAL_WEBHOOK_ID"
