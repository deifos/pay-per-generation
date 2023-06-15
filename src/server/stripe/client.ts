import { Stripe, loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPEV2_PUBLIC_KEY!, { apiVersion: "2022-11-15" });
    }
    return stripePromise;
};

export default getStripe;