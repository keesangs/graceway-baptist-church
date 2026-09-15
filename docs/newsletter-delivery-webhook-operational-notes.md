# Newsletter Delivery Webhook Operational Notes

## Authoritative References

The Resend webhook verifier must receive the original raw request body because a parsed and re-serialized JSON payload invalidates the cryptographic signature. Verification uses the `svix-id`, `svix-timestamp`, and `svix-signature` headers with the webhook signing secret. [Resend: Verify Webhooks Requests](https://resend.com/docs/webhooks/verify-webhooks-requests)

Resend identifies permanent recipient rejection with the `email.bounced` event. The event data includes a provider `email_id`, recipient list, event timestamp, and bounce details; the application should suppress the related newsletter subscriber without retaining the full provider payload. [Resend: email.bounced](https://resend.com/docs/webhooks/emails/bounced)

Resend webhook delivery is at-least-once and events may arrive out of order. The application therefore stores the unique `svix-id` as `providerEventId`, ignores duplicate deliveries, and compares the provider event timestamp before overwriting a recipient delivery status. [Resend: Managing Webhooks](https://resend.com/docs/webhooks/introduction)
