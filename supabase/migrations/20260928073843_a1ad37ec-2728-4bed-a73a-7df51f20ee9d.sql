CREATE TYPE public.app_role AS ENUM ('admin','member','viewer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  team text NOT NULL DEFAULT 'Bolide',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_active(_user_id)
     AND (public.has_role(_user_id,'admin') OR public.has_role(_user_id,'member'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_active(_user_id) AND public.has_role(_user_id,'admin');
$$;

CREATE POLICY "profiles readable by signed-in users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.is_active(auth.uid()))
  WITH CHECK (id = auth.uid() AND is_active = true);
CREATE POLICY "admins manage profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "roles readable by signed-in users" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND user_id <> auth.uid());
CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) AND user_id <> auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) AND user_id <> auth.uid());
CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()) AND user_id <> auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, team)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'team','Bolide')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(COALESCE(NEW.email,'')) = 'khudu.pitje@newgx.co.za'
                       THEN 'admin'::public.app_role ELSE 'member'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.leads (
  id text PRIMARY KEY,
  business_name text NOT NULL,
  brand text,
  industry text NOT NULL,
  township text NOT NULL,
  suburb text,
  address text,
  standalone boolean,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  contact_person text,
  owner_operator text,
  energy_profile text,
  notes text,
  source_url text,
  electricity_provider text,
  water_provider text,
  utility_confidence text,
  utility_rule text,
  utility_source text,
  utility_confirmed text,
  rooftop_solar text NOT NULL DEFAULT 'unknown',
  roof_area_m2 numeric,
  marketing_consent timestamptz,
  status text NOT NULL DEFAULT 'New',
  owner_user uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  score int,
  tier text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active users read leads" ON public.leads FOR SELECT TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "editors insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "editors update leads" ON public.leads FOR UPDATE TO authenticated USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "admins delete leads" ON public.leads FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX leads_township_idx ON public.leads (township);
CREATE INDEX leads_status_idx ON public.leads (status);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activity TO authenticated;
GRANT ALL ON public.lead_activity TO service_role;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active users read activity" ON public.lead_activity FOR SELECT TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "editors insert activity" ON public.lead_activity FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "admins delete activity" ON public.lead_activity FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX lead_activity_lead_idx ON public.lead_activity (lead_id, created_at DESC);

CREATE TABLE public.lead_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_photos TO authenticated;
GRANT ALL ON public.lead_photos TO service_role;
ALTER TABLE public.lead_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active users read photos" ON public.lead_photos FOR SELECT TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "editors insert photos" ON public.lead_photos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "admins delete photos" ON public.lead_photos FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.utility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  township text NOT NULL,
  suburb_or_zone text NOT NULL DEFAULT '*',
  electricity_provider text,
  water_provider text,
  confidence text,
  source_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utility_rules TO authenticated;
GRANT ALL ON public.utility_rules TO service_role;
ALTER TABLE public.utility_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active users read utility rules" ON public.utility_rules FOR SELECT TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "admins write utility rules" ON public.utility_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.utility_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utility text NOT NULL,
  tariff_increase text,
  reliability text,
  sseg_rules text,
  verify_how text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utility_context TO authenticated;
GRANT ALL ON public.utility_context TO service_role;
ALTER TABLE public.utility_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active users read utility context" ON public.utility_context FOR SELECT TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "admins write utility context" ON public.utility_context FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_activity REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activity;

CREATE POLICY "active users read site photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-photos' AND public.is_active(auth.uid()));
CREATE POLICY "editors upload site photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-photos' AND public.can_edit(auth.uid()));
CREATE POLICY "admins delete site photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-photos' AND public.is_admin(auth.uid()));