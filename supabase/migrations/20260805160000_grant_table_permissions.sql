-- Grant basic table permissions so RLS can function

-- Grant to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessorial_sops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_document_completions TO authenticated;

-- Grant to service_role (full access)
GRANT ALL ON public.accounts TO service_role;
GRANT ALL ON public.accessorial_sops TO service_role;
GRANT ALL ON public.contacts TO service_role;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.customer_alerts TO service_role;
GRANT ALL ON public.checklist_document_completions TO service_role;
