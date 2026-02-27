--
-- PostgreSQL database dump
--

\restrict JYEdtSfrRCcypHDrkZmGSqKu13nA4RFTw2Avl8TxFW1td4au8OsA4qYLTqua9Hg

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text,
    oauth_provider text,
    oauth_id text,
    role text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone text,
    location text,
    updated_at timestamp without time zone DEFAULT now(),
    is_first_login boolean DEFAULT true,
    last_password_change timestamp without time zone,
    temp_password text,
    email_verified boolean DEFAULT false,
    verification_token text,
    assigned_routes integer[],
    created_by integer,
    last_seen timestamp without time zone,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['ADMIN'::text, 'BUS_SCHEDULER'::text, 'USER'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.is_first_login; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.is_first_login IS 'True if user has not changed password after account creation';


--
-- Name: COLUMN users.temp_password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.temp_password IS 'Temporary password hash sent via email';


--
-- Name: COLUMN users.email_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.email_verified IS 'True if user has verified their email';


--
-- Name: COLUMN users.verification_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.verification_token IS 'Token for email verification';


--
-- Name: COLUMN users.assigned_routes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.assigned_routes IS 'Array of route IDs assigned to this scheduler';


--
-- Name: COLUMN users.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.created_by IS 'Admin user who created this account';


--
-- Name: COLUMN users.last_seen; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_seen IS 'Last time user was active in the system';


--
-- Name: active_schedulers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_schedulers AS
 SELECT u.id,
    u.name,
    u.email,
    u.phone,
    u.is_active,
    u.is_first_login,
    u.email_verified,
    u.assigned_routes,
    u.created_at,
    u.last_password_change,
    u.last_seen,
    creator.name AS created_by_name
   FROM (public.users u
     LEFT JOIN public.users creator ON ((u.created_by = creator.id)))
  WHERE (u.role = 'BUS_SCHEDULER'::text)
  ORDER BY u.created_at DESC;


ALTER VIEW public.active_schedulers OWNER TO postgres;

--
-- Name: eta_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eta_cache (
    service_id integer NOT NULL,
    last_calculated timestamp without time zone NOT NULL,
    eta_minutes integer NOT NULL,
    confidence text NOT NULL
);


ALTER TABLE public.eta_cache OWNER TO postgres;

--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id integer NOT NULL,
    name text,
    lat double precision,
    lng double precision
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.places_id_seq OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: route_geometry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.route_geometry (
    route_id integer NOT NULL,
    geometry jsonb NOT NULL,
    distance_km double precision NOT NULL
);


ALTER TABLE public.route_geometry OWNER TO postgres;

--
-- Name: routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routes (
    id integer NOT NULL,
    route_no text NOT NULL,
    from_place_id integer NOT NULL,
    to_place_id integer NOT NULL,
    distance_km integer
);


ALTER TABLE public.routes OWNER TO postgres;

--
-- Name: routes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.routes_id_seq OWNER TO postgres;

--
-- Name: routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.routes_id_seq OWNED BY public.routes.id;


--
-- Name: scheduler_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduler_audit_log (
    id integer NOT NULL,
    scheduler_id integer NOT NULL,
    action text NOT NULL,
    details jsonb,
    ip_address text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.scheduler_audit_log OWNER TO postgres;

--
-- Name: scheduler_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scheduler_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheduler_audit_log_id_seq OWNER TO postgres;

--
-- Name: scheduler_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scheduler_audit_log_id_seq OWNED BY public.scheduler_audit_log.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    route_id integer NOT NULL,
    departure_time time without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: routes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes ALTER COLUMN id SET DEFAULT nextval('public.routes_id_seq'::regclass);


--
-- Name: scheduler_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduler_audit_log ALTER COLUMN id SET DEFAULT nextval('public.scheduler_audit_log_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: eta_cache eta_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eta_cache
    ADD CONSTRAINT eta_cache_pkey PRIMARY KEY (service_id);


--
-- Name: places places_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_name_key UNIQUE (name);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: route_geometry route_geometry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route_geometry
    ADD CONSTRAINT route_geometry_pkey PRIMARY KEY (route_id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: routes routes_route_no_from_place_id_to_place_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_route_no_from_place_id_to_place_id_key UNIQUE (route_no, from_place_id, to_place_id);


--
-- Name: scheduler_audit_log scheduler_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduler_audit_log
    ADD CONSTRAINT scheduler_audit_log_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_created ON public.scheduler_audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_scheduler; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_scheduler ON public.scheduler_audit_log USING btree (scheduler_id);


--
-- Name: idx_users_email_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified);


--
-- Name: idx_users_is_first_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_first_login ON public.users USING btree (is_first_login);


--
-- Name: idx_users_last_seen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_seen ON public.users USING btree (last_seen);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: eta_cache fk_eta_service; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eta_cache
    ADD CONSTRAINT fk_eta_service FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: routes fk_from_place; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT fk_from_place FOREIGN KEY (from_place_id) REFERENCES public.places(id);


--
-- Name: route_geometry fk_geometry_route; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route_geometry
    ADD CONSTRAINT fk_geometry_route FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: services fk_route; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT fk_route FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: routes fk_to_place; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT fk_to_place FOREIGN KEY (to_place_id) REFERENCES public.places(id);


--
-- Name: users fk_users_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: scheduler_audit_log scheduler_audit_log_scheduler_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduler_audit_log
    ADD CONSTRAINT scheduler_audit_log_scheduler_id_fkey FOREIGN KEY (scheduler_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JYEdtSfrRCcypHDrkZmGSqKu13nA4RFTw2Avl8TxFW1td4au8OsA4qYLTqua9Hg

