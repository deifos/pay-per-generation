import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === 'POST') {

        const stripe = new Stripe(process.env.STRIPEV2_SECRET_KEY!, {
            apiVersion: '2022-11-15',
        });

        try {
            const params: Stripe.Checkout.SessionCreateParams = {
                submit_type: 'pay',
                // payment_method_types: ['card'],
                line_items: [
                    {
                        price: process.env.STRIPE_PRICE_ID,
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                // cancel_url: `${req.headers.origin}/?cancelled_stripe=1&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/success?cancelled=1&session_id={CHECKOUT_SESSION_ID}`,
            }
            const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(params);
            res.status(200).json(checkoutSession)
        } catch (error) {
            console.error('error ', error);
            const errorMessage = error instanceof Error ? error.message : 'Generic Internal server error';
            res.status(500).json({ statusCode: 500, message: errorMessage })
        }
    } else {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
    }
}