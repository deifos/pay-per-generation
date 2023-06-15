import { buffer } from "micro";
import Cors from "micro-cors";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import { api } from "~/utils/api";

const stripe = new Stripe(process.env.STRIPEV2_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

const cors = Cors({ allowMethods: ["POST", "HEAD"] });

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error("webhookHandler Error: ", err);
      res.status(400).send("webhookHandler Error");
      return;
    }

    // Successfully constructed event.
    console.log("✅ Success:", event.id);

    const confirmPaymentMutation = api.stripe.confirmPayment.useMutation({
      // async onSuccess(payment) {
      //     if (payment) {
      //         router.push("/?payment=1");
      //     }
      //     else {
      //         router.push("/?payment=0");
      //     }
      // },
    });

    // Cast event data to Stripe object.
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("💰 PaymentIntent", JSON.stringify(paymentIntent));
      confirmPaymentMutation.mutate({ paymentId: `${paymentIntent.id}` });
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("❌ PaymentIntent failed", JSON.stringify(paymentIntent));
    }
    // else if (event.type === "charge.succeeded") {
    //     const charge = event.data.object as Stripe.Charge;
    //     confirmPaymentMutation.mutate({ paymentId: `${paymentIntent.id}` });

    //     console.log("💵 PaymentIntent", JSON.stringify(charge))
    // }
    else {
      console.warn("🤷‍♀️ Unhandled event type", JSON.stringify(event));
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default cors(webhookHandler as any);
