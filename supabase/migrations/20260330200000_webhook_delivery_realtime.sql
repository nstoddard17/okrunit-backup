-- Enable realtime for webhook delivery log so the deliveries page auto-refreshes
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_delivery_log;
ALTER TABLE webhook_delivery_log REPLICA IDENTITY FULL;
