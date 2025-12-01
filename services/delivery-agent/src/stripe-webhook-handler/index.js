const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const sgMail = require('@sendgrid/mail');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const app = express();
const firestore = new Firestore();

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Stripe requires the raw body for signature verification
app.use(express.raw({ type: 'application/json' }));

app.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await handleCheckoutSession(session);
  }

  res.json({ received: true });
});

async function handleCheckoutSession(session) {
  const userId = session.customer || session.client_reference_id;
  const email = session.customer_details ? session.customer_details.email : null;

  if (!userId) {
    console.warn('No userId (customer or client_reference_id) found in session');
    return;
  }

  const userRef = firestore.collection('users').doc(userId);

  try {
    // Idempotency Check
    const doc = await userRef.get();
    if (doc.exists) {
      console.log(`User ${userId} already exists. Skipping creation.`);
      return;
    }

    // User Creation
    await userRef.set({
      activationStatus: 'signed_up',
      signupDate: new Date().toISOString(), // Use simple ISO string to avoid mocking issues if needed, or rely on Timestamp
      email: email
    });

    console.log(`User ${userId} provisioned.`);

    // Optional: Send Welcome Email
    if (email && process.env.SENDGRID_API_KEY) {
        await sendWelcomeEmail(email);
    }

  } catch (error) {
    console.error(`Error processing user ${userId}:`, error);
  }
}

async function sendWelcomeEmail(email) {
    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com', // Configured via env var
        subject: 'Welcome to Delivery Agent',
        text: 'Welcome! Your account has been created.',
        html: '<strong>Welcome! Your account has been created.</strong>',
    };
    try {
        await sgMail.send(msg);
        console.log('Welcome email sent');
    } catch (error) {
        console.error('Error sending welcome email', error);
    }
}

const port = process.env.PORT || 8080;
if (require.main === module) {
    app.listen(port, () => {
      console.log(`Stripe webhook handler listening on port ${port}`);
    });
}

module.exports = { app, handleCheckoutSession }; // Export for testing
