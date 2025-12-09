// scripts/create-paypal-webhook.ts
// Creates a PayPal webhook for subscription events

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

const BASE_URL =
  PAYPAL_ENVIRONMENT === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

// Change this to your production URL when deploying
const WEBHOOK_URL = 'https://mirror-of-dreams.vercel.app/api/webhooks/paypal';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

async function createWebhook() {
  console.log('🔗 Creating PayPal webhook...');
  console.log(`   Environment: ${PAYPAL_ENVIRONMENT}`);
  console.log(`   Webhook URL: ${WEBHOOK_URL}`);

  const token = await getAccessToken();
  console.log('✅ Access token obtained');

  const response = await fetch(`${BASE_URL}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: [
        { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
        { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
        { name: 'BILLING.SUBSCRIPTION.EXPIRED' },
        { name: 'BILLING.SUBSCRIPTION.SUSPENDED' },
        { name: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' },
        { name: 'PAYMENT.SALE.COMPLETED' },
      ],
    }),
  });

  const data = await response.json();

  if (response.ok) {
    console.log('\n✅ Webhook created successfully!');
    console.log(`   Webhook ID: ${data.id}`);
    console.log('\n📝 Add this to your .env.local:');
    console.log(`   PAYPAL_WEBHOOK_ID=${data.id}`);
    return data;
  } else {
    console.error('\n❌ Failed to create webhook:');
    console.error(JSON.stringify(data, null, 2));

    // If webhook already exists, list existing webhooks
    if (data.name === 'WEBHOOK_URL_ALREADY_EXISTS') {
      console.log('\n📋 Listing existing webhooks...');
      const listResponse = await fetch(`${BASE_URL}/v1/notifications/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const webhooks = await listResponse.json();
      console.log(JSON.stringify(webhooks, null, 2));
    }
    return null;
  }
}

createWebhook().catch(console.error);
