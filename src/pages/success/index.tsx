import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";

const ConfirmationPage: NextPage = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const confirmPaymentMutation = api.stripe.confirmPayment.useMutation({
    async onSuccess(payment) {
      if (payment) {
        router.push("/?payment=1");
      } else {
        router.push("/?payment=0");
      }
    },
  });

  useEffect(() => {
    if (session_id) {
      confirmPaymentMutation.mutate({ paymentId: `${session_id}` });
    }
  }, [session_id]);
  return <p>Confirmed {session_id}</p>;
};
export default ConfirmationPage;
