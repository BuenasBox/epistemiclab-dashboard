begin;

-- Performance: Postgres re-evaluates auth.uid()/auth.role()/is_admin() once
-- per row when called directly inside an RLS policy, even though they are
-- STABLE. Wrapping the call in a scalar subquery, e.g. (select auth.uid()),
-- lets the planner evaluate it once per statement instead. This is the
-- documented Supabase RLS performance pattern:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- No semantic change: same predicates, same access rules.

ALTER POLICY profiles_select_self_or_admin ON public.profiles USING (((id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY profiles_update_self_or_admin ON public.profiles USING (((id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY access_grants_select_self_or_admin ON public.access_grants USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY access_grants_admin_insert ON public.access_grants WITH CHECK ((select is_admin()));
ALTER POLICY access_grants_admin_update ON public.access_grants USING ((select is_admin())) WITH CHECK ((select is_admin()));
ALTER POLICY access_grants_admin_delete ON public.access_grants USING ((select is_admin()));
ALTER POLICY learner_profiles_select_self_or_admin ON public.learner_profiles USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learner_profiles_insert_self_or_admin ON public.learner_profiles WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learner_profiles_update_self_or_admin ON public.learner_profiles USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learning_events_select_self_or_admin ON public.learning_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learning_events_insert_self_or_admin ON public.learning_events WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learning_events_update_self_or_admin ON public.learning_events USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY learning_events_delete_self_or_admin ON public.learning_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY weakness_profiles_select_self_or_admin ON public.weakness_profiles USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY weakness_profiles_insert_self_or_admin ON public.weakness_profiles WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY weakness_profiles_update_self_or_admin ON public.weakness_profiles USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY weakness_profiles_delete_self_or_admin ON public.weakness_profiles USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY open_response_attempts_select_self_or_admin ON public.open_response_attempts USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY open_response_attempts_insert_self_or_admin ON public.open_response_attempts WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY auth_read_or ON public.or_bank USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY open_response_attempts_update_self_or_admin ON public.open_response_attempts USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY open_response_attempts_delete_self_or_admin ON public.open_response_attempts USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY user_metrics_select_self_or_admin ON public.user_metrics USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY user_metrics_insert_self_or_admin ON public.user_metrics WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY user_metrics_update_self_or_admin ON public.user_metrics USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY access_audit_select_self_or_admin ON public.access_audit_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY access_audit_insert_authenticated ON public.access_audit_events WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY upgrade_requests_select_owner_or_admin ON public.upgrade_requests USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY upgrade_requests_insert_owner ON public.upgrade_requests WITH CHECK (((user_id = (select auth.uid())) AND (status = 'pending'::text) AND (reviewed_at IS NULL) AND (reviewed_by IS NULL) AND (current_plan = ( SELECT ag.plan
   FROM access_grants ag
  WHERE (ag.user_id = (select auth.uid())))) AND (((current_plan = 'demo'::text) AND (requested_plan = ANY (ARRAY['premium'::text, 'full_access'::text]))) OR ((current_plan = 'premium'::text) AND (requested_plan = 'full_access'::text)))));
ALTER POLICY upgrade_requests_update_admin ON public.upgrade_requests USING ((select is_admin())) WITH CHECK ((select is_admin()));
ALTER POLICY access_codes_admin_select ON public.access_codes USING ((select is_admin()));
ALTER POLICY access_codes_admin_insert ON public.access_codes WITH CHECK (((select is_admin()) AND (created_by = (select auth.uid()))));
ALTER POLICY access_codes_admin_update ON public.access_codes USING ((select is_admin())) WITH CHECK ((select is_admin()));
ALTER POLICY auth_read_sba ON public.sba_bank USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY auth_read_mentor ON public.mentor_config USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY auth_read_misconceptions ON public.misconceptions USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY auth_read_distinction ON public.distinction_patterns USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY sat_attempts_select_self_or_admin ON public.sat_attempts USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY sat_attempts_insert_self_or_admin ON public.sat_attempts WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY sat_attempts_update_self_or_admin ON public.sat_attempts USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY sat_attempts_delete_self_or_admin ON public.sat_attempts USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_profiles_select_self_or_admin ON public.epistemic_profiles USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_profiles_insert_self_or_admin ON public.epistemic_profiles WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_profiles_update_self_or_admin ON public.epistemic_profiles USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_events_select_self_or_admin ON public.epistemic_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_events_insert_self_or_admin ON public.epistemic_events WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY epistemic_event_links_select_self_or_admin ON public.epistemic_event_links USING ((EXISTS ( SELECT 1
   FROM epistemic_events e
  WHERE ((e.id = epistemic_event_links.epistemic_event_id) AND ((e.user_id = (select auth.uid())) OR (select is_admin()))))));
ALTER POLICY epistemic_event_links_insert_self_or_admin ON public.epistemic_event_links WITH CHECK ((EXISTS ( SELECT 1
   FROM epistemic_events e
  WHERE ((e.id = epistemic_event_links.epistemic_event_id) AND ((e.user_id = (select auth.uid())) OR (select is_admin()))))));
ALTER POLICY ep04_learning_session_events_select_self_or_admin ON public.ep04_learning_session_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_learning_session_events_insert_self_or_admin ON public.ep04_learning_session_events WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_achievement_events_select_self_or_admin ON public.ep04_achievement_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_achievement_events_insert_self_or_admin ON public.ep04_achievement_events WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_notification_events_select_self_or_admin ON public.ep04_notification_events USING (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_notification_events_insert_self_or_admin ON public.ep04_notification_events WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));
ALTER POLICY ep04_notification_events_update_self_or_admin ON public.ep04_notification_events USING (((user_id = (select auth.uid())) OR (select is_admin()))) WITH CHECK (((user_id = (select auth.uid())) OR (select is_admin())));

commit;
