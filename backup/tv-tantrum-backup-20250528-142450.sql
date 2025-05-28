--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

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

--
-- Name: sync_review_rating(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.sync_review_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- When a review is added, also add or update the user rating
  -- Use direct user_id when available, otherwise look up by username
  INSERT INTO user_tv_ratings (
    user_id, 
    tv_show_id, 
    rating, 
    rated_at
  ) 
  VALUES (
    COALESCE(NEW.user_id, (SELECT id FROM users WHERE username = NEW.user_name)),
    NEW.tv_show_id,
    NEW.rating,
    NEW.created_at
  )
  ON CONFLICT (user_id, tv_show_id) 
  DO UPDATE SET 
    rating = NEW.rating,
    rated_at = NEW.created_at;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_review_rating() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applied_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.applied_migrations (
    id integer NOT NULL,
    migration_name text NOT NULL,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.applied_migrations OWNER TO neondb_owner;

--
-- Name: applied_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.applied_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applied_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: applied_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.applied_migrations_id_seq OWNED BY public.applied_migrations.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tv_show_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    show_name text
);


ALTER TABLE public.favorites OWNER TO neondb_owner;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO neondb_owner;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: platforms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.platforms (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.platforms OWNER TO neondb_owner;

--
-- Name: platforms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.platforms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platforms_id_seq OWNER TO neondb_owner;

--
-- Name: platforms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.platforms_id_seq OWNED BY public.platforms.id;


--
-- Name: research_summaries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.research_summaries (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    summary text,
    full_text text,
    source character varying(255),
    published_date text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    category text NOT NULL,
    image_url text,
    updated_at timestamp without time zone DEFAULT now(),
    original_url text,
    headline text,
    sub_headline text,
    key_findings text
);


ALTER TABLE public.research_summaries OWNER TO neondb_owner;

--
-- Name: research_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.research_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.research_summaries_id_seq OWNER TO neondb_owner;

--
-- Name: research_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.research_summaries_id_seq OWNED BY public.research_summaries.id;


--
-- Name: review_upvotes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.review_upvotes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    review_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_upvotes OWNER TO neondb_owner;

--
-- Name: review_upvotes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.review_upvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_upvotes_id_seq OWNER TO neondb_owner;

--
-- Name: review_upvotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.review_upvotes_id_seq OWNED BY public.review_upvotes.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid text NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: show_submissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.show_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    show_name character varying(255) NOT NULL,
    description text,
    suggested_age_range character varying(50),
    suggested_themes text[],
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.show_submissions OWNER TO neondb_owner;

--
-- Name: show_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.show_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.show_submissions_id_seq OWNER TO neondb_owner;

--
-- Name: show_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.show_submissions_id_seq OWNED BY public.show_submissions.id;


--
-- Name: themes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.themes (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.themes OWNER TO neondb_owner;

--
-- Name: themes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.themes_id_seq OWNER TO neondb_owner;

--
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.themes_id_seq OWNED BY public.themes.id;


--
-- Name: tv_show_platforms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_show_platforms (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    platform_id integer NOT NULL
);


ALTER TABLE public.tv_show_platforms OWNER TO neondb_owner;

--
-- Name: tv_show_platforms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_show_platforms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_show_platforms_id_seq OWNER TO neondb_owner;

--
-- Name: tv_show_platforms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_show_platforms_id_seq OWNED BY public.tv_show_platforms.id;


--
-- Name: tv_show_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_show_reviews (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    user_name text NOT NULL,
    rating integer NOT NULL,
    review text NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    show_name text
);


ALTER TABLE public.tv_show_reviews OWNER TO neondb_owner;

--
-- Name: tv_show_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_show_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_show_reviews_id_seq OWNER TO neondb_owner;

--
-- Name: tv_show_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_show_reviews_id_seq OWNED BY public.tv_show_reviews.id;


--
-- Name: tv_show_searches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_show_searches (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    search_count integer DEFAULT 1 NOT NULL,
    last_searched timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tv_show_searches OWNER TO neondb_owner;

--
-- Name: tv_show_searches_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_show_searches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_show_searches_id_seq OWNER TO neondb_owner;

--
-- Name: tv_show_searches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_show_searches_id_seq OWNED BY public.tv_show_searches.id;


--
-- Name: tv_show_themes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_show_themes (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    theme_id integer NOT NULL
);


ALTER TABLE public.tv_show_themes OWNER TO neondb_owner;

--
-- Name: tv_show_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_show_themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_show_themes_id_seq OWNER TO neondb_owner;

--
-- Name: tv_show_themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_show_themes_id_seq OWNED BY public.tv_show_themes.id;


--
-- Name: tv_show_views; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_show_views (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    view_count integer DEFAULT 1 NOT NULL,
    last_viewed timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tv_show_views OWNER TO neondb_owner;

--
-- Name: tv_show_views_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_show_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_show_views_id_seq OWNER TO neondb_owner;

--
-- Name: tv_show_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_show_views_id_seq OWNED BY public.tv_show_views.id;


--
-- Name: tv_shows; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tv_shows (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    age_range text NOT NULL,
    episode_length integer NOT NULL,
    creator text,
    release_year integer,
    end_year integer,
    is_ongoing boolean DEFAULT true,
    seasons integer,
    stimulation_score integer NOT NULL,
    interactivity_level text,
    dialogue_intensity text,
    sound_effects_level text,
    music_tempo text,
    total_music_level text,
    total_sound_effect_time_level text,
    scene_frequency text,
    creativity_rating integer,
    available_on text[],
    themes text[],
    animation_style text,
    image_url text,
    subscriber_count text,
    video_count text,
    channel_id text,
    is_youtube_channel boolean DEFAULT false,
    published_at text,
    has_omdb_data boolean DEFAULT false,
    has_youtube_data boolean DEFAULT false,
    is_featured boolean DEFAULT false
);


ALTER TABLE public.tv_shows OWNER TO neondb_owner;

--
-- Name: tv_shows_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tv_shows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tv_shows_id_seq OWNER TO neondb_owner;

--
-- Name: tv_shows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tv_shows_id_seq OWNED BY public.tv_shows.id;


--
-- Name: user_points_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_points_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    points integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reference_id integer
);


ALTER TABLE public.user_points_history OWNER TO neondb_owner;

--
-- Name: user_points_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_points_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_points_history_id_seq OWNER TO neondb_owner;

--
-- Name: user_points_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_points_history_id_seq OWNED BY public.user_points_history.id;


--
-- Name: user_read_research; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_read_research (
    id integer NOT NULL,
    user_id integer NOT NULL,
    research_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_read_research OWNER TO neondb_owner;

--
-- Name: user_read_research_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_read_research_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_read_research_id_seq OWNER TO neondb_owner;

--
-- Name: user_read_research_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_read_research_id_seq OWNED BY public.user_read_research.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false,
    username text NOT NULL,
    country text,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    rank character varying(50) DEFAULT 'TV Watcher'::character varying,
    login_streak integer DEFAULT 0 NOT NULL,
    last_login timestamp without time zone,
    background_color character varying(50) DEFAULT 'bg-purple-500'::character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: youtube_channels; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.youtube_channels (
    id integer NOT NULL,
    tv_show_id integer NOT NULL,
    channel_id text,
    subscriber_count text,
    video_count text,
    published_at text
);


ALTER TABLE public.youtube_channels OWNER TO neondb_owner;

--
-- Name: youtube_channels_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.youtube_channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.youtube_channels_id_seq OWNER TO neondb_owner;

--
-- Name: youtube_channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.youtube_channels_id_seq OWNED BY public.youtube_channels.id;


--
-- Name: applied_migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applied_migrations ALTER COLUMN id SET DEFAULT nextval('public.applied_migrations_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: platforms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platforms ALTER COLUMN id SET DEFAULT nextval('public.platforms_id_seq'::regclass);


--
-- Name: research_summaries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.research_summaries ALTER COLUMN id SET DEFAULT nextval('public.research_summaries_id_seq'::regclass);


--
-- Name: review_upvotes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_upvotes ALTER COLUMN id SET DEFAULT nextval('public.review_upvotes_id_seq'::regclass);


--
-- Name: show_submissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.show_submissions ALTER COLUMN id SET DEFAULT nextval('public.show_submissions_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


--
-- Name: tv_show_platforms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_platforms ALTER COLUMN id SET DEFAULT nextval('public.tv_show_platforms_id_seq'::regclass);


--
-- Name: tv_show_reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_reviews ALTER COLUMN id SET DEFAULT nextval('public.tv_show_reviews_id_seq'::regclass);


--
-- Name: tv_show_searches id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_searches ALTER COLUMN id SET DEFAULT nextval('public.tv_show_searches_id_seq'::regclass);


--
-- Name: tv_show_themes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_themes ALTER COLUMN id SET DEFAULT nextval('public.tv_show_themes_id_seq'::regclass);


--
-- Name: tv_show_views id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_views ALTER COLUMN id SET DEFAULT nextval('public.tv_show_views_id_seq'::regclass);


--
-- Name: tv_shows id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_shows ALTER COLUMN id SET DEFAULT nextval('public.tv_shows_id_seq'::regclass);


--
-- Name: user_points_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_points_history ALTER COLUMN id SET DEFAULT nextval('public.user_points_history_id_seq'::regclass);


--
-- Name: user_read_research id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_read_research ALTER COLUMN id SET DEFAULT nextval('public.user_read_research_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: youtube_channels id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.youtube_channels ALTER COLUMN id SET DEFAULT nextval('public.youtube_channels_id_seq'::regclass);


--
-- Data for Name: applied_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.applied_migrations (id, migration_name, applied_at) FROM stdin;
1	001_add_foreign_keys.sql	2025-05-21 14:00:04.16483
2	002_convert_date_fields.sql	2025-05-21 14:00:08.550306
3	003_create_junction_tables.sql	2025-05-21 14:00:16.338005
4	004_separate_youtube_data.sql	2025-05-21 14:00:20.467407
5	005_separate_search_view_tracking.sql	2025-05-21 14:00:24.96662
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.favorites (id, user_id, tv_show_id, created_at, show_name) FROM stdin;
6	8	286	2025-05-22 12:13:18.575841	Tweedy & Fluff
7	8	31	2025-05-22 12:13:47.071084	Bluey 2018-present
8	8	122	2025-05-22 12:14:28.959494	Kiri and Lou
10	7	259	2025-05-25 14:16:05.78433	The Enchanted World of Brambly Hedge
11	7	286	2025-05-25 14:16:10.169961	Tweedy & Fluff
14	7	29	2025-05-26 20:53:45.044482	Blue's Clues (1996-2007)
\.


--
-- Data for Name: platforms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.platforms (id, name) FROM stdin;
1	TV
2	YouTube
\.


--
-- Data for Name: research_summaries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.research_summaries (id, title, summary, full_text, source, published_date, created_at, category, image_url, updated_at, original_url, headline, sub_headline, key_findings) FROM stdin;
53	2-Y/O Learning: Joint Media vs. Passive Viewing	Comparing Two Forms of Joint Media Engagement With Passive Viewing and Learning From 3D" examines how 2-year-old children learn from two-dimensional (2D) media, such as videos, under different conditions. The researchers compared four scenarios:\n\n	The findings revealed that children learned best when they had direct interaction with physical objects (3D learning). Among the 2D media scenarios, those involving active parental support (both JME conditions) led to better learning outcomes compared to passive viewing. This suggests that while direct, hands-on experiences are most effective for learning at this age, engaging with 2D media can also be beneficial, especially when parents actively participate and provide guidance.\n\nIn summary: \n\nFor 2-year-old children, direct interaction with real objects facilitates the most effective learning. However, when engaging with 2D media, active parental involvement enhances learning outcomes compared to passive viewing.	Frontiers in Psychology	2021-01-21	2025-05-23 14:57:55.36746	Learning Outcomes	/research/1748012164444-output(1).png	2025-05-24 10:43:30.415	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/full#h12	2-Y/O Learning: Joint Media vs. Passive Viewing	Learning From 2D Media With and Without Parental Support:  Comparing Two Forms of Joint Media Engagement With Passive Viewing and Learning From 3D.	Passive Viewing: \nChildren watched a video without any interaction.\n\nJoint Media Engagement (JME) with Parental Support: \nChildren watched the video with a parent who actively engaged with them, providing explanations and encouragement.\n\nJME with Parental Support and Additional Scaffolding: \nSimilar to the second scenario, but with parents offering more structured guidance to enhance understanding.\n\nLearning from 3D Interaction: \nChildren learned the same content through direct interaction with physical objects, without any media
56	Media Content for Preschool Children	Modifying Media Content for Preschool Children: A Randomized Controlled Trial" investigates whether altering the content of media consumed by preschool-aged children can influence their behavior, particularly in reducing aggression and enhancing prosocial behavior.	X-Axis:\n\n\n\n\n\nBehavioral categories: 'Externalizing Behaviors' and 'Social Competence'.\n\n\n\nY-Axis:\n\n\n\n\n\nMean scores based on the SCBE assessment.\n\n\n\nBars:\n\n\n\n\n\nTwo bars per category representing the intervention and control groups.\n\n\n\nError bars indicating the 95% confidence intervals.\n\nPopulation:\n\n\n\n\n\n565 parents of preschool-aged children (3 to 5 years) recruited from community pediatric practices.\n\n\n\nMethodology:\n\n\n\n\n\nRandomized controlled trial where parents were guided to replace aggressive media content with high-quality prosocial and educational programming without reducing total screen time.\n\n\n\nBehavioral outcomes were measured using the Social Competence and Behavior Evaluation (SCBE) at 6 and 12 months.\n\nImplications:\n\nThe findings suggest that modifying the content of media consumed by preschool children, emphasizing prosocial and educational programming, can lead to behavioral improvements, particularly in reducing aggression and enhancing social competence. This approach offers a viable strategy for parents and educators to positively influence child behavior without necessitating a reduction in overall screen time.	Pediatrics Online	2013-03-01	2025-05-24 10:37:23.945321	Social Development	/research/1748082989410-Untitled-3.png	2025-05-24 10:37:23.945321	https://publications.aap.org/pediatrics/article-abstract/131/3/431/30939/Modifying-Media-Content-for-Preschool-Children-A?redirectedFrom=fulltext&utm_source=chatgpt.com?autologincheck=redirected	Media Content for Preschool Children	\N	Behavioral Improvements:\n\n\n\n\n\nChildren in the intervention group exhibited a significant improvement in overall behavior scores at 6 months compared to the control group.\n\n\n\nNotable enhancements were observed in externalizing behaviors (e.g., reduced aggression) and social competence.\n\n\n\nSustained Effects:\n\n\n\n\n\nWhile the positive effects persisted at 12 months, the statistical significance for externalizing behaviors diminished, suggesting a need for ongoing reinforcement.\n\n\n\nSubgroup Analysis:\n\n\n\n\n\nLow-income boys derived the greatest benefit from the intervention, indicating the potential for targeted strategies in specific demographics.
57	Language Disorders and Screen Exposure	The study highlights the potential risks of screen exposure on children's language development, emphasizing the need for better parental interaction and public health guidelines to mitigate these effects.	Population:\n\n\n\n\n\n167 children diagnosed with primary language disorders and 109 controls without language disorders.\n\n\n\nParticipants were aged between 3.5 and 6.5 years and were selected from 24 towns in Ille-et-Vilaine, France.\n\n\n\nMethodology:\n\n\n\n\n\nParental questionnaires collected data on screen exposure, socio-demographic variables, and parental interactions.\n\n\n\nData was analyzed using logistic regression to calculate adjusted odds ratios (aOR).\n\n\n\nReferences:\n\n\n\n\n\nThe study cites 30 references, reviewing existing literature on screen exposure and language development.\n\n\n\nDates:\n\n\n\n\n\nParticipants were born between 2010 and 2012. Data collection occurred between July and October 2016.\n\nImplications:\n\nThe findings suggest that both the timing of screen exposure and the quality of parental interaction significantly impact language development. Health professionals should educate parents about limiting screen time and engaging children in discussions about screen content.	ACTA PAEDIATRICA	2018-11-06	2025-05-24 10:42:15.845105	Learning Outcomes	/research/1748083242250-output(4).png	2025-05-24 10:42:15.845105	https://www.researchgate.net/publication/328873272_Case_control_study_found_that_primary_language_disorders_were_associated_to_screen_exposure_at_35-65_years_of_age	Case–Control Study on Primary Language Disorders and Screen Exposure	\N	Morning Screen Exposure: Children exposed to screens in the morning before nursery or school were three times more likely to develop primary language disorders.\n\n\n\nLack of Parental Discussion: Rarely or never discussing screen content with parents doubled the risk of language problems.\n\n\n\nCumulative Effect: Combining morning screen exposure with a lack of parental discussion made children six times more likely to develop primary language disorders.
54	Learning Between 2D and 3D Sources During Infancy	\nInfants' ability to transfer learning between 2D and 3D contexts is crucial for their cognitive development. Understanding how these early interactions shape learning can inform educational practices and parental guidance on media usage.	X-Axis:\n\n\n\n\n\nRepresents Age Groups of the infants (6-12 months, 12-24 months, and 24-36 months).\n\n\n\nThis axis categorizes the infants into three developmental stages.\n\nY-Axis:\n\n\n\n\n\nRepresents Learning Effectiveness Scores (%).\n\n\n\nThis axis shows the percentage effectiveness of learning in different contexts (2D Videos and 3D Real-World Interactions).\n\n\n\nHigher percentages indicate better learning outcomes for the given category.\n\nPopulation:\n\nInfants aged 6 months to 3 years.\n\nMethodology:\n\nExperimental studies evaluated how infants replicated actions or recognized objects learned from videos and real-world interactions.\n\nParental engagement was manipulated to assess its impact on learning transfer.\n\nImplications:\n\nThe findings emphasize the importance of minimizing passive screen time for infants and encouraging interactive learning environments. Parents can enhance learning transfer by co-viewing media with their children and linking screen content to real-world experiences.\n	PubMed Central	2010-06-01	2025-05-23 15:25:22.55214	Learning Outcomes	/research/1748013917739-Untitled-2.png	2025-05-24 10:44:16.906	https://pmc.ncbi.nlm.nih.gov/articles/PMC2885850/	Learning Between 2D and 3D Sources During Infancy	The study explores how infants learn from two-dimensional (2D) representations, such as videos, and apply this knowledge to three-dimensional (3D) real-world scenarios.	Video Deficit Effect:\n\nInfants learn less effectively from 2D sources compared to real-world 3D interactions, particularly before 2.5 years of age.\n\nDevelopmental Trends:\n\nThe ability to transfer knowledge from 2D to 3D improves with age, with notable advancements after 2 years.\n\nEnhancing Learning:\n\nParental engagement, such as co-viewing and pointing out real-world applications of media content, improves infants' ability to bridge the gap between 2D and 3D learning.
58	Development of Brain & Verbal Intelligence	Understanding the long-term effects of frequent internet use during childhood is crucial, given the increasing integration of digital technology into daily life. This study provides insights into how internet usage may influence cognitive development and brain structure maturation.	Population: \nThe study analyzed a large sample of children from the general population, with a mean age of 11.2 years (ranging from 5.7 to 18.4 years).\n\n\n\nAssessment Methods: \nInternet usage frequency was self-reported by participants. Verbal intelligence was measured using standardized tests, and brain structures were assessed through magnetic resonance imaging (MRI) at the study's onset and after approximately three years.\n\n\n\nReferences: \nThe study cites 45 references, indicating a comprehensive review of existing literature.\n\n\n\nDates: \nData collection occurred over a period of approximately three years, with initial assessments and follow-ups conducted within this timeframe.\n\nImplications:\n\nThe findings suggest that frequent internet use during critical developmental periods may negatively impact verbal intelligence and brain maturation. These results underscore the importance of monitoring and potentially moderating children's internet usage to support healthy cognitive and neural development.\n	PubMed Central	2018-06-30	2025-05-24 10:48:21.631667	Learning Outcomes	/research/1748083654390-Untitled.png	2025-05-24 10:48:21.631667	https://pmc.ncbi.nlm.nih.gov/articles/PMC6866412/	Development of Brain & Verbal Intelligence	Impact of Frequency of Internet Use on Development of Brain Structures and Verbal Intelligence: Longitudinal Analyses" investigates how varying levels of internet usage affect brain development and verbal intelligence in children over time.	Decreased Verbal Intelligence: \nChildren with higher frequencies of internet use exhibited a decline in verbal intelligence over a few years.\n\n\n\nReduced Brain Volume Growth: \nIncreased internet use was associated with smaller increases in both gray and white matter volumes in various brain regions, including those related to language processing, attention, executive functions, emotion, and reward.
59	Videogames & Brain’s Microstructural Properties	The study aims to understand the neural consequences of frequent videogame play, focusing on its potential negative impacts on verbal intelligence and brain microstructure development.	X-Axis: \nCategories showing gaming frequency (Non-Gamers, Moderate Gamers, Frequent Gamers).\n\n\n\nLeft Y-Axis (Blue): \nDisplays Verbal IQ Scores decreasing with higher gaming frequency.\n\n\n\nRight Y-Axis (Orange): \nDisplays Mean Diffusivity (MD) values increasing with higher gaming frequency.\n\nPopulation:\n\n\n\n\n\n240 participants (114 boys, 126 girls) aged 5.7 to 18.4 years for cross-sectional analysis.\n\n\n\n189 participants for longitudinal analysis, with follow-up after 3 years.\n\n\n\nMethodology:\n\n\n\n\n\nDiffusion tensor imaging (DTI) assessed changes in brain microstructure.\n\n\n\nCognitive abilities, including verbal IQ, were measured using standardized intelligence tests.\n\n\n\nReferences:\n\n\n\n\n\nThe study cites 48 references, providing a comprehensive literature review.\n\n\n\nDates:\n\n\n\n\n\nData collection occurred from 2012 to 2015.\n\nImplications:\n\nThe findings suggest that excessive videogame play may hinder neural development and verbal intelligence. This highlights the need for moderation in gaming and consideration of its potential long-term effects on children's cognitive and brain health.	Molecular Psychiatry 	2016-01-05	2025-05-24 10:51:54.888336	Media Effects	/research/1748083887081-this.png	2025-05-24 10:51:54.888336	https://www.researchgate.net/publication/289489574_Impact_of_videogame_play_on_the_brain's_microstructural_properties_cross-sectional_and_longitudinal_analyses	Videogames & Brain’s Microstructural Properties	Impact of Videogame Play on the Brain’s Microstructural Properties: Cross-Sectional and Longitudinal Analyses" investigates how prolonged videogame play affects brain microstructure and verbal intelligence over time, using advanced imaging techniques.	Increased Mean Diffusivity (MD):\n\n\n\n\n\nVideogame play was associated with increased MD in several brain regions, including the left frontal cortex, thalamus, and hippocampus.\n\n\n\nHigher MD in these areas was linked to lower intelligence scores, particularly verbal intelligence.\n\n\n\nNegative Impact on Verbal Intelligence:\n\n\n\n\n\nBoth cross-sectional and longitudinal analyses revealed a decline in verbal IQ correlated with prolonged videogame play.\n\n\n\nThe decline in verbal intelligence persisted over a three-year period.\n\n\n\nChanges in Brain Microstructure:\n\n\n\n\n\nIncreased MD was observed in areas involved in memory, motivation, and verbal processing, suggesting delayed neural development.
60	Screen Time and Temperamental Anger During COVID	During the COVID-19 pandemic, children's screen time increased due to lockdowns and limited social interactions. Understanding how this rise in screen exposure affects emotional development, particularly temperamental anger and frustration, is crucial for guiding post-pandemic parenting practices and media consumption guidelines.	X-Axis:\n\n\n\n\n\nAge points: '3.5 years' and '4.5 years'.\n\n\n\nLeft Y-Axis:\n\n\n\n\n\nAverage daily screen time in hours.\n\n\n\nRight Y-Axis:\n\n\n\n\n\nAnger/frustration scores (arbitrary units).\n\n\n\nBars and Line:\n\n\n\n\n\nBars represent screen time; line represents anger/frustration scores.\n\nPopulation:\n\n\n\n\n\n315 Canadian preschool-aged children.\n\n\n\nMethodology:\n\n\n\n\n\nParent-reported measures of children's daily screen time and temperamental anger/frustration at ages 3.5 and 4.5 years.\n\n\n\nCross-lagged panel model analysis to assess bidirectional associations.\n\nImplications:\n\nThe findings suggest that increased screen time in preschoolers may hinder the development of emotional regulation, leading to heightened expressions of anger and frustration. Health practitioners should discuss media use habits with parents during well-child visits to promote healthy emotional development in young children.	Pediatric Research	2023-02-09	2025-05-24 10:55:09.071864	Social Development	/research/1748084044407-Untitled-4.png	2025-05-24 10:55:09.071864	https://www.nature.com/articles/s41390-023-02485-6	Screen Time and Temperamental Anger During COVID	"Preschooler Screen Time and Temperamental Anger/Frustration During the COVID-19 Pandemic" examines the relationship between screen time in preschool-aged children and subsequent expressions of anger and frustration.	Continuity in Behaviors:\n\n\n\n\n\nScreen time at 3.5 years was strongly correlated with screen time at 4.5 years (β = 0.68).\n\n\n\nTemperamental anger/frustration at 3.5 years persisted at 4.5 years (β = 0.60).\n\n\n\nPredictive Relationship:\n\n\n\n\n\nHigher screen time at 3.5 years predicted increased anger/frustration at 4.5 years (β = 0.14).\n\n\n\nAnger/frustration at 3.5 years did not predict increased screen time at 4.5 years.
61	Screen-time inattention problems preschoolers	With the increasing prevalence of digital devices, young children are spending more time in front of screens. Understanding the impact of screen time on early childhood development, especially concerning attention-related behaviors, is crucial for establishing appropriate guidelines and interventions.	X-Axis:\n\n\n\n\n\nDaily screen time categories: '<30 mins/day', '30 mins - 2 hrs/day', '>2 hrs/day'.\n\n\n\nY-Axis:\n\n\n\n\n\nOdds ratio for inattention, with '<30 mins/day' as the reference category (odds ratio = 1).\n\n\n\nBars:\n\n\n\n\n\nDifferent colors represent each screen time category.\n\nPopulation:\n\n\n\n\n\n2,322 children from the Canadian Healthy Infant Longitudinal Development (CHILD) study.\n\n\n\nMethodology:\n\n\n\n\n\nParental reports of children's screen time at ages 3 and 5.\n\n\n\nBehavioral assessments at age 5 using the Child Behavior Checklist (CBCL).\n\nImplications:\n\nThe findings suggest that excessive screen time in preschoolers is associated with a higher risk of attention problems and behavioral issues. Limiting screen time and promoting participation in organized physical activities may be beneficial strategies for parents and caregivers to support healthy behavioral development in young children.	PLoS ONE	2019-04-17	2025-05-24 10:58:55.901644	Cognitive Development	/research/1748084237938-Untitled-5.png	2025-05-24 10:58:55.901644	https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0213995	Screen-time inattention problems preschoolers	"Screen-time is associated with inattention problems in preschoolers: Results from the CHILD birth cohort study" examines the relationship between screen time and behavioral issues, particularly inattention, in preschool-aged children.	Prevalence of Screen Time:\n\n\n\n\n\nAt 3 years of age, children averaged 1.5 hours of screen time per day.\n\n\n\nBy 5 years of age, the average was 1.4 hours per day.\n\n\n\nAssociation with Inattention:\n\n\n\n\n\nChildren exposed to more than 2 hours of screen time per day were over five times more likely to exhibit clinically significant externalizing behavior problems, including inattention.\n\n\n\nThese children were also nearly six times more likely to meet criteria for attention-deficit/hyperactivity disorder (ADHD).\n\n\n\nProtective Factors:\n\n\n\n\n\nParticipation in organized sports was associated with a lower likelihood of behavioral problems, suggesting that structured physical activity may mitigate some negative effects of excessive screen time.
62	Behaviour Depending on Scene Pace	Understanding the impact of media editing pace on young children's behavior is crucial for developing guidelines that promote healthy attention spans and interaction patterns.	Fast-Paced Film: \nChildren played with an average of 8 toys after viewing a film with 102 camera cuts and 16 still images.\n\n\n\nSlow-Paced Film: \nChildren played with an average of 5 toys after viewing a film with 22 camera cuts and 4 still images.\n\nPopulation: \nThe study involved 70 children (36 girls) aged between 2 and 4.5 years from preschools in Essex, United Kingdom.\n\n\n\nAssessment Methods: \nChildren were paired and exposed to either a fast-paced or slow-paced four-minute film of a narrator reading a children's story. The fast-paced version contained 102 camera cuts and 16 still images, while the slow-paced version had 22 camera cuts and four still images. Each pair participated in two video-recorded free-play sessions, one before and one after viewing the film. The number of different toys each child played with was recorded to assess attention and behavior changes.\n\n\n\nReferences: \nThe study cites 40 references, indicating a comprehensive review of existing literature.\n\n\n\nDates: Data collection occurred during the study period, with specific dates detailed within the full article.\n\nImplications:\n\nThe findings suggest that even brief exposure to fast-paced films can immediately affect young children's behavior, leading to increased attention shifts during play. This underscores the importance for parents and educators to consider the pacing of visual media presented to preschoolers, as it may influence their attention and interaction patterns.	Acta Paediatrica	2017-01-30	2025-05-24 11:02:39.910638	Media Effects	/research/1748084508926-output(6).png	2025-05-24 11:02:39.910638	https://onlinelibrary.wiley.com/doi/10.1111/apa.13770	Behaviour Depending on Scene Pace	"Differential Effects of Film on Preschool Children's Behaviour Depending on Editing Pace" examines how the pace of film editing influences the behavior and attention of preschool-aged children.	Increased Toy Switching After Fast-Paced Films: Children who watched a fast-paced film exhibited a higher frequency of switching between different toys during subsequent play sessions compared to those who watched a slow-paced film.
63	Screen time and early adolescent mental health	This study examines the associations between screen time and various outcomes—mental health, academic performance, and social functioning—in early adolescents.	The bar chart illustrates the relationship between screen time and various developmental outcomes, with higher screen time associated with increased internalizing and externalizing behaviors, lower academic performance, and mixed social outcomes.\n\nParticipants: \nData from the ABCD Study involving 9- and 10-year-old children.\n\n\n\nMethodology: \nCross-sectional analysis examining the relationship between screen time and various developmental outcomes.\n\nImplications:\nThe findings suggest the need for balanced screen time in early adolescents to promote better mental health, academic, and social outcomes.	Science Direct	2021-11-14	2025-05-24 11:06:44.861446	Media Effects	/research/1748084799957-Untitled-6.png	2025-05-24 11:06:44.861446	https://www.sciencedirect.com/science/article/pii/S0163638321001351?via%3Dihub	Screen time and early adolescent mental health	Screen time and early adolescent mental health, academic, and social outcomes in 9- and 10-year-old children: Utilizing the Adolescent Brain Cognitive Development (ABCD) Study	Mental Health: \nIncreased screen time is associated with higher levels of internalizing and externalizing behaviors.\n\n\n\nAcademic Performance: \nHigher screen time correlates with lower academic performance.\n\n\n\nSocial Outcomes: \nThe relationship between screen time and social functioning is complex, with some screen activities linked to better social outcomes and others to worse.\n
64	Effects of screen time on emotion regulation and academic performance	This study investigates the longitudinal effects of screen time on emotion regulation and academic achievements in young children, providing insights into how early exposure to digital devices may influence developmental outcomes.	The bar chart illustrates the relationship between screen time at age 4 and subsequent dysregulation symptoms and academic achievements at ages 6 and 8.\n\nParticipants: 422 children and their mothers, with assessments conducted at ages 4, 6, and 8.\n\n\n\nMethodology: Mothers reported their children's screen time and emotional/behavioral functioning; teachers provided evaluations of academic achievements and dysregulation symptoms.\n\nImplications:\nThe findings suggest that excessive screen time in early childhood can have lasting negative effects on emotional regulation and academic success. Limiting screen exposure during formative years is recommended to promote healthier developmental outcomes.	Sage Journals	2020-12-06	2025-05-24 11:10:46.32259	Media Effects	/research/1748085040783-Untitled-7.png	2025-05-24 11:10:46.32259	https://journals.sagepub.com/doi/abs/10.1177/1476718X20969846	Effects of screen time on emotion regulation and academic performance	A three-wave longitudinal study on children from 4 to 8 years of age	Emotion Regulation: \nIncreased screen time at 4 years of age was associated with higher levels of dysregulation symptoms, such as mood swings and attention difficulties, at ages 6 and 8.\n\n\n\nAcademic Achievements: \nHigher screen time at age 4 negatively correlated with mathematics and literacy grades at age 8.\n\n\n\nParental Involvement: \nActive parental participation during children's screen time did not significantly mitigate the negative effects on emotion regulation and academic performance.
65	Media Exposure and Toddler Development	This research investigates whether the duration and content of media exposure at 6 months of age are associated with developmental outcomes at 14 months, providing insights into early childhood media consumption's potential impact on cognitive and language development.	X-Axis:\n\n\n\n\n\nDevelopmental categories: Cognitive Development and Language Development.\n\n\n\nTwo Bars per Category:\n\n\n\n\n\nLow Media Exposure: Represented in light blue.\n\n\n\nHigh Media Exposure: Represented in salmon.\n\n\n\nY-Axis:\n\n\n\n\n\nAverage development scores (hypothetical values for illustration).\n\n\n\nAnnotations:\n\n\n\n\n\nScores displayed above each bar for clarity.\n\nPopulation:\n\n\n\n\n\n259 mother-infant pairs from an urban public hospital, primarily of low socioeconomic status.\n\n\n\nMethodology:\n\n\n\n\n\nLongitudinal analysis with media exposure assessed at 6 months and developmental outcomes measured at 14 months using standardized cognitive and language development scales.\n\n\n\nReferences:\n\n\n\n\n\nThe study cites 28 references, providing a comprehensive review of related literature.\n\n\n\nDates:\n\n\n\n\n\nData collection occurred from November 23, 2005, through January 14, 2008.\n\nImplications:\n\nEarly media exposure, especially to inappropriate content, may adversely affect cognitive and language development. Parents and caregivers should be cautious about both the duration and type of media their infants are exposed to during critical developmental periods.	Jama Pediatrics	2010-12-06	2025-05-24 11:13:32.033623	Cognitive Development	/research/1748085154288-Untitled-8.png	2025-05-24 11:13:32.033623	https://jamanetwork.com/journals/jamapediatrics/fullarticle/384030	Media Exposure and Toddler Development	"Infant Media Exposure and Toddler Development" examines the relationship between media exposure in infants and their cognitive and language development in toddlerhood.	Prevalence of Media Exposure:\n\n\n\n\n\nAt 6 months, 96.1% of infants were exposed to media, averaging approximately 152.7 minutes per day.\n\n\n\nAssociation with Cognitive Development:\n\n\n\n\n\nIncreased media exposure duration at 6 months correlated with lower cognitive development scores at 14 months.\n\n\n\nAssociation with Language Development:\n\n\n\n\n\nSimilarly, greater media exposure was linked to lower language development scores at 14 months.\n\n\n\nContent Specificity\n\n\n\n\n\nExposure to adult-oriented or age-inappropriate content was linked to adverse developmental outcomes in infants\n\n\n\nEven educational content showed limited to no positive effects on development, with some studies finding that certain educational programs were associated with reduced vocabulary in young children\n\n\n\n
66	Effects of Infant Media Usage	Understanding the effects of early media exposure is crucial, as over 90% of children begin watching TV regularly before the age of 2, despite recommendations to the contrary.	X-Axis:\n\n\n\n\n\nDaily TV viewing time categories: '0-1 hour/day', '1-2 hours/day', '>2 hours/day'.\n\n\n\nY-Axis:\n\n\n\n\n\nDevelopmental scores (hypothetical scale from 0 to 100).\n\n\n\nBars:\n\n\n\n\n\nThree sets of bars representing language development, cognitive development, and attention capacity scores for each TV viewing category.\n\nMethodology:\n\n\n\n\n\nThis article reviews existing studies on the effects of infant TV viewing across multiple domains of child development, including language, cognition, and attentional capacity.\n\n\n\nImplications:\n\nThe findings suggest that early exposure to television may have detrimental effects on infants' language development, cognitive growth, and attention. Parents should exercise caution in exposing infants to excessive media and consider limiting screen time during early developmental stages.	Acta Paediatrica	2008-12-09	2025-05-24 11:15:19.455819	Media Effects	/research/1748085288965-Untitled-9.png	2025-05-24 11:15:19.455819	https://onlinelibrary.wiley.com/doi/full/10.1111/j.1651-2227.2008.01027.x	Effects of Infant Media Usage	"The effects of infant media usage: what do we know and what should we learn?" examines the impact of television viewing on infants' development, focusing on language acquisition, cognitive growth, and attention.	Language Development:\n\n\n\n\n\nInfant TV viewing has been associated with delayed language development.\n\n\n\nCognitive Development:\n\n\n\n\n\nNo studies to date have demonstrated benefits associated with early infant TV viewing.\n\n\n\nAttention Capacity:\n\n\n\n\n\nThe preponderance of existing evidence suggests the potential for harm in terms of attentional capacity.
67	Infant Screen Use Decreasing Executive Function	Research evidence is mounting for the association between infant screen use and negative cognitive outcomes related to attention and executive functions. The nature, timing, and persistence of screen time exposure on neural functions are currently unknown. Electroencephalography (EEG) permits elucidation of the neural correlates associated with cognitive impairments.	Study Details:\n\n\n\n\n\nPopulation: The research analyzed data from 437 children participating in a birth cohort study. Published in 2023 and citing 51 references.\n\n\n\nAssessment Methods: Screen time was reported by parents during infancy. EEG measurements were taken to assess brain activity patterns, and cognitive functions were evaluated at 9 years of age using standardized tests.\n\nImplications:\n\nThe findings suggest that excessive screen time in infancy may influence brain development, leading to cognitive challenges later in childhood. Parents and caregivers should be mindful of the amount of screen exposure during early developmental stages and consider engaging infants in activities that promote healthy brain development.	Jama Pediatrics	2023-01-30	2025-05-24 11:18:02.241401	Cognitive Development	/research/1748085447290-output(3).png	2025-05-24 11:18:02.241401	https://jamanetwork.com/journals/jamapediatrics/fullarticle/2800776	Infant Screen Use Decreasing Executive Function	Associations Between Infant Screen Use, Electroencephalography Markers, and Cognitive Outcomes	The study titled "Associations Between Infant Screen Use, Electroencephalography Markers, and Cognitive Outcomes" examines the relationship between screen time in infancy, brain activity patterns, and cognitive development in later childhood.\n\n\n\n\n\nIncreased Screen Time Linked to Cognitive Impairments: \nInfants with higher daily screen time exhibited altered brain activity patterns, specifically increased theta/beta ratios in frontocentral and parietal regions, which were associated with poorer executive function at 9 years of age.\n\n\n\nMediating Role of Brain Activity: The study suggests that the relationship between early screen exposure and later cognitive outcomes is mediated by these specific electroencephalography (EEG) markers.\n
68	Early Childhood Television Exposure	Understanding the long-term effects of early television exposure is crucial, as it can influence academic performance, psychosocial development, and physical health during middle childhood.	X-Axis:\n\n\n\n\n\nCategories representing different outcomes.\n\n\n\nY-Axis:\n\n\n\n\n\nValues corresponding to TV hours and normalized outcome scores.\n\n\n\nBars:\n\n\n\n\n\nTwo bars per category representing TV hours at 29 months and outcome scores in fourth grade.\n\nPopulation:\n\n\n\n\n\n1,314 children from the Quebec Longitudinal Study of Child Development.\n\n\n\nMethodology:\n\n\n\n\n\nParent-reported data on weekly hours of television exposure at 29 and 53 months of age.\n\n\n\nAssessments of academic, psychosocial, and physical well-being in fourth grade.\n\nImplications:\n\nThe findings suggest that excessive television exposure in early childhood may have detrimental effects on various aspects of well-being by middle childhood. Limiting screen time during early developmental stages could be beneficial for long-term academic, social, and physical health.	Jama Pediatrics	2010-05-03	2025-05-24 11:20:23.034473	Media Effects	/research/1748085611846-Untitled-10.png	2025-05-24 11:20:23.034473	https://jamanetwork.com/journals/jamapediatrics/fullarticle/383160	Early Childhood Television Exposure	"Prospective Associations Between Early Childhood Television Exposure and Academic, Psychosocial, and Physical Well-being by Middle Childhood" investigates the impact of television exposure during early childhood on various aspects of well-being in middle childhood.	Academic Outcomes:\n\n\n\n\n\nIncreased television exposure at 29 months was associated with decreased classroom engagement and math achievement in fourth grade.\n\n\n\nPsychosocial Outcomes:\n\n\n\n\n\nHigher early television exposure correlated with a higher likelihood of being victimized by classmates and exhibiting antisocial behaviors.\n\n\n\nPhysical Well-being:\n\n\n\n\n\nEarly television exposure was linked to higher body mass index (BMI) and a more sedentary lifestyle in middle childhood.
69	TV Exposure Risk Factor Aggressive Behavior 3-Y/O	Early childhood aggression can lead to more serious behavioral problems in later life. Understanding the factors that contribute to aggressive behavior in young children is crucial for developing effective interventions. This study explores whether direct child TV exposure and household TV use are associated with increased aggression in 3-year-old children.	X-Axis:\n\n\n\n\n\nDaily TV exposure categories: '<1 hour/day', '1-3 hours/day', '>3 hours/day'.\n\n\n\nY-Axis:\n\n\n\n\n\nMean aggression scores.\n\n\n\nBars:\n\n\n\n\n\nDifferent colors represent each TV exposure category.\n\nPopulation:\n\n\n\n\n\n3,128 mothers and their 3-year-old children from the Fragile Families and Child Wellbeing Study, a prospective cohort study.\n\n\n\nMethodology:\n\n\n\n\n\nData were collected through home visits and telephone interviews.\n\n\n\nAggressive behavior was assessed using the Child Behavior Checklist/2-3.\n\n\n\nMultivariate linear regression models were used to examine associations between TV exposure and childhood aggression, controlling for various demographic and environmental factors.\n\nImplications:\n\nThe findings suggest that both direct and indirect TV exposure are associated with increased aggressive behavior in 3-year-old children. This highlights the importance of monitoring not only the content and amount of TV that children watch but also the overall TV usage within the household. Reducing TV exposure and considering the broader media environment may be beneficial in mitigating early childhood aggression.	Jama Pediatrics	2009-11-02	2025-05-24 11:23:07.457663	Social Development	/research/1748085777503-Untitled-11.png	2025-05-24 11:23:07.457663	https://jamanetwork.com/journals/jamapediatrics/fullarticle/382349	TV Exposure Risk Factor Aggressive Behavior 3-Y/O	"Television Exposure as a Risk Factor for Aggressive Behavior Among 3-Year-Old Children" examines the association between television (TV) exposure and aggressive behavior in young children.	Direct Child TV Exposure:\n\n\n\n\n\nIncreased direct TV exposure was significantly associated with higher aggression scores in children.\n\n\n\nHousehold TV Use:\n\n\n\n\n\nHigher levels of household TV use, even when the child was not directly watching, were also significantly associated with increased aggression in children.\n\n\n\nOther Factors:\n\n\n\n\n\nAdditional factors such as spanking, maternal depression, parenting stress, and living in a disorderly neighborhood were associated with higher aggression scores.
70	TV and Externalizing Problems in Children	Early childhood is a critical period for behavioral and cognitive development. Understanding the impact of television exposure on young children's behavior is essential for guiding parents and caregivers in making informed decisions about media consumption.	X-Axis:\n\n\n\n\n\nDaily television viewing time categories: '<1 hour/day', '1-2 hours/day', '>2 hours/day'.\n\n\n\nY-Axis:\n\n\n\n\n\nPrevalence of externalizing problems expressed as a percentage.\n\n\n\nBars:\n\n\n\n\n\nDifferent colors represent each television viewing category.\n\nPopulation:\n\n\n\n\n\n5,565 children and their mothers participating in the Generation R Study, a population-based cohort in the Netherlands.\n\n\n\nMethodology:\n\n\n\n\n\nTelevision viewing time was assessed through maternal questionnaires when children were 2 years old.\n\n\n\nChild behavior was evaluated at 3 years old using the Child Behavior Checklist, focusing on externalizing problems.\n\n\n\nStatistical analyses accounted for potential confounding factors, including maternal education, income, and parenting stress.\n\nImplications:\n\nThe findings suggest that limiting television viewing time to less than 1 hour per day during early childhood may reduce the risk of developing externalizing behavioral problems. Additionally, parental viewing habits and socioeconomic factors should be considered when addressing children's media consumption.	JAMA Pediatrics	2012-10-01	2025-05-24 12:16:28.424865		/research/1748088872310-Untitled-12.png	2025-05-24 12:16:28.424865	https://jamanetwork.com/journals/jamapediatrics/fullarticle/1262309	TV and Externalizing Problems in Children	"Television Viewing and Externalizing Problems in Preschool Children: The Generation R Study" investigates the relationship between television viewing habits and the development of externalizing behavioral problems, such as aggression and attention issues, in preschool-aged children.	Television Viewing Duration:\n\n\n\n\n\nChildren who watched television for more than 1 hour per day at 2 years of age exhibited more externalizing problems at 3 years of age compared to those who watched less.\n\n\n\nMaternal Television Viewing:\n\n\n\n\n\nHigh levels of maternal television viewing were associated with increased externalizing problems in children, suggesting that parental viewing habits may influence child behavior.\n\n\n\nSocioeconomic Factors:\n\n\n\n\n\nLower maternal education and income levels were correlated with higher television viewing time in children, indicating that socioeconomic status may play a role in media consumption patterns.\n\n
71	TV associates with delayed language development	Early language development is crucial for a child's cognitive and social growth. Identifying factors that may impede this development, such as television viewing habits, is essential for guiding parents and caregivers in fostering healthy communication skills in children.	X-Axis:\n\n\n\n\n\nGroups: 'Typical Language Development' and 'Language Delay'.\n\n\n\nY-Axis:\n\n\n\n\n\nAverage TV viewing time in hours per day.\n\n\n\nBars:\n\n\n\n\n\nDifferent colors represent each group.\n\nPopulation:\n\n\n\n\n\nThe study included 56 children with language delays and 110 children with typical language development, aged between 15 to 48 months.\n\n\n\nMethodology:\n\n\n\n\n\nLanguage development was assessed using language milestones and the Denver-II screening tool.\n\n\n\nData on television viewing habits and child/parental characteristics were collected through interviews.\n\n\n\nStatistical analyses, including ANOVA and chi-square tests, were conducted to determine associations.\n\nImplications:\n\nThe findings suggest a significant association between early and prolonged television exposure and delayed language development in children. Parents and caregivers should be cautious about introducing television to infants and should limit screen time to support optimal language development.	Acta Paediatrica	2008-06-02	2025-05-24 12:18:42.640088	Learning Outcomes	/research/1748089068039-Untitled-13.png	2025-05-24 12:18:42.640088	https://onlinelibrary.wiley.com/doi/full/10.1111/j.1651-2227.2008.00831.x	TV associates with delayed language development	 "Television viewing associates with delayed language development" investigates the impact of television exposure on language development in young children.	Early Exposure:\n\n\n\n\n\nChildren with language delays began watching television at an average age of 7.22 months, compared to 11.92 months in children with typical language development.\n\n\n\nDuration of Viewing:\n\n\n\n\n\nChildren with language delays watched approximately 3.05 hours of television per day, whereas those without delays watched about 1.85 hours daily.\n\n\n\nIncreased Risk:\n\n\n\n\n\nChildren who started watching television before 12 months of age and watched more than 2 hours per day were approximately six times more likely to experience language delays.
72	Effects of Background TV	Early language development is significantly influenced by the quantity and quality of speech that children hear from their parents. Understanding factors that may disrupt or diminish this critical input is essential for fostering optimal language acquisition in early childhood.	X-Axis:\n\n\n\n\n\nConditions: 'TV Off' and 'TV On'.\n\n\n\nY-Axis:\n\n\n\n\n\nAverage count of words and utterances.\n\n\n\nBars:\n\n\n\n\n\nTwo sets of bars representing average words and average utterances for each condition.\n\nParticipants:\n\n\n\n\n\nThe study involved 49 parent-child pairs, with children aged 12, 24, and 36 months.\n\n\n\nMethodology:\n\n\n\n\n\nParent-child interactions were observed during free-play sessions in two conditions: with background television on and with it off.\n\n\n\nThe television was tuned to adult-directed programming to simulate typical background TV exposure.\n\n\n\nResearchers transcribed and analyzed the interactions to assess differences in the quantity and quality of child-directed speech by parents between the two conditions.\n\nImplications:\n\nThe findings suggest that background television can significantly reduce the richness of linguistic interactions between parents and young children. To support optimal language development, it is advisable for parents to minimize background television during times of direct interaction with their children.	Journal of Children and Media	2014-06-09	2025-05-24 12:21:13.034879	Media Effects	/research/1748089219679-Untitled-14.png	2025-05-24 12:21:13.034879	https://www.tandfonline.com/doi/full/10.1080/17482798.2014.920715#d1e123	Effects of Background TV	"The Effects of Background Television on the Quantity and Quality of Child-Directed Speech by Parents" examines how background television influences parental speech directed toward young children.	Reduction in Quantity of Speech:\n\n\n\n\n\nThe presence of background television led to a notable decrease in the number of words and utterances parents directed toward their children.\n\n\n\nDiminished Quality of Speech:\n\n\n\n\n\nNot only was the quantity of speech reduced, but the quality also suffered, with fewer new words introduced and shorter utterances used by parents when background television was on.\n\n\n\nPotential Impact on Language Development:\n\n\n\n\n\nGiven the critical role of rich linguistic input in language development, the reductions in both quantity and quality of parent-child interactions due to background television may have adverse effects on children's language acquisition.
74	Background TV and Toy Play Behavior	Early childhood play is essential for cognitive and social development. Understanding factors that disrupt play can inform parenting practices and environmental settings to promote healthy development.	X-Axis:\n\n\n\n\n\nAge groups: '12 months', '24 months', '36 months'.\n\n\n\nY-Axis:\n\n\n\n\n\nAverage play episode length in seconds.\n\n\n\nBars:\n\n\n\n\n\nTwo sets of bars representing play episode length with TV off and TV on for each age group.\n\nParticipants:\n\n\n\n\n\nFifty children divided into three age groups: 12 months, 24 months, and 36 months.\n\n\n\nMethodology:\n\n\n\n\n\nEach child participated in a 1-hour play session with a variety of toys.\n\n\n\nFor half of the session, an adult game show played in the background; for the other half, the TV was off.\n\n\n\nResearchers measured the length of play episodes and the degree of focused attention during play in both conditions.\n\nImplications:\n\nThe findings suggest that background television can disrupt play behavior in very young children, potentially hindering aspects of cognitive development. Parents and caregivers should consider minimizing background TV exposure during children's playtime to support sustained attention and engagement in play activities.\n\n	Society for Research in Children Development	2008-07-14	2025-05-24 12:26:46.938931	Parental Guidance	/research/1748089491031-Untitled-16.png	2025-05-24 12:26:46.938931	https://srcd.onlinelibrary.wiley.com/doi/full/10.1111/j.1467-8624.2008.01180.x	Background TV and Toy Play Behavior	 "The Effects of Background Television on the Toy Play Behavior of Very Young Children" examines how background adult television influences the play behavior of children aged 12, 24, and 36 months.	Disruption of Play Behavior:\n\n\n\n\n\nBackground television significantly reduced the duration of play episodes and the level of focused attention during play, even though children glanced at the TV infrequently and for brief periods.\n\n\n\nAge-Related Differences:\n\n\n\n\n\nWhile all age groups experienced disruptions, younger children (12 and 24 months) showed more pronounced reductions in play episode length compared to 36-month-olds.\n\n\n\nImplications for Cognitive Development:\n\n\n\n\n\nThe presence of background television may interfere with the development of sustained attention and play skills, which are critical for cognitive growth.
75	Autism Symptoms Associated With Screen Exposure	This case report explores the relationship between screen exposure and autism symptoms in two young children, highlighting how screen reduction and increased social interaction impact developmental outcomes.	The graph illustrates the progression of expressive language and social responsiveness scores during periods of high screen time versus screen reduction.\n\nParticipants: Two children diagnosed with Autism Spectrum Disorder (ASD).\n\n\n\nMethodology: The children underwent periods of screen time reduction, replaced with parent-led social interactions, followed by periods of increased screen exposure.\n\n\n\nObservations: Behavioral and developmental changes were documented through direct observation, parental reporting, and standard developmental assessments.\n\nImplications:\n\nReplacing screen time with social interaction and family engagement can lead to significant improvements in autism-related symptoms. This suggests that high screen exposure may hinder developmental progress in children with ASD. Parents and interventionists are encouraged to adopt screen time reduction strategies.	Science Direct	2022-09-24	2025-05-24 12:29:27.753479	Cognitive Development	/research/1748089749846-Untitled-17.png	2025-05-24 12:29:27.753479	https://www.sciencedirect.com/science/article/pii/S2773021222000529	Autism Symptoms Associated With Screen Exposure	"Changes in autism symptoms associated with screen exposure: Case report of two young children"	Positive Impact of Screen Reduction:\n\n\n\n\n\nBoth children exhibited marked improvements in social and language development when screen time was replaced with socially oriented activities.\n\n\n\nNegative Effects of Increased Screen Time:\n\n\n\n\n\nIncreases in screen exposure correlated with regression in developmental milestones, including social responsiveness and language abilities.\n\n\n\nFluctuations in Symptoms:\n\n\n\n\n\nRepetitive and restrictive behaviors intensified with higher screen time and diminished with screen reduction.
73	Background Television for Babies	This study examines how background television affects the quality and quantity of parent–child interactions, shedding light on the potential implications of ambient media exposure in the home environment.	The bar chart illustrates the average duration of parent–child interactions and children's play episodes with and without background television.\n\nParticipants: 50 children aged 12, 24, and 36 months, along with their parents.\n\n\n\nMethodology: Parent–child dyads were observed during free-play sessions with and without background television.\n\n\n\nImplications:\nThe findings suggest that background television can disrupt parent–child interactions and children's play behavior. Minimizing background media exposure may promote more effective parental engagement and support children's focused play.	Science Direct	2010-03-31	2025-05-24 12:24:15.663274	Parental Guidance	/research/1748089367641-Untitled-15.png	2025-05-24 12:29:54.988	https://www.sciencedirect.com/science/article/abs/pii/S0273229710000134	Background Television for Babies	When babies watch television: Attention-getting, attention-holding, and the implications for learning from video material	Reduced Interaction Quality: The presence of background television led to shorter and less frequent parent–child interactions.\n\n\n\nDecreased Parental Engagement: Parents were less responsive and engaged in fewer play behaviors with their children when background television was on.\n\n\n\nChild Play Behavior: Children's play was less focused and shorter in duration in the presence of background television.
76	Screen Time and Autistic Symptoms	Understanding how screen time influences the severity of autistic symptoms and developmental progress in children with ASD is crucial for developing guidelines that promote optimal developmental outcomes in this population.	Here is a bar chart illustrating key findings from the study:\n\n\n\n\n\nScreen Time (ASD): Children with ASD averaged 3.34 hours of screen time daily.\n\n\n\nScreen Time (TD): Typically developing (TD) children averaged 0.91 hours of screen time daily.\n\n\n\nCARS Score (ASD): Higher CARS scores indicate more severe autistic symptoms, with an average of 37.5.\n\n\n\nLanguage Development Quotient (DQ, ASD): Language DQs averaged 72, reflecting delays in language development.\n\nPopulation: The study involved 101 children diagnosed with ASD and 57 typically developing (TD) children.\n\n\n\nAssessment Methods: Screen time was reported by parents. Autistic symptoms were evaluated using the Childhood Autism Rating Scale (CARS), and developmental levels were assessed with the Gesell Developmental Schedules (GDS).\n\n\n\nReferences: The study cites 32 references, indicating a comprehensive review of existing literature.\n\n\n\nDates: Data collection occurred prior to the study's acceptance in January 2021.\n\nImplications:\n\nThe findings suggest that increased screen time may exacerbate autistic symptoms and hinder language development in children with ASD. It is advisable for parents and caregivers to monitor and potentially limit screen exposure, encouraging more interactive and developmentally supportive activities.	Frontiers in Psychiatry	2021-02-16	2025-05-24 12:32:06.348239	Cognitive Development	/research/1748089923490-output(5).png	2025-05-24 12:32:06.348239	https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2021.619994/full	Screen Time and Autistic Symptoms	"Correlation Between Screen Time and Autistic Symptoms as Well as Development Quotients in Children With Autism Spectrum Disorder" examines the relationship between screen time and both autistic symptoms and developmental quotients (DQs) in children diagnosed with Autism Spectrum Disorder (ASD).	Increased Screen Time in ASD Children: Children with ASD had significantly longer screen times compared to typically developing (TD) children, averaging 3.34 ± 2.64 hours versus 0.91 ± 0.93 hours, respectively.\n\n\n\nPositive Correlation with Autistic Symptoms: Increased screen time was associated with higher scores on the Childhood Autism Rating Scale (CARS), indicating more severe autistic symptoms. Notably, there was a significant correlation with sensory-related symptoms, particularly in the "taste, smell, and touch" category.\n\n\n\nNegative Correlation with Language Development: Higher screen time correlated with lower language DQs on the Gesell Developmental Schedules (GDS), suggesting delays in language development.
77	Early Screen Time Exposure and Autism Spectrum Disorder 	"Association Between Screen Time Exposure in Children at 1 Year of Age and Autism Spectrum Disorder at 3 Years of Age: The Japan Environment and Children’s Study" investigates the potential link between screen time in early childhood and the development of Autism Spectrum Disorder (ASD) by age three.	Study Details:\n\n\n\n\n\nPopulation: The research analyzed data from a large cohort of children participating in the Japan Environment and Children’s Study.\n\n\n\nAssessment Methods: Screen time exposure was reported by parents when the children were one year old. ASD diagnoses were made by healthcare professionals when the children reached three years of age.\n\nConsiderations:\n\n\n\n\n\nCorrelation vs. Causation: While the study found an association between increased screen time and ASD diagnoses, it does not establish a direct cause-and-effect relationship. Other factors may contribute to this association.\n\n\n\nNeed for Further Research: The findings highlight the importance of further studies to explore the underlying mechanisms and to consider other potential contributing factors, such as genetic predispositions or environmental influences.\n\nImplications:\n\nThe study suggests that limiting screen time for infants may be advisable, aligning with existing guidelines that recommend minimal screen exposure for young children. Parents and caregivers should be mindful of screen time and consider engaging children in interactive, non-screen-based activities to support healthy development.\n\nThe study references a total of 51 sources, encompassing prior research articles, guidelines, and relevant literature that informed its methodology and analysis. These references span various years, reflecting the study's foundation on both historical and contemporary research in the field. The Japan Environment and Children’s Study" was published in JAMA Pediatrics in April 2022.	JAMA Pediatrics	2022-01-31	2025-05-24 12:35:38.110656	Cognitive Development	/research/1748090126003-output(2).png	2025-05-24 12:35:38.110656	https://jamanetwork.com/journals/jamapediatrics/fullarticle/2788488	Early Screen Time Exposure and Autism Spectrum Disorder 	Association Between Screen Time Exposure in Children at 1 Year of Age and Autism Spectrum Disorder at 3 Years of Age	Increased Risk with Higher Screen Time: Children who were exposed to four or more hours of screen time per day at one year old had a higher likelihood of being diagnosed with ASD by age three compared to those with less than one hour of screen time.\n\n\n\nDose-Response Relationship: The study observed a trend where the risk of ASD increased with the amount of screen time, suggesting a dose-response relationship.\n\n
78	Digital Media in Social Skill Development	Social interactions during childhood and adolescence are vital for developing empathy, communication skills, and emotional intelligence. With digital media often replacing face-to-face interactions, the implications for social skills are significant.	 X-Axis:\n\n        Represents Daily Screen Time (<1 hour/day, 1-3 hours/day, >3 hours/day).\n\n        This axis categorizes children based on their daily exposure to screens.\n\n    Y-Axis:\n\n        Represents Empathy Scores.\n\n        This axis shows the measured levels of empathy in children.\n\nPopulation: 500 children aged 8-14.\n\n\n\nMethodology: Participants completed empathy and social skill assessments. Parents reported daily screen time and types of media consumed.\n\nImplications:\nEncouraging balanced media use and promoting social media activities that foster collaboration and communication can help mitigate negative effects on social skill development.	Springer Nature Link	2024-11-19	2025-05-24 12:39:03.727857	Social Development	/research/1748090337717-Untitled-18.png	2025-05-24 12:39:03.727857	https://link.springer.com/chapter/10.1007/978-3-031-69224-6_8	Digital Media in Social Skill Development	Digital Media and Language Development: The Role of Child-Directed Speech	Reduced Face-to-Face Interactions: Children who spent more than 3 hours daily on digital devices reported fewer opportunities for face-to-face socialization with peers.\n\n\n\nLower Empathy Levels: High digital media users scored lower on empathy tests compared to children who spent less time on screens.\n\n\n\nPositive Role of Collaborative Games: Online games that required collaboration improved teamwork and communication skills in moderate users.
79	Functioning and Multitasking in Adolescents	Adolescents frequently engage with multiple screens simultaneously, raising concerns about its effects on cognitive abilities like attention and executive functioning.	X-Axis:\n\n        Represents Media Multitasking Levels (Low Multitasking, Moderate Multitasking, High Multitasking).\n\n        This axis categorizes adolescents based on the degree of simultaneous media usage.\n\n    Y-Axis:\n\n        Represents Cognitive Performance Scores.\n\n        This axis includes scores for Attention and Memory, reflecting cognitive task performance.\n\nPopulation: 300 adolescents aged 12-17.\n\n\n\nMethodology: Participants completed cognitive tests assessing attention, memory, and task-switching while multitasking with media. Surveys captured self-reported media habits.\n\nImplications:\nEncouraging single-tasking and limiting simultaneous media use can enhance focus and cognitive performance in adolescents.\n\n	Emerald	2021-12-15	2025-05-24 12:41:39.430127	Cognitive Development	/research/1748090470648-Untitled-19.png	2025-05-24 12:41:39.430127	https://www.emerald.com/insight/content/doi/10.1108/intr-01-2021-0078/full/html	Functioning and Multitasking in Adolescents	Impact of media multitasking on executive function in adolescents: behavioral and self-reported evidence from a one-year longitudinal study	Reduced Task Performance: Adolescents who multitasked with media performed worse on tasks requiring sustained attention and working memory.\n\n\n\nIncreased Impulsivity: High media multitaskers exhibited greater impulsivity and difficulty delaying gratification.\n\n\n\nNo Benefits Observed: Multitasking did not improve adolescents’ ability to switch tasks efficiently.
80	Reality Vs Fantasy Judgments of Digital Media	This study explores how children differentiate between real and fictional elements in digital media, a critical skill in an era dominated by virtual content.	The bar chart compares reality-judgment accuracy scores across age groups and media types.\n\nParticipants: 150 children aged 4–9.\n\n\n\nMethodology: Children watched digital media clips featuring both realistic and fantastical elements. They were then asked to classify elements as real or fictional.\n\nImplications:\n\nParents and educators should guide children in evaluating digital content critically, particularly in contexts where fantasy blends with reality.	Frontiers in Psychology	2020-11-05	2025-05-24 12:45:25.305933	Child Psychology	/research/1748090702550-Untitled-20.png	2025-05-24 12:45:25.305933	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.570068/full	Reality Vs Fantasy Judgments of Digital Media	Children’s Reality Status Judgments of Digital Media	Difficulty With Fictional Content:\n\n\n\n\n\nYounger children (4–6 years) struggled more to identify fictional elements in digital media compared to older children (7–9 years).\n\n\n\nContext Matters:\n\n\n\n\n\nRealistic settings in media increased confusion about reality status, particularly for fantastical characters in real-world environments.\n\n\n\nParental Mediation Helps:\n\n\n\n\n\nDiscussing media content with parents improved children’s ability to differentiate between real and fictional elements.
81	Effects of a Social Robot vs. Human Child Interact	This study investigates how children respond to a social robot compared to a human partner in tasks requiring social referencing, such as seeking guidance or approval.	The bar chart compares social referencing scores for interactions with a human partner and a social robot, highlighting the stronger engagement with human partners.\n\nParticipants: 100 children aged 4–8.\n\n\n\nMethodology: Children interacted with a human partner and a social robot in separate sessions. Social referencing was measured based on gaze, gestures, and verbal cues.\n\nImplications\nSocial robots have potential as educational tools but cannot fully replace human interaction in tasks requiring nuanced social understanding.	Frontiers	2021-01-14	2025-05-24 12:48:14.93017	Social Development	/research/1748090858364-Untitled-21.png	2025-05-24 12:48:14.93017	https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2020.569615/full	Effects of a Social Robot vs. Human Child Interact	 Comparing the Effects of a Different Social Partner (Social Robot vs. Human) on Children's Social Referencing in Interaction	Human Partners Elicit Stronger Responses:\n\n\n\n\n\nChildren relied more on human partners for social cues, especially in ambiguous situations.\n\n\n\nSocial Robots as Emerging Tools:\n\n\n\n\n\nWhile less effective than humans, social robots still prompted significant social referencing behaviors, particularly in structured interactions.\n\n\n\nAge Differences:\n\n\n\n\n\nOlder children (6–8 years) engaged more with the robot compared to younger children (4–5 years), possibly due to novelty or better understanding of its capabilities.
82	Mother-Child Interaction and Smartphone Use	This study examines how smartphone use affects the quality of mother-child interactions, particularly during play and caregiving activities.	The chart compares interaction quality scores before, during, and after smartphone use, emphasizing the rebound effect.\n\nParticipants: 90 mother-child pairs; children aged 2–5 years.\n\n\n\nMethodology: Structured observation sessions assessing interaction quality using standardized behavioral scales.\n\nImplications:\nParents should limit non-essential smartphone use during caregiving and play to maintain high-quality interactions and responsiveness.	Frontiers	2021-03-29	2025-05-24 12:50:38.67312	Parental Guidance	/research/1748091026116-Untitled-22.png	2025-05-24 12:50:38.67312	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.616656/full	Mother-Child Interaction and Smartphone Use	Quality of Mother-Child Interaction Before, During, and After Smartphone Use	Reduced Interaction Quality:\n\n\n\n\n\nDuring smartphone use, mothers exhibited lower responsiveness and less verbal engagement.\n\n\n\nRebound Effect:\n\n\n\n\n\nInteraction quality improved after smartphone use but did not reach pre-smartphone levels in most cases.\n\n\n\nChild Behavior:\n\n\n\n\n\nChildren were more likely to show attention-seeking behaviors when mothers were using smartphones.\n\n
83	Infant & Toddler Media Use Related to Sleeping	The study explores the relationship between media use and sleep quality in infants and toddlers, focusing on bedtime routines and screen time duration.	The chart compares sleep duration based on daily screen time.\n\nParticipants: 250 Italian families with children aged 6 months to 3 years.\n\n\n\nMethodology: Parental sleep diaries and surveys on media habits.\n\nImplications:\nReducing screen exposure before bedtime and avoiding stimulating content can promote better sleep habits in young children.	Frontiers	2021-03-22	2025-05-24 12:58:06.031962	Media Effects	/research/1748091470524-Untitled-23.png	2025-05-24 12:58:06.031962	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.589664/full	Infant & Toddler Media Use Related to Sleeping	How Infant and Toddlers’ Media Use Is Related to Sleeping Habits in Everyday Life in Italy	Delayed Sleep Onset:\n\n\n\n\n\nInfants and toddlers exposed to screens within an hour of bedtime took longer to fall asleep.\n\n\n\nShortened Sleep Duration:\n\n\n\n\n\nScreen time exceeding two hours/day was associated with a reduction in overall sleep duration.\n\n\n\nRole of Media Content:\n\n\n\n\n\nCalming and educational content had less impact on sleep compared to fast-paced or violent media.
85	Impacts of Technology on Children’s Health	The study investigates the effects of technology use on children’s health, aiming to provide insights into the balance between benefits and potential risks. It highlights the need for appropriate guidelines and interventions to mitigate adverse effects while promoting healthy use.	X-Axis: Categories of health impacts (Physical Health, Sleep Patterns, Mental Health, Cognitive Development).\n\n\n\nTwo Bars per Category:\n\n\n\n\n\nNegative Impact: Represented in salmon color.\n\n\n\nPositive Impact: Represented in light green.\n\n\n\nY-Axis: Percentage of impact (hypothetical values based on study implications).\n\nPopulation:\nThe study synthesizes data from multiple research papers evaluating technology's impact on children aged 0–18 years.\n\n\n\nMethodology:\nA systematic review of studies across physical, mental, and cognitive domains was conducted to derive overarching trends.\n\n\n\nReferences:\nThe study cites 65 references, reflecting a comprehensive review of the literature.\n\n\n\nDates:\nResearch analyzed spans several decades up to the publication year.\n\nImplications:\n\nThe findings emphasize the need for:\n\n\n\n\n\nParental Guidance:\nMonitoring and regulating children’s technology use to ensure it is age-appropriate and balanced with physical and social activities.\n\n\n\nPromoting Physical Activity:\nCounteracting the sedentary effects of screen time with regular exercise.\n\n\n\nEstablishing Screen-Free Zones:\nLimiting technology use in specific environments, such as bedrooms, to improve sleep hygiene.	PubMed Central	2022-07-06	2025-05-24 13:09:36.463569	Parental Guidance	/research/1748092147545-Untitled1.png	2025-05-24 13:09:36.463569	https://pmc.ncbi.nlm.nih.gov/articles/PMC9273128/	Impacts of Technology on Children’s Health	Impacts of technology on children’s health: a systematic review	Physical Health:\n\n\n\n\n\nExcessive screen time contributes to a sedentary lifestyle, leading to increased risks of obesity and related health issues.\n\n\n\nSleep Patterns:\n\n\n\n\n\nElectronic device usage, especially before bedtime, is associated with disrupted sleep quality and reduced sleep duration.\n\n\n\nMental Health:\n\n\n\n\n\nHigh exposure to social media and online content correlates with increased anxiety, depression, and reduced self-esteem.\n\n\n\nCognitive Development:\n\n\n\n\n\nEducational technologies can enhance learning, but excessive or inappropriate usage can negatively impact attention spans and academic performance.
86	The Developing Brain in the Digital Era	With the pervasive use of digital devices among adolescents, understanding the impact of screen time on brain development is crucial. This review consolidates findings from neuroimaging studies to provide insights into how screen exposure may influence the adolescent brain's structure and function.	X-Axis:\n\n\n\n\n\nBrain regions: 'Prefrontal Cortex', 'Striatum', 'Amygdala'.\n\n\n\nLeft Y-Axis:\n\n\n\n\n\nAverage screen time in hours per day.\n\n\n\nRight Y-Axis:\n\n\n\n\n\nObserved changes in neural activity expressed as a percentage.\n\n\n\nBars and Line:\n\n\n\n\n\nBars represent average screen time; the line represents observed changes in neural activity.\n\nMethodology:\n\n\n\n\n\nScoping review of 16 neuroimaging studies published between 2010 and 2020, focusing on adolescents aged 10 to 19 years.\n\n\n\nStudies included both task-related and task-unrelated neuroimaging assessments to evaluate structural and functional brain correlates of screen time.\n\nImplications:\n\nThe findings suggest that excessive screen time during adolescence may be linked to structural and functional brain changes, particularly in regions associated with critical cognitive and emotional processes. These insights underscore the importance of monitoring and moderating screen exposure during this developmental period to support healthy brain maturation.	Frontiers	2021-08-27	2025-05-24 13:12:29.322556	Child Psychology	/research/1748092205031-Untitled-24.png	2025-05-24 13:12:29.322556	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.671817/full	The Developing Brain in the Digital Era	"The Developing Brain in the Digital Era: A Scoping Review of Structural and Functional Correlates of Screen Time in Adolescence" examines how screen time affects adolescent brain development.	Structural Brain Changes:\n\n\n\n\n\nIncreased screen time is associated with alterations in brain regions related to attention, executive functions, and emotional processing.\n\n\n\nFunctional Brain Changes:\n\n\n\n\n\nHigh screen exposure correlates with changes in neural activity patterns, particularly in areas responsible for cognitive control and reward processing.\n\n\n\nInternet-Related Addictive Behaviors:\n\n\n\n\n\nAdolescents exhibiting internet-related addictive behaviors show distinct neural patterns, suggesting potential risks to healthy brain development.
87	Screen-viewing among preschoolers in childcare	Screen-viewing is a predominant sedentary activity among preschoolers, and understanding its prevalence in childcare settings is crucial. Excessive screen time during early childhood has been linked to various health concerns, including obesity, behavioral issues, and developmental delays. Given that many children spend a significant portion of their day in childcare, assessing screen-viewing within this environment is essential for developing effective guidelines and interventions.	X-Axis:\n\n\n\n\n\nChildcare types: 'Center-Based Childcare' and 'Home-Based Childcare'.\n\n\n\nY-Axis:\n\n\n\n\n\nAverage screen time in hours per day.\n\n\n\nBars:\n\n\n\n\n\nTwo bars representing the average screen time for each childcare setting.\n\n\n\nError Bars:\n\n\n\n\n\nRepresenting variability or standard deviation in screen time within each setting.\n\nMethodology:\n\n\n\n\n\nSystematic review of 17 international studies published between 2004 and 2014, including experimental, cross-sectional, and mixed-methods research.\n\n\n\nStudies examined rates of screen-viewing and access to screen-based activities in both center- and home-based childcare settings.\n\nImplications:\n\nThe findings indicate that preschoolers, especially those in home-based childcare, are exposed to significant amounts of screen time. This underscores the need for targeted interventions and policies to reduce screen exposure in childcare environments. Enhancing staff education and creating engaging, non-screen-based activities may help mitigate excessive screen-viewing among young children.	BMC Pediatrics	2014-08-16	2025-05-24 13:15:17.862498	Parental Guidance	/research/1748092508405-Untitled-25.png	2025-05-24 13:15:17.862498	https://bmcpediatr.biomedcentral.com/articles/10.1186/1471-2431-14-205	Screen-viewing among preschoolers in childcare	Screen-viewing among preschoolers in childcare: a systematic review" examines the prevalence and correlates of screen-viewing behaviors among preschool-aged children (2.5-5 years) attending childcare settings, including both center-based and home-based facilities.	Prevalence of Screen-Viewing:\n\n\n\n\n\nCenter-Based Childcare: Preschoolers engaged in approximately 0.1 to 1.3 hours of screen-viewing per day.\n\n\n\nHome-Based Childcare: Children spent about 1.8 to 2.4 hours per day engaged in screen-viewing activities.\n\n\n\nCorrelates of Screen-Viewing:\n\n\n\n\n\nStaff Education: Higher staff education levels were associated with reduced screen-viewing time among children.\n\n\n\nType of Childcare Arrangement: Children in home-based childcare settings were more likely to have higher screen-viewing times compared to those in center-based care.\n\n\n\nChildcare Environment:\n\n\n\n\n\nThe availability of screen-based activities in childcare settings was found to be conducive to increased screen-viewing among preschoolers.\n\n
88	Media and Young Minds: Screen time during ages 0-5	Technological innovation has transformed media and its role in the lives of infants and young children. More children, even in economically challenged households, are using newer digital technologies, such as interactive and mobile media, on a daily basis and continue to be the target of intense marketing. This policy statement addresses the influence of media on the health and development of children from 0 to 5 years of age, a time of critical brain development, building secure relationships, and establishing healthy behaviors.	X-Axis:\n\n\n\n\n\nAge groups: <18 months, 18-24 months, 2-5 years.\n\n\n\nY-Axis:\n\n\n\n\n\nRecommended screen time in hours per day.\n\nImplications:\n\nThe policy underscores the need for parents and caregivers to be mindful of the quantity and quality of media exposure in young children. By following the AAP's recommendations, families can help ensure that media use supports healthy development and does not interfere with essential activities like sleep, play, and family interactions.	AAP	2016-11-01	2025-05-24 13:19:15.503232	Parental Guidance	/research/1748092656162-Untitled-26.png	2025-05-24 13:19:15.503232	https://publications.aap.org/pediatrics/article/138/5/e20162591/60503/Media-and-Young-Minds	Media and Young Minds: Screen time during ages 0-5	"Media and Young Minds" by the American Academy of Pediatrics (AAP) addresses the influence of media on the health and development of children from 0 to 5 years of age, a period of critical brain development, the formation of secure relationships, and the establishment of health behaviors.	Infants and Toddlers:\n\n\n\n\n\nChildren younger than 2 years need hands-on exploration and social interaction with trusted caregivers to develop their cognitive, language, motor, and social-emotional skills.\n\n\n\nPreschool Media and Learning:\n\n\n\n\n\nEducational television programs, such as "Sesame Street," have been shown to improve cognitive outcomes and academic readiness for children aged 3 to 5 years.\n\n\n\nHealth and Developmental Concerns:\n\n\n\n\n\nObesity: Excessive media use has been associated with increased risk of obesity in children.\n\n\n\nSleep: Media use, particularly before bedtime, can negatively affect sleep quality and duration.\n\n\n\nChild Development: Unsupervised or excessive media use can interfere with the development of language, social skills, and executive function.\n\n\n\nParental Media Use:\n\n\n\n\n\nParents' own media use can influence their children's media habits and family interactions.\n\nRecommendations\n\n\n\n\n\nFor Pediatricians:\n\n\n\n\n\nAdvise parents to avoid digital media use (except video chatting) in children younger than 18 months.\n\n\n\nFor children aged 18 to 24 months, if parents wish to introduce digital media, choose high-quality programming/apps and use media together with the child.\n\n\n\nFor children aged 2 to 5 years, limit screen use to 1 hour per day of responsible programming, co-view with children, and help them understand what they are seeing.\n\n\n\nEncourage parents to establish media-free times (e.g., during meals) and locations (e.g., bedrooms) and to model good media use habits.\n\n\n\nFor Families:\n\n\n\n\n\nDevelop a family media use plan that takes into account the health, education, and entertainment needs of each child and the whole family.\n\n\n\nEngage in interactive activities that promote healthy development, such as reading, playing together, and conversing with children.
89	Toddlers Using Tablets: How they Engage, Play and Learn	This study examines how toddlers engage with tablet-based activities, exploring the educational and developmental potential of touch-based technology.	The bar chart compares engagement and learning outcomes for toddlers interacting with passive media (e.g., TV) versus tablet-based activities, with and without parental involvement. It highlights the added value of interactive features and parental support.\n\nParticipants: 150 toddlers aged 18–36 months.\n\n\n\nMethodology: Observational sessions where toddlers interacted with tablet-based apps. Outcomes were assessed using attention measures and problem-solving tasks.\n\nImplications:\nWhen used appropriately, tablets can be a valuable tool for enhancing toddlers’ learning and engagement. Parental involvement is essential to maximize benefits and prevent overuse.	Frontiers	2021-05-31	2025-05-24 13:24:42.805427	Learning Outcomes	/research/1748093066702-Untitled-28.png	2025-05-24 13:24:42.805427	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.564479/full	Toddlers Using Tablets: How they Engage, Play and Learn	A study into how sessions on educational learning apps compares with solo sessions, with parents and passive video content.	High Engagement Levels:\n\n\n\n\n\nToddlers demonstrated extended focus and engagement when using tablet applications designed for their age group.\n\n\n\nInteractive features, such as drag-and-drop and touch-to-animate, significantly increased attention spans compared to passive media like television.\n\n\n\nLearning Outcomes:\n\n\n\n\n\nEducational apps improved problem-solving skills and vocabulary acquisition in toddlers.\n\n\n\nHowever, the absence of parental involvement diminished these benefits.\n\n\n\nRole of Play:\n\n\n\n\n\nTablet-based activities that incorporated play elements (e.g., puzzles, games) fostered exploratory behavior and creativity.\n\n
90	Media and Focused Attention Through Toddlerhood	This study investigates how early exposure to digital media impacts toddlers’ ability to maintain focused attention over time, emphasizing the cumulative effect of media use and other environmental factors.	The chart compares focused attention scores based on cumulative risk levels, including screen time, parental engagement, and environmental distractions.\n\nParticipants: 200 toddlers aged 18 months to 3 years.\n\n\n\nMethodology: Longitudinal tracking of attention tasks and parental surveys on media usage and home environments.\n\n\nImplications:\nReducing screen time and creating a supportive, distraction-free home environment can help improve toddlers’ focused attention. Active parental mediation is crucial to mitigate negative effects.	Frontiers	2020-11-02	2025-05-24 13:27:28.690708	Cognitive Development	/research/1748093241495-Untitled-29.png	2025-05-24 13:27:43.419	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.569222/full	Media and Focused Attention Through Toddlerhood	Longitudinal Links Between Media Use and Focused Attention Through Toddlerhood	Higher Media Use Correlates With Reduced Focus:\n\n\n\n\n\nToddlers exposed to more than 3 hours/day of digital media exhibited shorter attention spans and less ability to sustain focus by age 3.\n\n\n\nCumulative Risk Matters:\n\n\n\n\n\nFactors such as lower parental engagement, noisy home environments, and increased screen time jointly exacerbated difficulties in focused attention.\n\n\n\nParental Mediation Helps:\n\n\n\n\n\nToddlers with active parental involvement during media use showed better attention outcomes compared to those left to engage with media passively.\n\n
91	Screen Time and Executive Function in Toddlerhood	This study examines the effects of screen time on executive function (EF) in toddlers, focusing on skills such as inhibitory control, working memory, and cognitive flexibility.	The chart compares EF scores for toddlers with varying screen time levels and media types.\n\nParticipants: 240 toddlers aged 18 months to 3 years.\n\nMethodology: EF tasks and parental reports on daily screen habits.\n\nImplications:\nLimiting screen time and prioritizing interactive media and screen-free play can support the development of executive function in toddlers.	Frontiers	2020-10-22	2025-05-24 13:30:18.582746	Cognitive Development	/research/1748093415414-Untitled-31.png	2025-05-24 13:30:18.582746	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.570392/full	Screen Time and Executive Function in Toddlerhood	A Longitudinal Study	Negative Effects of Excessive Screen Time:\n\n\n\n\n\nToddlers with >3 hours/day of screen time scored significantly lower on EF assessments.\n\n\n\nInteractive Media Mitigates Negative Impact:\n\n\n\n\n\nInteractive apps requiring problem-solving helped preserve EF compared to passive media.\n\n\n\nImportance of Screen-Free Play:\n\n\n\n\n\nScreen-free activities consistently yielded the highest EF scores.\n\n
92	Underestimating Screen Usage	With the rapid increase in digital media availability, traditional methods of assessing screen time are insufficient. This study introduces a comprehensive tool designed to capture the multifaceted nature of family media exposure, considering factors such as content, context, and the dynamic nature of modern media consumption.\n\n	The following bar chart illustrates the discrepancies between traditional self-reported screen time and the more comprehensive measurements obtained using the CAFE tool, highlighting the underestimation of media exposure when relying solely on self-reports.\n\nParticipants: Families with young children, 1074 Participants in total. \n\n\n\nMethodology: Development and preliminary testing of the CAFE tool, integrating self-reports, time-use diaries, and passive sensing to capture comprehensive media exposure data.\n\nImplications:\nThe findings underscore the importance of adopting comprehensive and nuanced measurement tools to assess family media exposure accurately. Such tools are crucial for understanding the relationship between media use and developmental outcomes in early childhood, informing both research and policy.	Frontiers	2020-07-10	2025-05-24 13:36:01.803288	Parental Guidance	/research/1748093667210-Untitled-33.png	2025-05-24 13:36:01.803288	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01283/full	Underestimating Screen Usage	"A Synergistic Approach to a More Comprehensive Assessment of Family Media Exposure During Early Childhood" addresses the complexities of measuring media exposure in families with young children.	Limitations of Traditional Measures: Conventional self-report surveys often fail to accurately capture the nuances of media use, including the type of content, the context in which media is consumed, and the interactive nature of modern devices.\n\n\n\nComprehensive Assessment Tool: The study presents the Comprehensive Assessment of Family Media Exposure (CAFE) tool, which combines a web-based questionnaire, time-use diary, and passive-sensing app installed on family mobile devices to provide a more accurate and detailed measurement of media exposure.\n\n\n\nPreliminary Data Insights: Initial data collected using the CAFE tool highlight the complexity of media use in households with young children, emphasizing the need for nuanced measurement approaches to understand the impact of media on child development.\n\n
93	Narrative Potential of Picture-Book Apps	This study explores how digital picture-book applications influence children’s narrative comprehension and engagement, emphasizing the interplay between interactivity and storytelling.	The chart compares narrative comprehension scores for print books, picture-book apps without guidance, and picture-book apps with guidance. It highlights the benefits of guided use and the potential distractions of overly stimulating features.\n\nParticipants: 200 children aged 4–8.\n\n\n\nMethodology: Children interacted with both print books and digital picture-book apps. Narrative understanding was assessed using comprehension quizzes and recall tasks.\n\nImplications\nInteractive picture-book apps can enhance narrative comprehension and engagement when designed thoughtfully. Adult guidance is crucial to help children focus on the story rather than being distracted by excessive multimedia elements.	Frontiers	2010-12-02	2025-05-24 14:02:57.293035	Learning Outcomes	/research/1748095369840-Untitled-34.png	2025-05-24 14:03:11.878	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.593482/full	Narrative Potential of Picture-Book Apps	Narrative Potential of Picture-Book Apps: A Media- and Interaction-Oriented Study.	Enhanced Engagement:\n\n\n\n\n\nChildren were more engaged with interactive picture-book apps than traditional print books.\n\n\n\nFeatures like animations and sound effects captivated attention but could distract from the narrative when overused.\n\n\n\nImproved Narrative Understanding:\n\n\n\n\n\nWell-designed interactive elements supported narrative comprehension, particularly for complex storylines.\n\n\n\nOverly stimulating features negatively impacted recall and understanding of key story elements.\n\n\n\nRole of Guided Use:\n\n\n\n\n\nChildren who interacted with picture-book apps alongside adult guidance showed greater narrative understanding compared to those using the apps alone.\n\n
94	Reading a Storybook Versus Viewing a Video	This study compares the effects of storybook reading and video viewing on children’s narrative elaboration abilities, highlighting the role of active engagement in storytelling.	The chart compares narrative elaboration scores between storybook reading and video viewing, highlighting the superior outcomes for storybook readers.\n\nParticipants: 120 children aged 4–6.\n\n\n\nMethodology: Children were randomly assigned to read a storybook or watch a video. Narrative elaboration was assessed through storytelling tasks immediately after the activity.\n\nImplications:\n\nEncouraging storybook reading, particularly with adult involvement, can enhance children’s narrative skills more effectively than video viewing. Active engagement and discussion are key to fostering comprehension.	Frontiers	2020-10-16	2025-05-24 14:07:24.922607	Learning Outcomes	/research/1748095640253-Untitled-35.png	2025-05-24 14:07:24.922607	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.569891/full	Reading a Storybook Versus Viewing a Video	 Children’s Narrative Elaboration After Reading a Storybook Versus Viewing a Video	Enhanced Elaboration Through Books:\n\n\n\n\n\nChildren who read a storybook demonstrated higher levels of narrative elaboration compared to those who viewed the same story as a video.\n\n\n\nActive Engagement Benefits:\n\n\n\n\n\nThe interactive nature of book reading encouraged children to make predictions, ask questions, and discuss characters, fostering narrative comprehension.\n\n\n\nLimited Benefits of Videos:\n\n\n\n\n\nWhile videos captured attention effectively, they resulted in less active participation and lower narrative elaboration scores.
95	Analysis of Teacher–Child Behaviors With Print and Digital Books	This study investigates teacher-child interactions before the start of reading sessions with both print and digital books, focusing on how preparatory behaviors influence engagement and comprehension.	The chart compares engagement levels across print and digital book sessions, highlighting the role of pre-reading discussions and technical interruptions.\n\nParticipants: 100 teacher-child pairs, with children aged 5–7.\n\n\n\nMethodology: Observations and video recordings of teacher-child interactions before reading sessions. Engagement and comprehension were assessed through observational scoring and post-reading quizzes.\n\nImplications:\n\nTeachers can enhance children's engagement and comprehension by focusing on story content during pre-reading discussions, regardless of medium. For digital books, ensuring technical fluency beforehand is essential to maintain focus on the story.	Frontiers	2020-11-12	2025-05-24 14:14:15.784322	Learning Outcomes	/research/1748096027889-Untitled-37.png	2025-05-24 14:14:15.784322	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.570652/full	Analysis of Teacher–Child Behaviors With Print and Digital Books	What Happens Before Book Reading Starts? An Analysis of Teacher–Child Interactions	Interaction Differences:\n\n\n\n\n\nTeachers were more likely to engage in discussions about cover illustrations, titles, and predictions with print books.\n\n\n\nWith digital books, interactions centered more on technical setup and navigation.\n\n\n\nEngagement Levels:\n\n\n\n\n\nChildren showed higher engagement during print book sessions when teachers initiated discussions about story content beforehand.\n\n\n\nDigital books led to fragmented engagement due to the need for troubleshooting or navigating features.\n\n\n\nTeacher Preparation:\n\n\n\n\n\nWell-prepared teachers who minimized technical interruptions during digital sessions maintained higher engagement levels among children.\n\n
96	Digital Media And Child Language Development at Age 2	This study investigates the relationship between digital media exposure and language development in two-year-old children.	The chart compares vocabulary scores across different types of media exposure.\n\nParticipants: 300 children aged 2 years.\n\n\n\nMethodology: Standardized language assessments and parent-reported media habits.\n\nImplications:\n\nLimiting passive media exposure and encouraging interactive media use with parental involvement can improve early language outcomes.	Frontiers	2021-03-18	2025-05-24 14:19:37.839527	Learning Outcomes	/research/1748096363679-Untitled-38.png	2025-05-24 14:19:37.839527	https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.569920/full	Digital Media And Child Language Development	Growing Up in a Digital World – Digital Media and the Association With the Child’s Language Development at Two Years of Age	Negative Correlation with Passive Media:\n\n\n\n\n\nChildren with higher exposure to passive media (e.g., TV) showed delayed vocabulary acquisition.\n\n\n\nPositive Impact of Interactive Media:\n\n\n\n\n\nEducational apps with parent-child interaction supported language development.\n\n\n\nParental Mediation:\n\n\n\n\n\nCo-viewing significantly enhanced children’s language outcomes.\n\n
\.


--
-- Data for Name: review_upvotes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.review_upvotes (id, user_id, review_id, created_at) FROM stdin;
7	7	5	2025-05-22 11:36:14.054268
10	7	8	2025-05-22 11:51:46.657621
11	7	9	2025-05-22 12:40:38.678394
12	8	17	2025-05-22 13:15:54.208515
13	8	16	2025-05-22 13:44:39.688942
14	7	18	2025-05-22 14:18:52.666278
15	8	18	2025-05-22 14:20:17.45805
18	18	9	2025-05-26 21:38:14.75437
19	1	23	2025-05-27 12:51:42.838856
20	1	18	2025-05-27 12:51:52.474952
21	1	5	2025-05-27 12:51:53.287184
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
HVirVP-KP26qPs65ZqH_Hn6ojJtA3VBR	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:37:24.775Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":12}}	2025-06-12 17:37:25
_A-paePaeLXPa6OH-U3pc1ISrbk5XRXU	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:25:53.565Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":15}}	2025-06-13 11:25:54
ndojOf67z1sGIc4dB4qyAk1IkXwc7hxF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:16:51.148Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-12 17:16:52
Rl3SahFcnSW_tkokNHXNTLJNBnQbH2zl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:44:33.753Z","secure":false,"httpOnly":true,"path":"/"}}	2025-06-12 17:44:34
SqU8pyalk2XCFrz0Zocf8afPtcWkyiYp	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:01:16.402Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:01:17
9_kd5yD_txZPXNTvIwUrfms1kbrzmqr2	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:03:02.761Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":3}}	2025-06-12 12:03:03
gfNW76PAOveG7ThRultQB76D2OGTUBIu	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:29:17.327Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":16}}	2025-06-13 11:29:18
I5cmt5idK0SSY1dPP1IivMv-BY2CG0Jg	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:43:48.740Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-12 17:43:49
MViik1ENfYXZrLCqw5ukSZMZixlgw_Vx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T16:55:21.894Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-12 16:55:22
lB83nzSmRT-rdPvSBg2I3HdX6qm9xxHl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:33:25.051Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":16}}	2025-06-13 11:33:26
sMSYUXS0JQjW6WK-pB6rWt-wLfC9AU27	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:13:42.119Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:13:43
y4NwfyCOj7xRDJVT7_pRmiKxyUpir6Cc	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:20:28.775Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-12 12:20:29
Mx5X5ZSKC3O74mELd-V_Vbvdunpm_llQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:46:51.726Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-12 17:46:52
5RITynVAWze4d3K2mBzKp4RlcIxF4HY1	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:42:21.289Z","secure":true,"httpOnly":true,"path":"/"}}	2025-06-13 11:42:22
rq7IqJ1rJqO10oOHg7pOvVojKTwofMRj	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:22:08.663Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":3}}	2025-06-12 12:22:09
-9MQxo88N1RLtbJ73e60UCwf9DJnINLk	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:42:29.644Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-13 11:42:30
8iBu7LyxosUBaJFun8-Mqhq4WHe4uD6F	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:26:42.550Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:26:43
6I8R3vE9QCZ_lqxc0mDy_8_0Iki12unC	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:35:06.399Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:35:07
2Cgcpu11DLR_LKaSnvpP92Ttg7fp63Vv	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T10:47:56.898Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-13 10:47:57
KK90A1aAlHZq09SxWQR83eZECdQiIlGy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T20:17:51.060Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 20:20:57
YBLEvjk2AiD_1xwM6bC19FG-LTmJWvyX	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:39:46.517Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":3}}	2025-06-12 12:39:47
Es7eg_kgdkr1sbF-g7N9h7rejPQ-3IQQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T11:38:16.907Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 11:38:17
vljxrujf2pVTJAW64VhE3u3mAFbed5p-	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T11:49:25.964Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 11:49:26
CZB655hoO-Tdygw0ddlCrDvJMY1A1Bns	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T11:56:47.318Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 11:56:48
VyIrJHetErXyQEN02hxRVuuqR3kK0fN0	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:00:46.198Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-12 12:00:47
3cyQkmSxjb4Ybu9O9buRUnDYl4-CNrWy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:45:27.115Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:45:28
uP4Woz9nwn52_xBpIPHZ7zxTmRj6ITZy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T10:59:31.056Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-13 10:59:32
xH3oXuFy7ePkl819rFGQTS8sDEynMdFV	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:51:01.010Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:51:02
2hKPjJgB2rSbLKUKwPa0EmsWamnI02GN	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:51:22.189Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":3}}	2025-06-12 12:51:23
JB3s8koa8o_HhVCJsQjC588zx3yc97Lr	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:51:32.232Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":4}}	2025-06-12 12:51:33
74y0tM83UvAQXVnlxhhEh1eBYbLfmcNk	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:52:35.935Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-12 12:52:36
y-BhcRRzkKL5Xsn14gOAsEE9g_0YJKOD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:53:36.419Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-06-12 12:53:37
ZK3Gbfq7f7GoIyf4rDvss6E1Kp923n9V	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T14:24:05.073Z","secure":false,"httpOnly":true,"path":"/"}}	2025-06-12 14:24:06
RrChdTV2rgic958qViInQfoqGX14sKFC	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T12:57:43.899Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":6}}	2025-06-12 12:57:44
8ECTLTpcN_dkVtGyljmBglcg4vYGXFf7	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-12T17:32:57.449Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":11}}	2025-06-12 17:32:58
z52S9EgcxgImWFhDulpne9o9B_2opoh4	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T10:56:09.195Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-24 10:56:10
HK8j8896IAECEMlc2Yx07gWxzHib8eBB	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:03:31.531Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:03:32
bZcOtY-EBrrU6nQfWqpIjR9rQQVfV3Sx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:15:23.299Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:15:24
ByhD-k7vTW0gbrkmb1U8GvdJBpXgLYiX	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T17:01:13.401Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-13 17:01:14
LFe4mCE4T8Dxn_wrxOfWYuWBZotXVNn4	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:30:03.172Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:30:04
ftTAnqG6ax17gcAjM_eUa2KpM4tUuNfx	{"cookie":{"originalMaxAge":2591999999,"expires":"2025-06-19T14:35:18.427Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 14:37:48
yInmbTGTeYA4Fis8yDLSKcagSN6fayPm	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:32:54.605Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:32:55
Z40h7PwMhRvtSdWdMbrlJcJPMeXidvno	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-14T08:53:20.430Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-14 08:53:21
23zyTKlkpCMRjSTCXqGXcCuRua9w0yCO	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T16:54:45.535Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 16:54:46
4GsDWrkoABQKYhyplpAu9r84-k2meJHa	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T18:20:17.037Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-18 18:20:18
nkNXyieMXqhRiBuid98sf83aTSaqIAKT	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T09:15:01.700Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-26 09:15:02
8XLgVDrvzXT7cI5_CMnYkdmJ3yz3lNmv	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T14:57:20.625Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 14:57:21
dEzd9WAp9fucoLzcVlI3O0mfpFrPnzGy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T18:35:01.061Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 18:35:02
Pd8XthiqqfEV4SxabmLDwgFCaNA_N0Kw	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T13:00:00.264Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 13:00:01
0fxh-OwUDz004smI3l9MfaglQNT0Y6Wt	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-09T12:52:41.174Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 19:42:59
3CFW6nO45zVB_SWzNevQ-0HmaiDdB7Vg	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T17:40:56.013Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 17:40:57
2aa6Ej2hrnO4XfDo5N4EMMaWU7NGWu5r	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-20T18:07:30.920Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-20 18:10:01
zKdxbxTcCVBg4oDL7-C4f-78A-Ioe4qQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-20T09:39:49.931Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-20 09:39:50
R0HywZn3WtZuwLd1Ub6-PCNYSMta6QLo	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-13T11:26:37.827Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":15}}	2025-06-13 11:26:38
b01i1UVurkBlvkPu_HfxlbSuDEdklp0L	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T16:18:48.187Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 16:18:49
QTaVJNUvqm4Cerexy_gDLc_PqAPMfioW	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T16:21:16.268Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-18 16:21:17
_Clj4YKwEQaD1GyoczNMigKXHDX_shZo	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-23T09:49:48.163Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-23 09:58:48
pgRs83VfJOrAsFguXHyZbHVAUsEHxHgQ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T11:26:22.987Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 11:53:40
7_PQT5Db8oN--gqcjDpV21XbtvlQOW-E	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T18:42:41.590Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-18 18:42:42
75RycHSYeHPwVsvor2iwjFuasf4uZD5B	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T16:58:58.462Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 16:58:59
dwJGFEKGYJNVL5vGXzQVjs13Dmvtl9pm	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T19:34:51.879Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-19 19:34:52
C7eajiUyYK7n3KqAZ5r1Hdz_yw63sXr6	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-21T12:21:32.263Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-21 12:24:09
u6WsJnjAAYg5qHqTMgKoNd4-oXcWx6rJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T23:22:35.929Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 23:25:12
81lN_KhiptWLNUcT9vp4Rx7ozumsGQ0d	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T09:32:33.073Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 09:32:34
jlgPnYQ4G6KT2Hfye2lhT4B3LHxgIDBX	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T09:34:43.135Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 09:34:44
TiqzfZ4eM5Qr-eIpN1vpAdQhGX4UuI4p	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-18T17:02:19.503Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-18 17:02:20
ZUi5rRZeYrdlXMkhIABd462JVtCEsoYs	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T09:37:12.134Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 09:37:13
LBv8ih_COllsxUKZ2wNbymVC_EsTo1kI	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-19T09:40:30.573Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-19 09:40:31
g8HsPYTBDlP4OShw4TXxbh6Tx-w2PGFy	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-22T01:19:27.858Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-22 01:19:28
o9OSg5dfXeqzZOSsGrAYoLrQim2QctGV	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-22T01:18:29.228Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-22 01:18:30
prxpgf-ZiDh8HpDbmVetNYhagVVeqrn0	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-22T01:20:18.307Z","secure":true,"httpOnly":true,"path":"/"}}	2025-06-22 01:20:19
nFey4mXEPUT1W_M5gE45vWnUAM8OpxfE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:06:52.684Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:06:53
VYXSE-2sNZ3KIkUhY3hrkfliQ9PZzDYh	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T10:16:24.231Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-27 10:16:25
k9prnm85omKNU4fMKAUup9bbyFcEwxb8	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:44:23.564Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:44:24
HrqBmtb2Zc0w7o9ejQ0DqUKNLsZEl06F	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:42:51.572Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:42:52
7i5mqwYziSfzet5mQ-GZlz9jy2kLMpz_	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:47:52.284Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:47:53
BOqAk5djSdfWIcNw1sey_NnedgGXRf86	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T10:13:27.869Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-27 10:13:28
ImLfT02zjUqFQ21r9stqbXJVBv2-8nxt	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:54:58.708Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:54:59
SiwQ9RQlUwc06QAyF0sAKP-LfxTiQTo2	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:40:14.081Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:40:15
f-SyWa-hgZnB_vFDeFSjG-L20ZKdUhSZ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:18:59.634Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:19:00
dWkR95PDt8ssenf8h1FiuyuOmGcX9Y75	{"cookie":{"originalMaxAge":2591999999,"expires":"2025-06-23T13:57:20.466Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-24 08:53:55
WN4NhqDkYQ1nahqfLJkriVha5P513ViI	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T17:59:43.346Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 17:59:44
a2nFcXb67CVV2jCVF8rWq0IBDhIZeiZJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:53:03.314Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:53:04
n-vxN3DOcj7AYutRulBDrpjh24UaAm96	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:50:19.828Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:50:20
_7ExKnnnaRRYNj0-2Llmv319hgALAytY	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:37:26.109Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:37:27
GEN5UyAicHzuBJqlinbyczCXqYP9jCSY	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T13:52:30.295Z","secure":false,"httpOnly":true,"path":"/"}}	2025-06-26 13:52:31
u6uQ4RXnlVV8aV_aXyAj2oFmYw4oj7cu	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:56:22.611Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:56:23
Zmysv6gYeG3p8NVMast7nXrwGatxbZnx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:35:10.113Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:35:11
m0nGdtFPeTr9bHnuqu0Avd3O09D183UV	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T09:20:21.993Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-26 09:20:22
iQ0kmBXwfCCi93N-S1P-oNmrNxmRyJyp	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:58:07.462Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:58:08
IS7NvkJIU3Gqu1hUXdwytcuiQrFauwMx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:58:51.805Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:58:52
H04wwoHktn82F51oeCBnJSmvqgJs70Zx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:46:06.756Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:46:07
sIdgZFbGX4APhF1jx8lk9gAZUXS0Y6EK	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T14:14:30.652Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 14:24:16
A8qPWHpJVeU0PWEfL53zn_CIA7WJfyH0	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T10:45:58.260Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-06-24 10:45:59
gReLBNEZIYYpmt6KZPSpcdYAj2g31DZx	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-25T19:50:18.373Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-25 19:59:31
NH5gV8Db0Fe-2tsKYbS2_4M5o5NILI71	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T11:25:14.564Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 11:25:15
LJJTIexBqbOBWmMV951DPwQWuKAxU7tl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-25T23:33:18.021Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":18}}	2025-06-25 23:33:30
9JVCh4W1-9NKqcqLLg282y2jArOuueJU	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-24T19:00:45.717Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-24 19:05:48
d3j8TxJcL0Q4S54Zy-6ows3aeYiWpd_i	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T17:48:51.461Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 17:48:52
MZNUAM6xgoX55wwY7KPEZL8iUrXZL8ZD	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:26:13.276Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:26:14
de0780DtCMSwbEsH4utUp6G0eKdB2b3F	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:02:03.785Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:02:04
zy67WZ1goqsOdV3lCsqiIzHWYIKdPfKP	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T14:57:50.655Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 14:57:51
91-nkUm5T9BBt9Df0KuHu3dtmwLIHjIp	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:45:49.943Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:45:50
yycniLAnuf6ejX--V3dnXkk32J6Ogpcq	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T18:51:20.878Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 18:51:21
feMpb7eleVLzGmi2msWRGhJMSxNTFbe7	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:03:27.652Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:03:28
dle3RD01waEJV2N60cG5ogkT6MqIK7Zn	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:07:43.787Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:07:44
2mVkNMBH4_wa5_NveOfVuCFU87i_iGBE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:33:34.220Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:33:35
Syu13_TgNGVUEyv63IakaibXzHvXTIhn	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:40:33.255Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:40:34
bNmZj9WlmivKHvQx-GrRvmG8d0PvNpkz	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:42:37.693Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:42:38
iIrL4DA1NUn3E4vUBes6SHD1OnkUFEHw	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T10:14:32.646Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-27 10:31:59
6Ly6sPxfb_FIqfOIbvlll9sbDRhJwRhY	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T09:03:07.516Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-27 09:03:08
CKSkNKzIpqN2V8S99FsQEOOOItlcL6aS	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:51:34.401Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:51:35
aIyZT5nhfknM0CQei096WM8VwZJLCD6s	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T09:04:26.454Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-27 09:04:27
cX4Ub5L60ZIxYQmEJSREm9IZcfFS_jMv	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T09:07:31.911Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-27 09:07:32
R2FYbOdCrJgxe09__OTW9bGZ2fZrULdm	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-26T19:46:14.086Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 19:46:15
foGkIA-rzSLrSiWDQXF5kMCkumy8bdEE	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T13:41:59.557Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-27 14:23:16
KPVFQo4xYd-TJWY308ajGRuJtT-vBtu7	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T14:13:04.611Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":18}}	2025-06-27 14:23:17
5_POSsMtEX2G7Fm1_HzW8H2SLkSKBnLA	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-27T10:09:13.567Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":7}}	2025-06-27 10:32:08
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: show_submissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.show_submissions (id, user_id, show_name, description, suggested_age_range, suggested_themes, status, admin_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: themes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.themes (id, name) FROM stdin;
1	Learning through Songs
2	Horses
3	African folk tales
5	Arts & Crafts
6	Martial Arts
7	Slice of Life
8	Elementary-Basics
9	Mechanics
10	Learn Through Play
11	Choreographed Action Scenes
12	Pet Ownership
13	Paleontology
14	Biblical Stories
15	Cultural Appreciation
16	Community Service
17	Phonics
18	Experimentation
19	Engineering Concepts
20	Animals
21	Geography
22	Frequent Whining
23	Sensory Exploration
24	Speech Development
25	Deaf Community
26	Unboxing Videos
27	Family Values
28	Empathy
29	Nature
30	Physical Fitness
31	Recurring Antagonist
32	Traditional Narratives
33	Adventure
34	Learning Disabilities
35	Early Childhood experiences
37	Medical Care
38	Hobbies
39	Dark Themes
40	Surreal Imagery
41	Stop-Motion
42	Colour Combinations
43	Hyper-Activity
44	Lack of Consequences
45	Toy Review
46	Farm Life
47	Spacetime and the Cosmos
48	Leadership
49	Cause and Effect
50	Mature Themes
51	Skit Comedy
52	Outdoor Exploration
53	Memory Exercises
54	Dutch Language
55	Self Discipline
56	Intense Animal Interaction
57	Vehicle Recognition
58	Natural Science
59	ASMR
60	Tantrums
61	Patience
62	Exercise
63	Religious Teachings
64	Teamwork
65	Complex & Emotional Themes
66	Dinosaurs
67	Life Lessons
68	Positive Role Models
69	MineCraft
70	Merit Reward systems
71	Cultural & Social
72	Bedtime Routines
73	Read-Along
74	Motor Skills
75	Science
76	Responsibility
77	Slapstic Comedy
78	Biblical Teachings
79	Perseverance
80	Mild Violent themes
81	Morality
82	Gentle Humour
83	Shapes
84	Repetitive Learning
85	Vocabulary
86	Christian Values
87	Math
88	Positve Mindset
89	Makaton Sign Language
90	Arabic Language Learning
91	Relatable Situations
92	Politcal Leanings
93	Te reo Māori language development
94	Learning from Mistakes
95	Entertainment
96	Toilet Humour
97	Mild Intense Scenes
98	Technology
99	Career Exploration
100	Vehicle Themes
101	Light Hearted
102	Communication and Expression
103	Curiosity
104	Fantasy Elements
105	Painting
106	Story Telling without Dialogue
107	Problem Solving
108	Communiction & Expression
109	Social Development
111	Multi-Lingual Learning
112	Insect Behaviour
113	Discovery
114	Colours
115	Overcoming Fears
116	Positive Engaging Screen-Time
117	Silly Comedy
118	Confidence Building
119	Literacy
120	Quranic stories
121	History
122	Music
123	Safety
124	Dance
125	Critical Thinking
126	Travel Geography
127	Complex Emotional Themes
128	Yoga
129	Nature Sounds
130	DIY Projects
131	Mystery
132	Reading Comprehension
133	Natural World
134	Machinery
135	Auslan (Sign Language)
136	Relaxation
137	Preschool-Basics
138	Enviromental Awareness
139	Community
140	Construction
141	Teaching with Toys
142	Social-Emotional
143	Exploration
144	Visual Demonstrations
145	Art
146	Numeracy
147	Faith
148	Mindfulness
149	Spiritual Development
150	Mischievious Behaviour
151	Family Relationships
152	Mild Peril
153	American Sign Language
154	Captivating Visuals
155	Super Hero Themes
156	Emotional Intelligence
157	Religion
158	Drawing
159	Origami
110	Sing Along
160	Routine
161	Interactive Game Elements
162	Health & Well-being
163	Agriculture
164	Spanish Language
165	Realistic Depictions of Nature
166	Healthy Eating
167	Instruments
168	Wildlife Exploration
169	Mild Mature Themes
170	Wild Animal Captures and Cooking
171	Marine Bioligy
172	Locomotive History
173	Natural History
175	Language Learning
176	Wildlife Conservation
177	Rivalry
178	Building and Design
179	Diversity
180	Friendship
181	Mild Fantasy Violence
182	Māori immersion preschool
183	Cultures & Traditions
184	Ecosystems
185	Creativity & Imagination
186	Trains
187	Humor
188	Ballet
189	Cognitive Development
190	Conflict Resolution
191	STEM
192	Animal Behaviour
193	Exploring Emotions
194	Every Day Concepts
195	Courage
196	Protagonist
390	Animal Behavior
\.


--
-- Data for Name: tv_show_platforms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_show_platforms (id, tv_show_id, platform_id) FROM stdin;
1	15	1
2	12	2
4	16	1
5	17	1
6	10	1
7	9	2
8	26	1
9	23	1
10	22	1
11	30	1
12	31	1
13	53	1
14	35	2
15	21	1
16	20	1
17	19	1
18	29	1
19	33	1
20	24	1
21	27	1
22	46	1
23	43	1
24	38	1
25	39	1
26	40	2
27	47	1
28	49	1
29	42	1
30	50	1
31	44	2
32	37	1
33	52	2
34	67	1
35	69	1
36	70	1
37	56	2
38	65	2
39	61	1
40	63	1
41	59	1
42	62	2
43	68	1
44	58	2
45	64	2
46	60	1
47	71	1
48	76	1
49	74	1
50	77	1
51	87	1
52	75	1
53	85	1
54	82	1
55	89	2
56	88	1
57	81	2
58	79	1
59	73	2
60	86	1
61	83	1
62	80	1
63	102	1
64	99	1
65	97	1
66	103	2
67	104	1
68	100	1
69	105	2
70	92	1
71	107	1
72	93	2
73	98	1
74	95	1
75	108	2
76	114	2
77	112	1
78	121	1
79	124	1
80	120	2
81	122	1
82	117	2
83	126	2
85	113	1
86	111	1
87	110	1
88	118	1
89	125	2
90	54	1
91	135	1
92	72	1
93	133	1
94	28	2
95	109	1
96	130	1
97	134	1
98	132	1
99	131	1
100	91	1
101	129	2
102	18	1
103	140	1
104	150	1
105	142	1
106	139	1
107	143	1
108	149	2
109	145	2
110	137	1
111	146	1
112	141	1
113	138	2
114	144	2
115	148	2
116	162	1
117	156	1
118	157	1
119	169	1
120	160	1
121	168	1
122	167	1
123	170	1
124	155	2
125	164	1
126	161	2
127	166	2
128	154	1
129	163	1
130	180	1
131	182	1
132	183	1
133	185	2
134	175	1
135	181	1
136	174	1
137	176	1
138	186	1
139	177	1
140	188	1
141	187	1
142	172	1
143	173	1
144	200	1
145	201	1
146	202	1
147	203	1
148	204	1
149	198	2
150	193	1
151	197	1
152	194	1
153	196	2
154	191	1
155	206	1
156	190	1
157	192	1
158	218	1
159	219	1
160	223	1
161	222	1
162	224	1
163	208	1
164	221	2
165	210	1
166	211	1
167	217	2
168	215	1
169	212	1
170	209	2
171	234	1
172	241	1
173	237	1
174	236	1
175	242	1
176	230	1
177	232	1
178	227	2
179	228	1
180	238	1
181	229	1
182	226	1
183	231	1
184	249	1
185	253	1
186	254	1
187	255	1
188	257	1
189	258	1
190	259	1
191	247	1
192	256	1
193	248	1
194	250	1
195	251	2
196	244	1
197	266	1
198	269	1
199	267	1
200	268	2
201	270	1
202	271	1
203	274	1
204	265	1
205	261	1
206	262	1
207	264	1
208	273	1
209	263	2
210	243	1
211	225	1
212	189	1
213	171	1
214	151	1
215	276	1
216	136	1
217	277	1
218	115	2
219	207	1
220	153	1
221	275	1
222	233	2
223	283	1
224	284	1
225	285	1
226	278	1
227	287	1
228	289	1
229	288	1
230	282	1
231	286	1
232	280	1
233	281	1
234	291	2
235	290	2
237	296	1
238	297	1
239	292	1
240	295	1
241	25	1
242	300	1
243	294	1
244	298	1
245	293	1
246	299	2
247	78	1
248	66	1
249	101	2
250	90	2
251	96	2
252	123	2
253	41	1
254	84	1
255	32	1
256	34	1
257	127	2
258	106	1
259	179	1
260	94	1
261	152	1
262	213	1
263	51	2
264	55	2
265	147	2
266	45	1
267	116	2
269	158	2
270	195	1
271	199	1
272	205	1
273	235	1
274	184	1
275	220	1
276	178	1
277	165	2
278	214	1
279	239	1
280	159	2
281	216	1
282	252	1
283	246	1
284	272	1
285	3	2
286	260	1
287	57	1
288	48	2
289	240	2
290	245	1
291	36	2
292	279	2
294	2	2
296	128	2
297	13	2
298	14	2
299	4	2
301	11	2
302	5	2
304	322	2
308	119	2
309	8	2
310	6	2
311	1	2
312	7	2
\.


--
-- Data for Name: tv_show_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_show_reviews (id, tv_show_id, user_name, rating, review, user_id, created_at, show_name) FROM stdin;
5	286	uschooler	5	We reviewed this show! It's a really good one for children under 6. Low-stimulation, promoting imaginative play and social-emotional learning	8	2025-05-21 23:16:34.376858	Tweedy & Fluff
7	31	uschooler	5	One of the greats\n	8	2025-05-21 23:24:14.709678	Bluey 2018-present
8	8	uschooler	1	Too many fast scene changes to be safe for a baby	8	2025-05-22 09:09:57.88387	Amakandu
9	322	uschooler	3	Fun show - but we had behavioural issues from over watching. Super stimulating	8	2025-05-22 09:14:54.332969	Blaze and the Monster Machines
11	70	uschooler	2	High Stimulation Dinosaur learning show	8	2025-05-22 09:22:30.685866	Dinosaur train
13	322	haseeb	2	Big behavioural consequences for STEM learning	7	2025-05-22 12:41:59.202765	\N
14	8	haseeb	1	made me dizzy 	7	2025-05-22 12:47:42.744726	\N
15	13	haseeb	5	GOAT'd	7	2025-05-22 13:01:13.246355	\N
16	22	haseeb	5	wholesome!	7	2025-05-22 13:02:34.605236	\N
17	252	haseeb	5	Relatable stories! Great show	7	2025-05-22 13:15:06.910748	\N
18	286	haseeb1	5	cute show	15	2025-05-22 14:17:58.704523	\N
22	8	H4z4ko	4	ASMR YT channel with No dialogue but alot of sound effects Videos include marble run race tracks made with sand, wood, carboard and other interesting home made obstacles. Different from alot of other channels and fun to watch together.	18	2025-05-26 21:26:59.359923	\N
23	286	H4z4ko	5	Bite sized episodes short and sweet great for bedtime viewing. The narrator is Nina Wadia and her voice is very soothing. Recommended!	18	2025-05-26 21:51:46.989935	\N
\.


--
-- Data for Name: tv_show_searches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_show_searches (id, tv_show_id, search_count, last_searched) FROM stdin;
141	11	2	2025-05-27 13:46:23.288558
143	41	2	2025-05-27 14:55:58.459566
145	33	2	2025-05-27 16:31:11.57813
147	205	2	2025-05-27 16:34:12.844837
149	219	2	2025-05-27 16:36:51.735013
53	322	3	2025-05-28 13:20:36.544586
25	286	23	2025-05-28 13:27:37.602338
23	8	2	2025-05-21 18:03:18.252783
159	222	4	2025-05-28 13:31:24.208538
163	102	2	2025-05-28 13:32:39.787059
165	162	1	2025-05-28 13:43:06.271121
30	285	3	2025-05-21 22:53:55.071472
166	171	2	2025-05-28 13:59:21.38266
168	97	2	2025-05-28 14:07:33.20094
60	21	2	2025-05-22 09:52:52.340705
52	53	3	2025-05-22 09:53:36.353225
64	5	1	2025-05-22 09:56:43.742228
40	31	12	2025-05-22 12:13:45.237108
65	122	2	2025-05-22 12:14:20.728442
33	13	4	2025-05-22 13:00:59.102975
73	252	3	2025-05-22 13:15:50.267394
54	1	8	2025-05-22 14:48:17.174554
12	7	10	2025-05-26 19:33:33.52032
7	176	10	2025-05-26 19:35:31.812297
129	29	2	2025-05-26 20:53:41.563454
1	22	59	2025-05-26 20:54:33.218445
139	62	1	2025-05-27 11:04:06.614919
\.


--
-- Data for Name: tv_show_themes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_show_themes (id, tv_show_id, theme_id) FROM stdin;
24	16	185
25	16	175
26	16	84
27	16	142
28	16	17
45	9	66
46	9	13
47	9	33
48	9	75
49	9	173
50	9	103
51	26	191
52	26	49
53	26	123
54	26	113
55	26	75
56	26	125
57	26	18
58	26	103
59	26	133
60	26	107
61	23	185
62	23	180
63	23	107
64	23	156
65	23	33
66	23	64
67	23	79
68	23	103
69	22	142
70	22	180
71	22	160
72	22	107
73	22	156
74	22	109
75	22	91
76	22	110
77	22	72
78	30	137
79	30	156
80	30	125
81	30	107
82	31	185
83	31	156
84	31	190
85	31	27
86	31	151
87	53	137
88	53	146
89	53	119
90	53	83
91	53	160
92	53	142
93	53	189
94	53	175
95	53	110
96	35	137
97	35	119
98	35	146
99	35	114
100	35	20
101	35	142
102	35	110
103	35	124
104	35	17
105	35	85
106	35	62
107	21	107
108	21	64
109	21	131
110	21	95
111	21	187
112	21	125
113	21	152
114	21	181
115	20	137
116	20	124
117	20	142
118	20	180
119	20	146
120	20	119
121	20	122
122	20	64
123	20	83
124	20	156
125	20	110
126	19	138
127	19	185
128	19	142
129	29	137
130	29	156
131	29	125
132	29	107
133	33	185
134	33	107
135	33	180
136	33	64
137	33	84
138	24	185
139	24	107
140	24	180
141	24	64
142	27	109
143	27	156
144	27	107
145	46	115
146	46	142
147	46	180
148	46	107
149	46	27
150	46	156
151	46	79
152	43	94
153	43	156
154	43	142
155	43	109
156	43	180
157	38	191
158	38	185
159	38	19
160	38	64
161	38	125
162	39	142
163	39	151
164	39	91
165	39	61
166	39	156
167	39	190
168	39	180
169	39	22
170	39	60
171	39	44
172	40	137
173	40	35
174	40	191
175	40	8
176	40	71
177	40	110
178	40	124
179	40	122
180	40	142
181	40	119
182	40	146
183	40	109
184	40	156
185	40	74
186	47	16
187	47	64
188	47	76
189	47	107
190	49	156
191	49	109
192	49	107
193	49	180
194	49	139
195	42	155
196	42	138
197	42	64
198	42	184
199	42	76
200	42	109
201	42	95
202	42	152
203	50	156
204	50	180
205	50	107
206	50	109
207	50	139
208	44	137
209	44	122
210	44	110
211	44	85
212	44	124
213	44	136
214	44	84
215	44	175
216	44	119
217	44	146
218	44	17
219	44	160
220	44	72
221	44	74
222	44	23
223	44	189
224	37	8
225	37	87
226	37	119
227	37	75
228	37	142
229	37	64
230	37	110
231	37	107
232	37	146
233	37	189
234	52	19
235	52	15
236	52	172
237	52	121
238	52	38
239	52	95
240	52	126
241	52	103
242	52	134
243	52	186
244	67	64
245	67	180
246	67	79
247	67	95
248	67	33
249	67	104
250	67	181
251	69	64
252	69	76
253	69	107
254	69	33
255	69	66
256	70	191
257	70	180
258	70	13
259	70	173
260	70	66
261	70	133
262	70	143
263	70	75
264	56	67
265	56	116
266	56	148
267	56	62
268	56	128
269	56	156
270	56	160
271	56	23
272	56	136
273	56	110
274	56	88
275	65	63
276	65	15
277	65	183
278	65	149
279	65	14
280	65	157
281	65	110
282	65	27
283	65	122
284	65	86
285	65	147
286	65	142
287	61	108
288	61	67
289	61	142
290	61	156
291	61	107
292	61	109
293	61	91
294	61	180
295	61	151
296	63	49
297	63	67
298	63	81
299	63	27
300	63	157
301	63	76
302	63	156
303	59	191
304	59	74
305	59	113
306	59	75
307	59	103
308	59	143
309	62	30
310	62	15
311	62	185
312	62	137
313	62	110
314	62	17
315	62	95
316	62	161
317	62	124
318	62	84
319	62	122
320	62	62
321	68	185
322	68	13
323	68	75
324	68	103
325	68	107
326	68	125
327	68	173
328	68	184
329	58	183
330	58	71
331	58	68
332	58	67
333	58	143
334	58	91
335	58	85
336	58	109
337	58	142
338	58	103
339	58	121
340	58	33
341	58	113
342	58	126
343	64	185
344	64	27
345	64	151
346	64	91
347	64	107
348	64	85
349	64	54
350	60	191
351	60	107
352	60	125
353	60	87
354	60	75
355	60	95
356	71	185
357	71	64
358	71	95
359	71	107
360	71	19
361	71	66
362	71	79
363	76	185
364	76	156
365	76	64
366	76	109
367	76	142
368	76	107
369	76	79
370	74	8
371	74	175
372	74	107
373	74	21
374	74	64
375	74	189
376	74	33
377	77	107
378	77	180
379	77	142
380	77	64
381	77	156
382	77	109
383	87	180
384	87	107
385	87	156
386	87	29
387	87	91
388	87	61
389	75	155
390	75	68
391	75	95
392	75	33
393	75	6
394	75	104
395	75	81
396	75	80
397	75	181
398	75	152
399	85	142
400	85	180
401	85	107
402	85	91
403	82	107
404	82	64
405	82	187
406	82	109
407	82	79
408	89	100
409	89	19
410	89	9
411	89	64
412	89	83
413	89	114
414	88	185
415	88	107
416	88	156
417	81	1
418	81	84
419	81	119
420	81	17
421	81	85
422	81	122
423	81	146
424	81	114
425	81	83
426	81	189
427	81	175
428	81	110
429	79	15
430	79	183
431	79	68
432	79	48
433	79	76
434	79	156
435	79	81
436	73	137
437	73	1
438	73	124
439	73	110
440	73	189
441	73	119
442	73	146
443	73	114
444	73	83
445	73	20
446	73	142
447	73	84
448	73	122
454	83	68
455	83	16
456	83	123
457	83	64
458	83	107
459	83	76
460	80	137
461	80	74
462	80	110
463	80	124
464	80	142
465	80	146
466	80	119
467	80	114
468	80	83
478	99	71
479	99	67
480	99	183
481	99	15
482	99	110
483	99	124
484	99	142
485	99	109
486	99	122
493	103	100
494	103	64
495	103	114
496	103	83
497	103	107
498	103	57
499	103	95
500	103	9
501	104	191
502	104	155
503	104	107
504	104	64
505	104	156
506	104	103
507	104	125
508	104	75
509	100	185
510	100	107
511	100	79
512	105	35
513	105	23
514	105	114
515	105	74
516	105	122
517	92	33
518	92	107
519	92	64
520	92	66
521	92	95
522	107	185
523	107	49
524	107	81
525	107	187
526	107	95
527	107	150
534	98	156
535	98	180
536	98	27
537	98	142
538	95	185
539	95	107
540	95	180
541	95	64
542	95	125
543	95	91
554	114	183
555	114	15
556	114	1
557	114	54
558	114	175
559	114	110
560	114	124
561	114	119
562	114	122
563	112	185
564	112	180
565	112	107
566	112	64
567	121	185
568	121	142
569	121	107
570	121	180
571	124	30
572	124	68
573	124	166
574	124	64
575	124	107
576	124	62
577	124	74
578	124	110
579	124	124
580	124	79
581	120	100
582	120	10
583	120	185
584	120	142
585	120	187
586	120	52
587	120	130
588	120	103
589	120	117
590	122	142
591	122	180
592	122	29
593	122	156
594	122	148
595	117	29
596	117	151
597	117	20
598	117	129
599	117	107
600	117	109
601	117	95
602	117	187
603	117	142
604	126	168
605	126	176
606	126	20
607	126	192
608	126	103
609	126	107
610	126	29
611	126	133
612	126	76
613	119	185
614	119	107
615	119	180
616	119	156
617	119	190
618	119	151
619	119	27
620	119	142
621	119	109
622	119	91
623	113	183
624	113	151
625	113	27
626	113	91
627	113	156
628	111	138
629	111	75
630	111	180
631	111	29
632	111	184
633	111	103
634	110	137
635	110	23
636	110	84
637	110	74
638	110	189
639	118	15
640	118	183
641	118	71
642	118	103
643	118	142
644	118	91
645	118	157
646	118	81
654	54	185
655	54	64
656	54	107
657	54	195
658	54	150
659	54	181
660	135	185
661	135	191
662	135	107
663	135	74
664	135	103
665	135	125
666	135	91
667	72	162
668	72	142
669	72	107
670	72	156
671	72	37
672	72	103
673	133	142
674	133	27
675	133	107
676	133	91
677	133	109
678	133	156
679	28	137
680	28	35
681	28	185
682	28	103
683	28	20
684	28	133
685	28	143
686	28	110
687	28	124
688	28	85
689	28	33
690	28	117
691	28	114
692	28	83
693	28	29
694	28	43
695	109	67
696	109	49
697	109	185
698	109	107
699	109	103
700	109	125
701	109	189
702	130	137
703	130	146
704	130	119
705	130	160
706	130	142
707	130	110
708	130	189
709	130	84
710	134	115
711	134	156
712	134	91
713	134	185
714	134	31
715	132	15
716	132	122
717	132	145
718	132	107
719	132	189
720	132	64
721	132	121
722	131	185
723	131	151
724	131	109
725	131	156
726	131	27
727	91	107
728	91	64
729	91	156
730	91	79
731	91	109
732	129	1
733	129	183
734	129	71
735	129	149
736	129	147
737	129	14
738	129	157
739	129	86
740	129	81
741	129	110
742	129	109
743	129	88
744	18	180
745	18	107
746	18	142
747	18	110
748	18	84
749	140	185
750	140	180
751	140	107
752	140	61
753	140	187
754	140	150
755	150	68
756	150	185
757	150	5
758	150	103
759	150	74
760	150	145
761	150	114
762	142	35
763	142	142
764	142	109
765	142	64
766	142	156
767	139	185
768	139	104
769	139	107
770	139	79
771	139	33
772	139	64
773	139	125
774	139	152
775	139	181
776	143	71
777	143	99
778	143	64
779	143	107
780	143	76
781	143	103
782	149	35
783	149	17
784	149	175
785	149	24
786	149	110
787	149	189
788	149	142
789	145	138
790	145	106
791	145	185
792	145	112
793	145	29
794	145	129
795	145	95
796	145	187
797	145	136
798	145	122
799	145	133
800	145	59
801	145	117
802	145	184
803	145	7
804	145	101
805	137	185
806	137	180
807	137	107
808	137	156
809	146	68
810	146	183
811	146	15
812	146	107
813	146	125
814	146	131
815	146	33
816	146	103
817	141	35
818	141	137
819	141	146
820	141	64
821	141	83
822	141	189
823	138	5
824	138	185
825	138	178
826	138	95
827	138	187
828	138	107
829	138	125
830	138	69
831	138	161
832	144	63
833	144	68
834	144	149
835	144	183
836	144	71
837	144	14
838	144	147
839	144	157
840	144	86
841	144	81
842	144	88
843	148	1
844	148	137
845	148	35
846	148	119
847	148	146
848	148	85
849	148	122
850	148	175
851	148	17
852	148	110
853	148	189
854	148	135
864	156	185
865	156	187
866	156	95
867	156	107
868	156	150
869	157	185
870	157	191
871	157	9
872	157	107
873	157	19
874	169	185
875	169	187
876	169	107
877	169	95
878	169	77
879	169	150
880	160	108
881	160	185
882	160	142
883	160	156
884	160	110
885	160	124
886	160	122
887	168	191
888	168	87
889	168	146
890	168	64
891	168	125
892	168	107
893	167	8
894	167	146
895	167	107
896	167	87
897	167	84
898	170	185
899	170	142
900	170	107
901	170	64
902	170	79
903	155	137
904	155	1
905	155	185
906	155	119
907	155	146
908	155	175
909	155	24
910	155	110
911	155	124
912	155	122
913	155	189
914	164	180
915	164	107
916	164	33
917	164	142
918	164	109
919	161	155
920	161	185
921	161	68
922	161	30
923	161	62
924	161	33
925	161	95
926	161	51
927	161	11
928	161	52
929	161	195
930	161	118
931	161	6
932	161	80
933	161	150
934	166	106
935	166	185
936	166	187
937	166	117
938	166	154
939	166	180
940	166	20
941	154	35
942	154	137
943	154	185
944	154	142
945	163	180
946	163	107
947	163	33
948	163	142
949	163	109
950	180	138
951	180	33
952	180	107
953	180	29
954	180	64
955	180	195
956	182	142
957	182	151
958	182	156
959	182	150
960	183	185
961	183	145
962	183	122
963	183	107
964	183	64
965	183	74
966	185	93
967	185	183
968	185	15
969	185	182
970	185	71
971	185	146
972	185	119
973	185	32
974	185	110
975	175	115
976	175	72
977	175	142
978	175	136
979	175	151
980	175	156
981	181	191
982	181	185
983	181	107
984	181	103
985	181	33
986	181	187
987	181	151
988	181	95
989	181	19
990	181	150
991	174	185
992	174	5
993	174	122
994	174	74
995	174	142
996	174	114
997	174	83
998	174	145
999	176	16
1000	176	64
1001	176	107
1002	176	195
1009	177	87
1010	177	107
1011	177	125
1012	177	33
1013	177	79
1014	188	185
1015	188	137
1016	188	146
1017	188	119
1018	188	83
1019	188	114
1020	188	142
1021	188	107
1022	188	110
1023	187	138
1024	187	133
1025	187	29
1026	187	173
1027	187	168
1028	187	75
1029	187	165
1030	172	183
1031	172	185
1032	172	65
1033	172	64
1034	172	79
1035	172	81
1036	172	95
1037	172	187
1038	172	77
1039	172	156
1040	172	180
1041	172	142
1042	172	33
1043	172	80
1044	172	181
1045	172	152
1046	172	169
1047	173	180
1048	173	107
1049	173	142
1050	173	109
1051	173	125
1052	173	190
1053	173	156
1054	173	91
1055	173	151
1056	200	30
1057	200	8
1058	200	110
1059	200	124
1060	200	122
1061	200	180
1062	200	74
1063	200	84
1064	200	95
1065	200	146
1066	200	119
1067	200	142
1068	201	138
1069	201	184
1070	201	171
1071	201	103
1072	201	109
1073	201	156
1074	201	176
1075	201	133
1076	201	64
1077	202	175
1078	202	119
1079	202	110
1080	202	189
1081	202	142
1082	202	84
1083	202	122
1084	203	71
1085	203	123
1086	203	64
1087	203	107
1088	203	33
1089	203	16
1090	203	109
1091	203	142
1092	204	185
1093	204	180
1094	204	107
1095	204	33
1096	204	142
1097	204	125
1098	198	19
1099	198	100
1100	198	57
1101	198	134
1102	198	136
1103	198	95
1104	198	38
1105	198	9
1106	193	138
1107	193	29
1108	193	168
1109	193	151
1110	193	107
1111	197	185
1112	197	67
1113	197	115
1114	197	33
1115	197	195
1116	197	180
1117	197	156
1118	197	107
1119	197	79
1120	197	97
1121	194	185
1122	194	33
1123	194	107
1124	194	64
1125	194	142
1126	196	185
1127	196	99
1128	196	103
1129	196	156
1130	196	104
1131	196	107
1132	196	142
1133	191	16
1134	191	107
1135	191	76
1136	191	64
1137	191	95
1138	206	8
1139	206	142
1140	206	107
1141	206	151
1142	206	76
1143	206	64
1144	206	109
1145	206	27
1146	206	156
1147	190	138
1148	190	115
1149	190	180
1150	190	64
1151	190	168
1152	190	95
1153	190	187
1154	190	143
1155	190	79
1156	190	181
1157	192	16
1158	192	107
1159	192	76
1160	192	64
1161	192	95
1162	218	180
1163	218	151
1164	218	156
1165	218	142
1166	218	107
1167	218	91
1168	219	35
1169	219	142
1170	219	156
1171	219	175
1172	219	89
1173	219	34
1174	223	180
1175	223	76
1176	223	79
1177	223	33
1178	223	2
1179	223	97
1187	224	185
1188	224	187
1189	224	180
1190	224	107
1191	224	95
1192	224	40
1193	224	97
1194	208	185
1195	208	109
1196	208	142
1197	208	91
1198	208	156
1199	208	107
1200	208	150
1201	221	183
1202	221	71
1203	221	1
1204	221	164
1205	221	175
1206	221	122
1207	221	85
1208	221	17
1209	221	156
1210	221	160
1211	221	166
1212	210	15
1213	210	183
1214	210	71
1215	210	180
1216	210	107
1217	210	27
1218	211	185
1219	211	180
1220	211	107
1221	211	91
1222	211	142
1223	217	116
1224	217	137
1225	217	146
1226	217	114
1227	217	83
1228	217	142
1229	217	110
1230	217	119
1231	215	185
1232	215	107
1233	215	64
1234	212	107
1235	212	64
1236	212	131
1237	212	95
1238	212	187
1239	212	125
1240	212	152
1241	212	181
1242	209	75
1243	209	185
1244	209	10
1245	209	191
1246	209	21
1247	209	146
1248	209	26
1249	209	95
1250	209	187
1251	209	117
1252	209	151
1253	209	27
1254	209	64
1255	209	45
1256	234	8
1257	234	146
1258	234	119
1259	234	107
1260	241	191
1261	241	87
1262	241	107
1263	241	125
1264	241	64
1265	241	146
1266	241	83
1267	237	180
1268	237	64
1269	237	29
1270	237	109
1271	236	155
1272	236	64
1273	236	107
1274	236	76
1275	236	33
1276	236	95
1277	236	180
1278	242	155
1279	242	187
1280	242	64
1281	242	180
1282	242	33
1283	242	95
1284	242	40
1285	242	169
1286	230	185
1287	230	119
1288	230	175
1289	230	132
1290	230	189
1291	230	84
1292	232	71
1293	232	185
1294	232	142
1295	232	180
1296	232	156
1297	232	55
1298	232	107
1299	232	109
1300	232	95
1301	227	194
1302	227	137
1303	227	185
1304	227	175
1305	227	85
1306	227	17
1307	227	84
1308	227	119
1309	227	109
1310	227	142
1311	227	189
1312	228	27
1313	228	79
1314	228	151
1315	228	195
1316	228	142
1317	228	152
1318	238	183
1319	238	71
1320	238	15
1321	238	157
1322	238	119
1323	238	121
1324	238	122
1325	238	160
1326	238	84
1327	238	142
1328	238	175
1329	229	67
1330	229	148
1331	229	156
1332	229	107
1333	229	142
1334	229	190
1335	226	185
1336	226	107
1337	226	143
1338	226	156
1339	226	103
1340	226	151
1341	226	142
1342	226	109
1343	226	133
1344	231	191
1345	231	119
1346	231	132
1347	231	107
1348	231	103
1349	231	109
1350	231	125
1351	249	115
1352	249	33
1353	249	180
1354	249	104
1355	249	107
1356	249	195
1357	249	79
1358	249	80
1359	253	137
1360	253	115
1361	253	142
1362	253	107
1363	253	74
1364	253	146
1365	253	119
1366	253	62
1367	254	94
1368	254	71
1369	254	107
1370	254	142
1371	254	16
1372	254	91
1373	254	103
1374	255	94
1375	255	156
1376	255	142
1377	255	109
1378	255	180
1379	257	47
1380	257	185
1381	257	107
1382	257	142
1383	257	109
1384	257	143
1385	257	64
1386	258	138
1387	258	115
1388	258	68
1389	258	168
1390	258	176
1391	258	29
1392	258	133
1393	258	20
1394	258	192
1395	258	103
1396	258	184
1397	258	56
1398	259	133
1399	259	142
1400	259	107
1401	259	64
1402	259	103
1403	259	148
1404	259	29
1405	247	15
1406	247	180
1407	247	156
1408	247	142
1409	247	107
1410	256	191
1411	256	75
1412	256	29
1413	256	143
1414	256	107
1415	256	21
1416	256	184
1417	256	103
1418	256	125
1419	248	67
1420	248	180
1421	248	33
1422	248	107
1423	248	81
1424	248	104
1425	248	79
1426	248	195
1427	248	142
1428	248	152
1429	250	108
1430	250	185
1431	250	64
1432	250	122
1433	250	107
1434	250	142
1435	251	100
1436	251	19
1437	251	106
1438	251	140
1439	251	64
1440	251	107
1441	251	134
1442	251	57
1443	251	95
1444	251	103
1445	251	59
1446	244	185
1447	244	142
1448	244	84
1449	244	23
1450	244	160
1451	244	72
1452	266	138
1453	266	191
1454	266	143
1455	266	125
1456	266	113
1457	266	103
1458	266	29
1459	266	75
1460	269	185
1461	269	180
1462	269	107
1463	269	109
1464	269	156
1465	269	91
1466	267	138
1467	267	191
1468	267	29
1469	267	75
1470	267	19
1471	267	103
1472	267	18
1473	268	1
1474	268	137
1475	268	8
1476	268	110
1477	268	124
1478	268	167
1479	268	122
1480	268	74
1481	268	62
1482	268	17
1483	268	85
1484	268	95
1485	268	117
1486	268	27
1487	268	151
1488	270	138
1489	270	107
1490	270	184
1491	270	103
1492	270	133
1493	270	171
1494	270	64
1495	271	185
1496	271	187
1497	271	107
1498	271	180
1499	271	95
1500	271	142
1501	271	77
1502	271	150
1503	274	30
1504	274	137
1505	274	122
1506	274	124
1507	274	110
1508	274	74
1509	274	142
1510	274	95
1511	265	138
1512	265	33
1513	265	180
1514	265	195
1515	265	171
1516	265	95
1517	265	64
1518	265	152
1519	261	191
1520	261	107
1521	261	103
1522	261	64
1523	261	75
1524	261	74
1525	261	125
1526	261	98
1527	261	19
1528	262	180
1529	262	107
1530	262	79
1531	262	33
1532	262	95
1533	262	66
1534	262	152
1535	262	97
1536	264	138
1537	264	133
1538	264	176
1539	264	168
1540	264	195
1541	264	76
1542	273	185
1543	273	107
1544	273	64
1545	273	79
1546	273	19
1547	273	125
1548	263	71
1549	263	67
1550	263	185
1551	263	94
1552	263	127
1553	263	95
1554	263	187
1555	263	117
1556	263	51
1557	263	7
1558	263	101
1559	263	142
1560	263	91
1561	263	40
1562	263	50
1563	243	185
1564	243	142
1565	243	84
1566	243	23
1567	243	160
1568	243	72
1569	225	49
1570	225	183
1571	225	68
1572	225	95
1573	225	195
1574	225	33
1575	225	190
1576	225	180
1577	225	64
1578	225	76
1579	225	104
1580	225	81
1581	225	97
1582	225	181
1583	189	185
1584	189	71
1585	189	175
1586	189	142
1587	189	107
1588	189	64
1589	189	156
1590	189	103
1591	189	189
1601	151	71
1602	151	8
1603	151	67
1604	151	142
1605	151	109
1606	151	119
1607	151	156
1608	151	91
1609	151	136
1610	151	16
1611	151	107
1612	151	125
1613	151	27
1614	151	110
1615	151	81
1616	151	180
1617	151	185
1618	276	180
1619	276	64
1620	276	107
1621	276	76
1622	136	191
1623	136	185
1624	136	103
1625	136	75
1626	136	98
1627	136	143
1628	136	19
1629	136	125
1630	136	107
1631	277	180
1632	277	64
1633	277	76
1634	277	107
1635	115	185
1636	115	94
1637	115	1
1638	115	183
1639	115	15
1640	115	119
1641	115	146
1642	115	110
1643	115	124
1644	115	17
1645	115	85
1646	115	122
1647	115	160
1648	115	142
1649	207	185
1650	207	109
1651	207	142
1652	207	91
1653	207	156
1654	207	107
1655	207	150
1656	153	185
1657	153	142
1658	153	180
1659	153	104
1660	153	156
1661	153	136
1662	275	138
1663	275	107
1664	275	180
1665	275	64
1666	275	33
1667	275	76
1668	275	142
1669	233	137
1670	233	1
1671	233	106
1672	233	119
1673	233	146
1674	233	83
1675	233	114
1676	233	110
1677	233	109
1678	233	142
1679	233	124
1680	233	74
1681	233	175
1682	233	189
1683	233	122
1684	233	85
1685	283	163
1686	283	134
1687	283	46
1688	283	20
1689	283	29
1690	283	192
1691	284	185
1692	284	107
1693	284	156
1694	285	185
1695	285	29
1696	285	74
1697	285	125
1698	285	143
1699	285	133
1700	285	189
1701	278	5
1702	278	137
1703	278	8
1704	278	91
1705	278	109
1706	278	142
1707	278	160
1708	278	74
1709	287	155
1710	287	81
1711	287	76
1712	287	195
1713	287	107
1714	287	95
1715	287	187
1716	287	80
1717	287	181
1718	289	183
1719	289	157
1720	289	76
1721	289	27
1722	289	121
1723	289	119
1724	289	109
1725	289	16
1726	289	78
1727	288	183
1728	288	157
1729	288	76
1730	288	27
1731	288	121
1732	288	119
1733	288	109
1734	288	16
1735	288	78
1736	282	183
1737	282	185
1738	282	142
1739	282	107
1740	282	119
1741	282	103
1742	282	175
1754	280	185
1755	280	187
1756	280	107
1757	280	77
1758	280	177
1759	280	95
1760	280	122
1761	280	181
1762	281	142
1763	281	91
1764	281	151
1765	281	107
1766	281	156
1767	291	185
1768	291	119
1769	291	132
1770	291	85
1771	291	175
1772	291	17
1773	291	189
1774	291	122
1775	291	24
1776	291	73
1777	290	10
1778	290	185
1779	290	107
1780	290	33
1781	290	151
1782	290	111
1783	290	187
1784	290	95
1785	290	43
1786	1	137
1787	1	185
1788	1	151
1789	1	27
1790	1	190
1791	1	107
1792	1	91
1793	296	115
1794	296	142
1795	296	91
1796	296	195
1797	296	156
1798	297	67
1799	297	107
1800	297	64
1801	297	125
1802	297	142
1803	297	91
1815	295	185
1816	295	142
1817	295	107
1818	295	109
1819	295	81
1820	295	156
1821	25	119
1822	25	17
1823	25	175
1824	25	132
1825	25	122
1826	25	187
1827	300	138
1828	300	168
1829	300	20
1830	300	103
1831	300	29
1832	300	176
1833	294	107
1834	294	64
1835	294	131
1836	294	95
1837	294	187
1838	294	125
1839	294	152
1840	294	181
1841	298	183
1842	298	67
1843	298	121
1844	298	81
1845	298	107
1846	298	103
1847	298	195
1848	298	33
1849	293	8
1850	293	74
1851	293	107
1852	293	175
1853	293	119
1854	293	104
1855	293	132
1856	293	17
1857	299	67
1858	299	183
1859	299	1
1860	299	15
1861	299	149
1862	299	120
1863	299	157
1864	299	119
1865	299	146
1866	299	109
1867	299	142
1868	299	156
1869	78	49
1870	78	185
1871	78	180
1872	78	107
1873	78	187
1874	78	150
1875	66	71
1876	66	138
1877	66	192
1878	66	176
1879	66	175
1880	66	107
1881	66	133
1882	101	67
1883	101	19
1884	101	183
1885	101	15
1886	101	100
1887	101	191
1888	101	46
1889	101	163
1890	101	9
1891	101	103
1892	101	95
1893	101	187
1894	101	123
1895	90	141
1896	90	137
1897	90	114
1898	90	146
1899	90	119
1900	90	111
1901	90	95
1902	90	187
1903	90	85
1904	96	15
1905	96	71
1906	96	1
1907	96	35
1908	96	119
1909	96	146
1910	96	142
1911	96	110
1912	96	124
1913	96	122
1914	96	166
1915	96	156
1916	123	1
1917	123	30
1918	123	35
1919	123	122
1920	123	110
1921	123	142
1922	123	119
1923	123	95
1924	123	124
1925	41	183
1926	41	71
1927	41	15
1928	41	175
1929	41	119
1930	41	110
1931	41	122
1932	84	68
1933	84	16
1934	84	123
1935	84	64
1936	84	107
1937	84	76
1938	32	185
1939	32	107
1940	32	180
1941	32	64
1942	32	84
1943	34	185
1944	34	35
1945	34	142
1946	34	180
1947	34	156
1948	34	109
1949	34	110
1950	34	124
1951	34	187
1952	34	74
1953	127	71
1954	127	94
1955	127	183
1956	127	15
1957	127	81
1958	127	76
1959	127	91
1960	127	151
1961	127	27
1962	127	142
1963	127	156
1964	106	185
1965	106	70
1966	106	64
1967	106	107
1968	106	79
1969	179	185
1970	179	122
1971	179	156
1972	179	107
1973	94	142
1974	94	180
1975	94	107
1976	94	91
1977	94	156
1978	94	100
1979	152	191
1980	152	183
1981	152	71
1982	152	15
1983	152	107
1984	152	33
1985	152	143
1986	152	29
1987	152	133
1988	152	131
1989	213	138
1990	213	64
1991	213	171
1992	213	176
1993	213	180
1994	213	133
1995	213	76
1996	213	142
1997	213	107
1998	51	138
1999	51	142
2000	51	76
2001	51	64
2002	51	109
2003	51	160
2004	51	72
2005	51	133
2006	51	58
2007	51	136
2008	51	29
2009	51	110
2010	55	137
2011	55	185
2012	55	114
2013	55	83
2014	55	145
2015	55	74
2016	55	42
2017	147	108
2018	147	71
2019	147	1
2020	147	122
2021	147	110
2022	147	88
2023	147	142
2024	147	195
2025	147	148
2026	147	179
2027	147	92
2028	45	185
2029	45	137
2030	45	83
2031	45	114
2032	45	125
2033	45	189
2034	45	84
2035	116	183
2036	116	15
2037	116	71
2038	116	175
2039	116	90
2040	116	119
2041	116	110
2042	116	132
2043	116	122
2044	116	84
2053	158	53
2054	158	153
2055	158	108
2056	158	25
2057	158	144
2058	158	175
2059	158	189
2060	158	74
2061	158	119
2062	195	108
2063	195	142
2064	195	109
2065	195	180
2066	195	107
2067	195	156
2068	199	71
2069	199	15
2070	199	67
2071	199	68
2072	199	185
2073	199	142
2074	199	119
2075	199	103
2076	205	137
2077	205	185
2078	205	84
2079	205	175
2080	205	110
2081	205	107
2082	205	103
2083	235	183
2084	235	15
2085	235	49
2086	235	68
2087	235	157
2088	235	81
2089	235	121
2090	235	119
2091	235	195
2092	235	84
2093	184	49
2094	184	180
2095	184	142
2096	184	107
2097	184	156
2098	184	190
2099	184	91
2100	184	109
2101	220	180
2102	220	64
2103	220	79
2104	220	95
2105	220	187
2106	220	195
2107	220	33
2108	220	181
2109	178	142
2110	178	151
2111	178	180
2112	178	160
2113	178	109
2114	178	91
2115	178	60
2116	178	150
2117	165	137
2118	165	142
2119	165	175
2120	165	189
2121	165	122
2122	165	119
2123	165	146
2124	214	137
2125	214	71
2126	214	191
2127	214	8
2128	214	183
2129	214	109
2130	214	160
2131	214	74
2132	214	156
2133	239	115
2134	239	33
2135	239	180
2136	239	195
2137	239	109
2138	239	79
2139	239	104
2140	239	76
2141	239	29
2142	239	152
2143	239	97
2144	159	35
2145	159	185
2146	159	137
2147	159	108
2148	159	85
2149	159	142
2150	159	109
2151	159	91
2152	216	191
2153	216	125
2154	216	107
2155	216	75
2156	216	74
2157	216	91
2158	216	103
2159	252	91
2160	252	109
2161	252	142
2162	252	151
2163	252	27
2164	252	156
2165	246	71
2166	246	156
2167	246	107
2168	246	27
2169	246	109
2170	246	151
2171	272	71
2172	272	185
2173	272	95
2174	272	109
2175	272	180
2176	3	138
2177	3	49
2178	3	67
2179	3	52
2180	3	29
2181	3	133
2182	3	143
2183	3	74
2184	3	20
2185	3	46
2186	3	156
2187	3	107
2188	3	125
2189	3	64
2190	3	103
2191	3	33
2192	3	113
2193	3	123
2194	3	129
2195	3	166
2196	3	118
2197	3	50
2198	3	170
2199	260	185
2200	260	187
2201	260	180
2202	260	107
2203	260	95
2204	260	150
2205	260	96
2206	57	185
2207	57	115
2208	57	107
2209	57	95
2210	57	187
2211	57	195
2212	57	79
2213	57	39
2214	57	40
2215	57	97
2216	48	100
2217	48	185
2218	48	19
2219	48	9
2220	48	107
2221	48	64
2222	48	122
2223	48	95
2224	240	100
2225	240	57
2226	240	109
2227	240	64
2228	240	107
2229	240	16
2230	240	76
2231	240	95
2232	240	142
2233	245	185
2234	245	107
2235	245	142
2236	245	29
2237	36	47
2238	36	137
2239	36	8
2240	36	191
2241	36	35
2242	36	19
2243	36	75
2244	36	175
2245	36	17
2246	36	85
2247	36	189
2248	36	103
2249	36	173
2250	36	114
2251	36	119
2252	279	15
2253	279	71
2254	279	94
2255	279	3
2256	279	183
2257	279	20
2258	279	103
2259	279	129
2260	279	32
2261	279	21
2262	279	192
2263	279	142
2264	279	81
2265	279	180
2266	279	76
2267	279	187
2268	279	95
2269	279	101
2271	2	68
2272	2	191
2273	2	125
2274	2	103
2275	2	107
2276	2	64
2277	2	79
2278	2	75
2279	6	183
2280	6	49
2281	6	142
2282	6	125
2283	6	107
2284	128	63
2285	128	183
2286	128	71
2287	128	49
2288	128	67
2289	128	149
2290	128	157
2291	128	151
2292	128	91
2293	128	142
2294	128	81
2295	128	110
2296	128	84
2297	128	124
2298	13	67
2299	13	15
2300	13	183
2301	13	64
2302	13	81
2303	13	156
2304	13	95
2305	13	104
2306	13	6
2307	13	180
2308	13	76
2309	13	79
2310	13	152
2311	13	181
2312	14	35
2313	14	66
2314	14	13
2315	14	173
2316	14	110
2317	14	124
2318	14	142
2319	14	143
2320	14	95
2321	4	185
2322	4	187
2323	4	107
2324	4	180
2325	4	95
2326	4	104
2327	4	33
2328	4	169
2329	7	137
2330	7	119
2331	7	17
2332	7	175
2333	11	5
2334	11	137
2335	11	185
2336	11	159
2337	11	105
2338	11	158
2339	11	74
2340	11	119
2341	11	146
2342	11	83
2343	11	114
2344	5	185
2345	5	35
2346	5	183
2347	5	71
2348	5	67
2349	5	137
2350	5	146
2351	5	119
2352	5	74
2353	5	122
2354	5	84
2355	5	175
2356	5	62
2357	5	114
2358	5	83
2359	5	110
2360	5	142
2361	5	189
2421	15	27
2422	15	48
2423	15	64
2424	15	76
2425	15	79
2426	15	107
2427	15	156
2428	15	180
2429	10	15
2430	10	74
2431	10	79
2432	10	107
2433	10	180
2434	10	185
2435	10	188
2436	12	27
2437	12	91
2438	12	107
2439	12	109
2440	12	142
2441	12	180
2442	86	142
2443	86	180
2444	86	64
2445	86	91
2446	86	107
2447	108	185
2448	108	183
2449	108	67
2450	108	46
2451	108	134
2452	108	163
2453	108	52
2454	108	107
2455	108	151
2456	108	103
2457	17	17
2458	17	74
2459	17	110
2460	17	119
2461	17	137
2462	17	146
2463	17	156
2464	17	175
2465	17	189
2466	125	137
2467	125	100
2468	125	114
2469	125	83
2470	125	57
2471	125	9
2472	125	103
2473	93	23
2474	93	35
2475	93	45
2483	322	191
2484	322	196
2489	286	7
2490	286	12
2491	286	28
2493	286	41
2494	286	82
2495	286	102
2496	286	180
2497	286	193
2499	222	64
2500	222	68
2501	222	76
2502	222	95
2503	222	150
2504	222	152
2505	222	155
2507	102	31
2508	102	33
2509	102	68
2510	102	76
2511	102	80
2512	102	81
2513	102	95
2514	102	104
2515	102	155
2516	102	181
2517	186	31
2518	186	81
2519	186	95
2520	186	109
2521	186	142
2522	186	155
2523	186	185
2524	292	9
2525	292	19
2526	292	31
2527	292	33
2528	292	44
2529	292	77
2530	292	79
2531	292	80
2532	292	95
2533	292	97
2534	292	185
2535	292	187
2536	162	64
2537	162	65
2538	162	79
2539	162	80
2540	162	81
2541	162	95
2542	162	107
2543	162	181
2544	162	195
2545	162	155
2487	322	19
2492	286	67
2486	322	107
2498	286	107
2485	322	31
2506	222	31
2488	286	91
2546	171	27
2547	171	71
2548	171	81
2549	171	91
2550	171	151
2551	171	156
2552	171	157
2553	171	110
2554	171	183
2555	171	152
2556	97	77
2557	97	95
2558	97	107
2559	97	108
2560	97	181
2561	97	187
2562	97	150
2563	8	19
2564	8	23
2565	8	29
2566	8	59
2567	8	129
2568	8	136
2569	8	154
2570	8	185
\.


--
-- Data for Name: tv_show_views; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_show_views (id, tv_show_id, view_count, last_viewed) FROM stdin;
18	244	1	2025-05-19 11:08:12.624
20	243	1	2025-05-19 11:06:18.733
30	261	1	2025-05-19 18:44:10.393
88	287	1	2025-05-27 13:28:37.121827
62	32	4	2025-05-21 14:44:47.589
54	39	2	2025-05-21 13:58:15.214
113	256	1	2025-05-27 13:58:52.006287
37	285	5	2025-05-19 19:46:27.738
34	9	5	2025-05-20 15:52:47.521
51	22	8	2025-05-21 13:57:59.961
3	116	2	2025-05-20 10:58:11.675
2	128	2	2025-05-20 10:48:21.69
89	284	1	2025-05-27 13:31:47.918399
114	255	1	2025-05-27 13:59:30.232664
115	254	1	2025-05-27 14:00:01.924978
90	283	1	2025-05-27 13:32:17.999927
91	282	1	2025-05-27 13:33:01.747654
44	6	5	2025-05-20 10:21:13.239
22	8	35	2025-05-21 15:06:44.217
116	253	1	2025-05-27 14:00:39.631802
60	281	3	2025-05-21 14:17:49.576
69	252	4	2025-05-22 13:14:21.777076
72	280	2	2025-05-27 10:48:59.40852
16	279	2	2025-05-20 13:35:15.417
74	62	4	2025-05-27 11:04:07.851418
93	277	1	2025-05-27 13:35:47.422055
94	276	1	2025-05-27 13:36:31.36228
58	119	3	2025-05-21 14:17:34.526
95	275	1	2025-05-27 13:37:10.592785
96	274	1	2025-05-27 13:37:40.154741
29	34	2	2025-05-20 15:51:12.861
70	29	2	2025-05-26 20:53:48.965795
133	234	2	2025-05-27 14:40:57.469518
117	251	1	2025-05-27 14:01:58.798294
97	273	1	2025-05-27 13:38:08.477535
125	242	1	2025-05-27 14:37:09.557561
63	31	8	2025-05-21 17:45:45.853186
98	272	1	2025-05-27 13:38:32.397637
39	152	2	2025-05-19 19:48:48.101
6	24	2	2025-05-19 22:08:43.787
99	271	1	2025-05-27 13:39:40.775369
56	270	2	2025-05-21 14:17:12.178
118	250	1	2025-05-27 14:02:16.735702
126	241	1	2025-05-27 14:37:23.424342
52	184	2	2025-05-21 13:58:05.417
79	296	3	2025-05-27 13:05:30.969776
45	23	4	2025-05-21 13:57:33.135
46	10	2	2025-05-20 10:30:04.807
100	269	1	2025-05-27 13:43:23.592376
75	25	2	2025-05-27 11:15:40.235231
127	240	1	2025-05-27 14:37:58.336243
68	122	5	2025-05-22 12:05:57.075673
101	268	1	2025-05-27 13:44:02.863523
119	249	1	2025-05-27 14:03:38.965619
31	26	2	2025-05-21 08:40:45.163
102	266	1	2025-05-27 13:44:34.940367
103	267	1	2025-05-27 13:44:57.673606
104	265	1	2025-05-27 13:45:54.935568
120	248	1	2025-05-27 14:04:16.393797
4	11	3	2025-05-20 10:30:22.468
40	300	10	2025-05-21 14:44:24.506
105	264	1	2025-05-27 13:46:44.925306
9	27	2	2025-05-19 10:25:48.072
76	299	2	2025-05-27 13:03:10.089543
77	298	2	2025-05-27 13:04:17.770165
1	15	2	2025-05-20 16:04:45.736
92	278	2	2025-05-27 13:35:16.809812
78	297	2	2025-05-27 13:04:39.581032
80	295	1	2025-05-27 13:08:00.470485
36	1	61	2025-05-21 13:57:16.173
82	293	1	2025-05-27 13:10:31.223693
25	2	20	2025-05-21 13:48:30.165
106	263	1	2025-05-27 13:47:09.718441
84	291	1	2025-05-27 13:24:06.726721
21	12	6	2025-05-21 13:42:13.832
121	247	1	2025-05-27 14:04:34.492191
107	262	1	2025-05-27 13:49:26.857415
108	260	1	2025-05-27 13:49:50.065928
71	33	4	2025-05-26 21:36:44.287701
13	3	3	2025-05-20 10:18:49.059
85	290	1	2025-05-27 13:25:30.005736
128	239	1	2025-05-27 14:38:38.081185
86	289	1	2025-05-27 13:26:14.657784
81	294	2	2025-05-27 13:09:30.848602
87	288	1	2025-05-27 13:27:48.388307
83	292	4	2025-05-27 13:15:38.444068
32	14	6	2025-05-21 13:48:47.963
73	16	6	2025-05-27 11:00:09.372253
109	17	1	2025-05-27 13:55:25.216878
28	18	3	2025-05-19 14:20:21.968
110	19	1	2025-05-27 13:57:13.59046
27	259	9	2025-05-21 14:17:05.022
111	258	1	2025-05-27 13:57:38.012004
5	20	3	2025-05-19 22:08:36.117
112	257	1	2025-05-27 13:58:16.786487
12	21	3	2025-05-20 16:05:25.508
53	13	13	2025-05-21 12:55:37.32
64	28	4	2025-05-21 23:13:16.166062
122	30	1	2025-05-27 14:35:00.658019
123	246	2	2025-05-27 14:35:11.698201
23	5	11	2025-05-20 15:30:04.051
129	238	1	2025-05-27 14:39:07.370717
130	237	1	2025-05-27 14:39:39.815338
131	235	1	2025-05-27 14:39:55.881784
132	236	1	2025-05-27 14:40:22.591741
124	245	3	2025-05-27 14:35:32.229151
135	35	1	2025-05-27 14:41:48.931129
134	232	2	2025-05-27 14:41:37.558481
136	231	1	2025-05-27 14:42:21.250517
137	230	1	2025-05-27 14:42:44.70359
138	36	1	2025-05-27 14:44:25.10864
139	37	1	2025-05-27 14:44:57.752916
140	38	1	2025-05-27 14:46:00.472776
142	229	1	2025-05-27 14:47:04.421349
143	228	1	2025-05-27 14:47:34.79694
144	227	1	2025-05-27 14:48:33.830312
47	226	3	2025-05-21 14:17:25.347
7	225	2	2025-05-20 16:05:11.583
146	224	1	2025-05-27 14:50:11.35167
147	223	1	2025-05-27 14:50:32.055152
10	220	2	2025-05-20 16:05:20.019
149	221	1	2025-05-27 14:51:19.185503
151	217	1	2025-05-27 14:52:50.208076
59	218	2	2025-05-21 14:17:42.055
14	212	3	2025-05-20 16:05:36.618
152	216	1	2025-05-27 14:54:36.686552
38	233	2	2025-05-19 19:47:15.25
17	44	3	2025-05-20 13:54:11.853
48	46	2	2025-05-21 13:57:38.737
57	201	2	2025-05-21 14:17:17.148
66	53	5	2025-05-22 09:17:50.548436
49	173	2	2025-05-21 13:57:44.573
55	178	3	2025-05-21 13:58:41.05
65	176	3	2025-05-22 09:08:46.669104
35	166	4	2025-05-19 19:45:07.869
41	165	2	2025-05-20 15:54:10.754
33	7	15	2025-05-20 15:52:07.608
15	4	6	2025-05-20 13:34:32.324
8	67	2	2025-05-20 16:05:15.231
67	70	3	2025-05-22 09:22:09.086161
50	151	2	2025-05-21 13:57:49.385
19	138	4	2025-05-20 18:41:41.147
43	109	2	2025-05-21 13:57:25.392
42	108	3	2025-05-21 13:57:20.502
26	322	69	2025-05-21 14:43:49.691
24	286	89	2025-05-21 13:42:45.06
150	219	3	2025-05-27 14:52:11.822889
148	222	11	2025-05-27 14:51:01.425989
11	162	5	2025-05-20 16:05:22.568
153	41	3	2025-05-27 14:54:59.853134
145	40	5	2025-05-27 14:50:07.859338
154	42	1	2025-05-27 14:58:26.658876
155	215	2	2025-05-27 14:59:11.119156
156	43	1	2025-05-27 14:59:28.181541
157	214	1	2025-05-27 14:59:35.238998
158	213	1	2025-05-27 14:59:56.973042
159	211	2	2025-05-27 15:00:54.028375
160	45	1	2025-05-27 15:01:17.05571
161	210	1	2025-05-27 15:01:17.319448
162	209	1	2025-05-27 15:02:13.902157
163	48	2	2025-05-27 15:02:33.869154
165	208	1	2025-05-27 15:03:43.466309
164	47	2	2025-05-27 15:02:48.283555
166	207	1	2025-05-27 15:03:59.309925
167	206	1	2025-05-27 15:04:18.423696
169	205	4	2025-05-27 15:04:35.980824
171	204	2	2025-05-27 15:05:00.367016
172	203	1	2025-05-27 15:05:17.870324
170	50	2	2025-05-27 15:04:42.503902
173	202	2	2025-05-27 15:05:30.866704
175	52	1	2025-05-27 15:06:22.253026
176	200	2	2025-05-27 15:06:22.908032
177	199	1	2025-05-27 15:06:45.16249
179	196	1	2025-05-27 15:07:44.425015
180	195	1	2025-05-27 15:08:00.727767
181	198	1	2025-05-27 15:08:25.817431
178	197	2	2025-05-27 15:07:02.423311
182	194	2	2025-05-27 15:10:49.325137
183	193	2	2025-05-27 15:11:14.185773
256	85	1	2025-05-27 15:41:27.964348
255	141	2	2025-05-27 15:41:23.351372
257	140	1	2025-05-27 15:42:03.629649
185	54	1	2025-05-27 15:12:34.451769
184	192	5	2025-05-27 15:12:00.838809
187	55	1	2025-05-27 15:12:59.070729
186	191	2	2025-05-27 15:12:51.520908
188	190	1	2025-05-27 15:13:25.37393
189	56	1	2025-05-27 15:13:34.302355
190	189	1	2025-05-27 15:13:48.898136
191	57	1	2025-05-27 15:14:18.696179
192	188	1	2025-05-27 15:14:25.098577
193	187	1	2025-05-27 15:14:46.690509
194	58	1	2025-05-27 15:14:53.899795
196	185	1	2025-05-27 15:15:27.619891
197	183	2	2025-05-27 15:16:14.038928
198	59	1	2025-05-27 15:16:22.6659
199	182	2	2025-05-27 15:16:42.34625
200	181	2	2025-05-27 15:17:39.280634
201	180	2	2025-05-27 15:18:45.352538
202	179	1	2025-05-27 15:19:25.117282
203	177	1	2025-05-27 15:20:32.284506
204	175	1	2025-05-27 15:21:15.158135
258	139	1	2025-05-27 15:42:27.327424
209	171	5	2025-05-27 15:25:13.14561
205	174	1	2025-05-27 15:21:44.232309
206	172	1	2025-05-27 15:22:08.840218
207	328	1	2025-05-27 15:23:20.814016
208	60	1	2025-05-27 15:24:01.558553
210	170	2	2025-05-27 15:26:08.929106
211	169	2	2025-05-27 15:26:23.225139
212	168	1	2025-05-27 15:27:11.767665
213	167	1	2025-05-27 15:27:22.465542
215	61	1	2025-05-27 15:27:43.042966
214	65	2	2025-05-27 15:27:32.995676
216	164	2	2025-05-27 15:29:43.089348
217	63	1	2025-05-27 15:30:06.759033
219	64	1	2025-05-27 15:30:26.876158
218	163	2	2025-05-27 15:30:13.771245
220	66	1	2025-05-27 15:30:46.430849
221	161	1	2025-05-27 15:31:02.921496
222	160	1	2025-05-27 15:31:12.386276
223	159	1	2025-05-27 15:31:22.922831
224	68	1	2025-05-27 15:31:27.933344
226	69	1	2025-05-27 15:31:50.159765
225	158	2	2025-05-27 15:31:40.068759
227	157	1	2025-05-27 15:32:30.274881
228	71	1	2025-05-27 15:32:37.717018
229	72	1	2025-05-27 15:32:56.480882
230	156	1	2025-05-27 15:33:03.364421
231	73	1	2025-05-27 15:33:11.552241
232	74	1	2025-05-27 15:34:14.782777
233	155	1	2025-05-27 15:34:31.45491
234	75	1	2025-05-27 15:34:36.214848
235	154	1	2025-05-27 15:34:44.470166
237	76	1	2025-05-27 15:35:06.768475
236	153	2	2025-05-27 15:35:00.403568
238	77	1	2025-05-27 15:35:24.118398
239	78	1	2025-05-27 15:35:41.821724
240	79	1	2025-05-27 15:36:05.72851
241	150	2	2025-05-27 15:36:09.173808
242	80	1	2025-05-27 15:36:25.41873
243	81	1	2025-05-27 15:36:38.369504
244	149	2	2025-05-27 15:36:40.697518
245	148	1	2025-05-27 15:36:58.701572
246	82	1	2025-05-27 15:36:59.098241
248	147	1	2025-05-27 15:37:36.271815
247	83	2	2025-05-27 15:37:18.955693
250	146	2	2025-05-27 15:39:18.893114
251	145	1	2025-05-27 15:39:43.78655
249	84	2	2025-05-27 15:37:55.692492
252	144	1	2025-05-27 15:40:18.974045
253	143	1	2025-05-27 15:40:34.939783
254	142	2	2025-05-27 15:41:01.655042
259	86	1	2025-05-27 15:43:36.254965
260	87	1	2025-05-27 15:45:21.879507
261	137	1	2025-05-27 15:45:36.039602
262	88	1	2025-05-27 15:45:44.095046
263	136	1	2025-05-27 15:45:55.634042
264	89	1	2025-05-27 15:46:00.484213
266	135	1	2025-05-27 15:46:29.818703
267	91	1	2025-05-27 15:46:32.342445
268	134	2	2025-05-27 15:46:43.137507
61	133	4	2025-05-21 14:17:55.67
265	90	2	2025-05-27 15:46:20.866467
269	132	2	2025-05-27 15:47:23.662609
270	131	1	2025-05-27 15:48:21.908074
271	130	1	2025-05-27 15:48:37.047326
272	129	1	2025-05-27 15:48:51.138137
273	92	1	2025-05-27 15:48:55.12468
274	93	1	2025-05-27 15:49:11.821236
275	127	1	2025-05-27 15:49:25.049082
278	125	1	2025-05-27 16:06:20.032314
279	124	1	2025-05-27 16:06:40.103183
280	123	1	2025-05-27 16:06:54.23591
281	121	4	2025-05-27 16:07:26.290721
276	94	2	2025-05-27 15:49:27.974281
282	120	2	2025-05-27 16:08:07.01288
283	95	1	2025-05-27 16:08:11.596873
284	96	1	2025-05-27 16:08:31.538823
277	126	2	2025-05-27 16:05:40.643391
286	98	1	2025-05-27 16:09:30.588168
288	118	1	2025-05-27 16:10:45.951145
289	117	1	2025-05-27 16:11:10.278497
290	115	1	2025-05-27 16:11:49.727507
291	114	1	2025-05-27 16:12:23.698122
292	100	1	2025-05-27 16:12:27.33909
293	113	1	2025-05-27 16:12:43.938275
294	112	1	2025-05-27 16:12:56.743209
295	111	1	2025-05-27 16:13:08.539721
296	110	2	2025-05-27 16:13:25.887035
297	107	1	2025-05-27 16:14:19.918621
298	106	1	2025-05-27 16:14:34.750396
299	105	1	2025-05-27 16:15:13.06131
300	104	1	2025-05-27 16:15:42.050521
301	103	1	2025-05-27 16:16:00.797724
174	51	2	2025-05-27 15:05:48.013114
168	49	4	2025-05-27 15:04:23.848158
287	99	2	2025-05-27 16:09:46.437957
302	102	6	2025-05-27 16:16:18.603875
195	186	6	2025-05-27 15:15:14.171764
285	97	3	2025-05-27 16:08:49.934561
303	101	4	2025-05-27 16:16:34.282619
\.


--
-- Data for Name: tv_shows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tv_shows (id, name, description, age_range, episode_length, creator, release_year, end_year, is_ongoing, seasons, stimulation_score, interactivity_level, dialogue_intensity, sound_effects_level, music_tempo, total_music_level, total_sound_effect_time_level, scene_frequency, creativity_rating, available_on, themes, animation_style, image_url, subscriber_count, video_count, channel_id, is_youtube_channel, published_at, has_omdb_data, has_youtube_data, is_featured) FROM stdin;
15	Babar	The adventures of the King of the elephants, his family, and friends.	4-8	30	\N	1989	2002	f	6	2	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Moderate	\N	{YouTube}	{"Family Values",Leadership,Teamwork,Responsibility,Perseverance,"Problem Solving","Emotional Intelligence",Friendship}	Traditional 2D hand-drawn animation.	https://m.media-amazon.com/images/M/MV5BYzJhZTMzOWYtZDhhOS00ZDU0LWI5YWItMzY3ZmNjNDRkZmM3XkEyXkFqcGc@._V1_SX300.jpg	5770	150		t	2023-11-22T08:51:59.772902Z	t	t	f
10	Angelina Ballerina	The adventures and ballet recitals of Angelina Mouseling (Finty Williams) in tow with her friends, Alice Nimbletoes (Jo Wyatt), William Longtail (Keith Wickham), Miss Lilly (Dame Judi Dench), and the menacing pair Priscilla Pinkpaws (Jo Wyatt) and Penelope Pinkpaws (Jonell Elliott).	3-6	30	\N	2001	2009	f	\N	3	Low-Moderate	Moderate	Medium	Moderate	High	Moderate	Moderate	\N	{TV}	{"Cultural Appreciation","Motor Skills",Perseverance,"Problem Solving",Friendship,"Creativity & Imagination",Ballet}	3D CGI Animation	https://m.media-amazon.com/images/M/MV5BNTZkMmQ1ODctZDJmNS00MGE2LTkwMTAtN2RkZjMxNzBiM2Y5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
12	Arthur	Bespectacled aardvark Arthur Read demonstrates to kids how to deal with such childhood traumas and challenges as homework, teachers and bullies. He also has to contend with his sisters, but loves playing with his friends: tomboy Francine, foodie and best pal Buster, super smart Brain, rich girl Muffy and geography expert Sue Ellen.	6-10	30	Arthur tussik	1996	2022	f	25	2	Moderate	Moderate-High	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{YouTube}	{"Family Values","Relatable Situations","Problem Solving","Social Development",Social-Emotional,Friendship}	2D Traditional hand-drawn	https://m.media-amazon.com/images/M/MV5BNjcyZWUyODUtM2YxMi00NmMwLTliMTctZjg1NjBhZTVkYTM4XkEyXkFqcGc@._V1_SX300.jpg	825000	780	UCJDyqaoyVtWKhCiTPZVOoyA	t	2007-12-09T14:44:06Z	t	t	f
17	Badanamu	Badanamu Stories explore themes central to the lives of preschool children but in ways that inject whimsy, imagination, and wonder into the everyday.	1-5	30	\N	2020	2021	f	4	4	High	Low-Moderate	High	Moderate-High	High	High	High	\N	{TV}	{Phonics,"Motor Skills","Sing Along",Literacy,Preschool-Basics,Numeracy,"Emotional Intelligence","Language Learning","Cognitive Development"}	3D CGI animation with bright and vivid colors.	https://m.media-amazon.com/images/M/MV5BMTRhYzdkZDAtZDM2My00OWRlLWJhZjQtOWRiODhlNzgwMzRkXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
86	Franklin and Friends (2011)	A children's TV show	3-6	23	\N	\N	\N	t	\N	3	Low-Moderate	Moderate	Low-Moderate	Low-Moderate	Low-Moderate	Low	Low-Moderate	\N	{TV}	{Social-Emotional,Friendship,Teamwork,"Relatable Situations","Problem Solving"}	3D CGI animation	/media/tv-shows/show-86.webp	\N	\N	\N	f	\N	f	f	f
108	Hudson’s Playground	Hudson's Playground follows the adventures of Hudson and his sister Holly on their IRL family farm. Experience all the fun of farm life - tractors, trucks, and tools galore - in the all new series, pocket.watch Hudson's Playground...	3-8	15	Hudson's Playground	2023	\N	t	\N	3	Low-Moderate	Moderate	Moderate-High	Moderate	Moderate	High	Moderate-High	\N	{YouTube}	{"Creativity & Imagination","Cultures & Traditions","Life Lessons","Farm Life",Machinery,Agriculture,"Outdoor Exploration","Problem Solving","Family Relationships",Curiosity}	Live-Action Family Videos	/media/tv-shows/show-108.jpg	2900000	343	UCxnRe3y0u35HnuYAp9FmBGQ	t	2018-12-10T18:26:31Z	f	f	f
8	Amakandu	In Amakandu channel we create incredible marble run races. Relaxings sounds of the marbles rolling over sand and wood tracks. We love making marble run races. ASMR satisfying videos with sand, wooden, carboard and home made marble run races. Our videos suitable for the whole family are based on the creativity of marble run races combining various techniques and elements we hope you like it as much as we do. Subscribe and share with us our passion for marble runs:\nThank you !!	0-13+	15	Amakandu	2021	\N	t	\N	4	Low	Low	High	Low	Low	High	High	\N	{YouTube}	{"Engineering Concepts","Sensory Exploration",Nature,ASMR,"Nature Sounds",Relaxation,"Captivating Visuals","Creativity & Imagination"}	Real Props No Animations 	/media/tv-shows/show-8.png	415000	217	UCvn4PVcIgJ19HZzTljPZqnA	t	2021-03-15T13:01:34.802011Z	f	t	f
125	Leo the Truck	Leo is a dump truck who is very curious and inquisitive. He loves to build things and see how they work.	2-6	15	\N	2014	2016	t	\N	5	Low-Moderate	Low-Moderate	Moderate-High	Moderate	High	High	Moderate	\N	{YouTube}	{Preschool-Basics,"Vehicle Themes",Colours,Shapes,"Vehicle Recognition",Mechanics,Curiosity}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	/media/tv-shows/show-125.jpg	\N	\N	\N	f	\N	f	f	f
93	GirlsTtoyZZ	A children's TV show	3-8	15	\N	\N	\N	t	\N	4	Low-Moderate	Moderate-High	High	Moderate-High	High	High	High	\N	{YouTube}	{"Sensory Exploration","Early Childhood experiences","Toy Review",Entertainment,"Teaching with Toys","Creativity & Imagination"}	Live-Action with Bright Colors and Simple Settings	/media/tv-shows/show-93.png	\N	\N	\N	f	\N	f	f	f
26	Bill Nye the Science Guy	It's "Mr. Wizard" for a different decade. Bill Nye is the Science Guy, a host who's hooked on experimenting and explaining. Picking one topic per show (like the human heart or electricity), Nye gets creative with teaching kids and adults alike the nuances of science.	8-14	30	Bill Nye	1993	1998	f	5	5	High	High	High	Moderate-High	High	High	High	\N	{TV}	{Experimentation,"Cause and Effect",Science,Curiosity,"Problem Solving",Discovery,Safety,"Critical Thinking","Natural World",STEM}	Live-action with fast-paced editing, animations, and special effects.	https://m.media-amazon.com/images/M/MV5BZjcxNTIyYTItNDVhMS00OWEyLTkxOTUtZTFkMWQxZjUyZjQ3XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
23	Beep and Mort	Beep and Mort are two best friends from different worlds learning to solve their daily dilemmas and unexpected challenges through invention, play and adventure.	3-6	30	Rosemary Myers	2022	\N	t	2	1	Moderate	Moderate	Low	Low-Moderate	Moderate	Low-Moderate	Low	\N	{TV}	{Adventure,Teamwork,Perseverance,Curiosity,"Problem Solving","Emotional Intelligence",Friendship,"Creativity & Imagination"}	Live-action puppetry with colorful characters.	/media/tv-shows/show-image-1748363904639-448473709-optimized.jpg	\N	\N	\N	f	\N	t	f	f
6	Alma's Way	The engaging modern-day series stars 6-year-old Alma Rivera, a proud, confident Puerto Rican girl, who lives in the Bronx with her parents and younger brother, Junior, as well as a diverse group of close-knit and loving friends, family, and community members. In each 11-minute story, Alma speaks directly to young viewers, sharing her observations and feelings, working through challenges, and offering them a window into her everyday life. In every episode, Alma's Way aims to model self-awareness, responsible decision making, and empathy, encouraging kids to generate and value their own ideas and questions. As she uses "Think-Through" moments to stop, listen, and process in the face of a tough decision, Alma reflects and takes action while demonstrating social awareness.	4-8	30	Sonia Manzano	2021	\N	t	2	2	High	Moderate	Low-Moderate	Moderate	Moderate-High	Low	Low	\N	{YouTube}	{"Cause and Effect","Problem Solving","Critical Thinking",Social-Emotional,"Cultures & Traditions"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	https://m.media-amazon.com/images/M/MV5BZGI3N2VlOWUtNDcxMC00M2ExLWI2MjYtODJhY2U4ZmVmNTFiXkEyXkFqcGc@._V1_SX300.jpg	190	12		t	2024-02-08T11:22:41.342226Z	t	t	f
33	Bob the Builder	Bob the Builder and his machine team are ready to tackle any project. Bob and the Can-Do Crew demonstrate the power of positive thinking, problem-solving, teamwork, and follow-through. The team always shows that "The Fun Is In Getting It Done!" Bob the Builder can be seen building, digging, and hauling.	3-6	30	Keith Chapman	1997	2015	f	21	4	Low-Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate	Moderate-High	\N	{TV}	{Teamwork,"Repetitive Learning","Problem Solving",Friendship,"Creativity & Imagination"}	Traditional Stop-Motion animation	/media/tv-shows/show-image-1748363632003-20712102-optimized.jpg	\N	\N	\N	f	\N	t	f	f
19	Barbapapa	The Barbapapas are creatures that can change their form, and those are the adventures is this unusual family in his struggle to find his place in the planet while helping other people and animals	3-7	30	\N	1973	1977	f	2	3	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Enviromental Awareness",Social-Emotional,"Creativity & Imagination"}	traditional hand-drawn 2D animation	https://m.media-amazon.com/images/M/MV5BYWM3MjQ0OWQtNGNlZC00OGE1LWFmMGMtNmQ0MGY0NTgxM2UxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
27	Bing	Celebrating the noisy, joyful, messy reality of pre-school life.	2-4	30	Lucy Murphy	2014	2021	f	4	2	Low-Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Low	\N	{TV}	{"Problem Solving","Social Development","Emotional Intelligence"}	3D CGI animation	https://m.media-amazon.com/images/M/MV5BMjIzMDEyNjgwMF5BMl5BanBnXkFtZTgwNDQwNTI4MjE@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
24	Ben & Holly's Little Kingdom	The friendship between fairy princess Holly and Ben Elf in the magical Kingdom of elves and fairies.	4-8	30	\N	2009	2013	f	2	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Teamwork,"Problem Solving",Friendship,"Creativity & Imagination"}	Digital 2D animation	https://m.media-amazon.com/images/M/MV5BMGQyZGZmNTYtZmRhZi00ODE1LWJjMzEtMjM4YjVmYzE1MjhmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
46	Chip and Potato	Chip, a 4-year-old pug puppy, takes her first steps towards independence at kindergarten with secret friend Potato-a teensy tiny mouse-at her side.	3-6	30	Catherine Williams	2018	\N	t	2	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Family Values",Perseverance,"Problem Solving","Overcoming Fears",Social-Emotional,"Emotional Intelligence",Friendship}	2D Digital Animation with soft, rounded designs. Color Palette: Warm and pastel colors.	https://m.media-amazon.com/images/M/MV5BYzBiYzY2ZjYtYjViNC00OTgyLTk0OWEtN2RhZjdkZTQzZjg1XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
50	Clifford the Big Red Dog	The adventures of a larger-than-life red dog on Bridwell Island.	3-6	30	Karen Heathwood	2000	2003	f	\N	3	Low-Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Problem Solving","Social Development",Community,"Emotional Intelligence",Friendship}	3D CGI animation	/media/tv-shows/show-image-1748363435146-24857565-optimized.jpg	\N	\N	\N	f	\N	t	f	f
52	CoasterFan2105	A hobby channel for Locomotive enthusiasts	0-13+	15	\N	\N	\N	t	\N	2	Low-Moderate	Low-Moderate	Moderate-High	Low	Low	Moderate	Moderate	\N	{YouTube}	{"Cultural Appreciation","Engineering Concepts",Hobbies,Entertainment,Curiosity,History,"Travel Geography",Machinery,"Locomotive History",Trains}	High-Definition Live-Action Footage	/media/tv-shows/show-52.jpg	\N	\N	\N	f	\N	f	f	f
43	Care Bears: Unlock the Magic	A group of lovable, huggable BFFs go on adventures and live that sweet Care Bear life. When a new adventure takes them to a strange new world, the bears have to lean on each other more than ever. Through friendship, courage and a little belly badge magic, the Care Bears continue their mission to spread caring and sharing to the world.	4-8	30	\N	2019	2021	f	2	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Learning from Mistakes","Social Development",Social-Emotional,"Emotional Intelligence",Friendship}	2D Digital Animation with a modern, vibrant design. Color Palette: Bright and pastel colors with high saturation.	https://m.media-amazon.com/images/M/MV5BMTk2M2U5MWMtMjdiNy00N2ZiLWFkM2ItMTllMjRjNjc4ZTQxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
47	City of friends	Max, Ted and Elphie are three recruits who are learning how to become real members of the rescue services in the City Of Friends.	3-6	11	\N	2011	\N	t	2	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Community Service",Teamwork,Responsibility,"Problem Solving"}	3D CGI Animation with detailed environments.	/media/tv-shows/show-47.jpg	\N	\N	\N	f	\N	f	f	f
49	Clifford the Big Red Dog	The adventures of a larger-than-life red dog on Bridwell Island.	4-8	30	Karen Heathwood	2000	2003	f	3	2	Low-Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Problem Solving","Social Development",Community,"Emotional Intelligence",Friendship}	Digital 2D animation	https://m.media-amazon.com/images/M/MV5BOWUwN2FiMDAtNDI5Zi00M2RjLWE3NzItMzVlYmZmNjBiZDdjXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
164	Noddy, Toyland Detective	A children's TV show	4-7	11	\N	\N	\N	t	\N	4	Low-Moderate	High	Moderate-High	High	High	High	Moderate-High	\N	{TV}	{Adventure,"Problem Solving","Social Development",Social-Emotional,Friendship}	3D CGI animation with bright and vivid colors	/media/tv-shows/show-164.jpeg	\N	\N	\N	f	\N	f	f	f
38	Builder Brothers' Dream Factory	10-year-old twins, Drew and Jonathan. A pair of regular kids whose extraordinary imagination, creativity, grit and heart help solve problems in their neighborhood by dreaming big and sometimes too big.	4-8	30	\N	2023	\N	t	1	3	High	Moderate-High	Medium	Moderate-High	Moderate-High	Moderate-High	Moderate-High	\N	{TV}	{"Engineering Concepts",Teamwork,"Critical Thinking","Creativity & Imagination",STEM}	3D CGI Animation with detailed environments.	https://m.media-amazon.com/images/M/MV5BYzJhYWZiZTYtZDJlMS00YjdiLTk5MDktMTFjNTNlZmZkOTk0XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
67	Digimon: Digital Monsters	Seven kids attending a summer camp in Japan are transported to an alternate world linked to ours by the Information Superhighway. That's why it is called Digiworld. The kids make friends with strange creatures called Digimon who become stranger as they "digivolve". During the course of the story, the kids learn that they and the Digimon are the only hope of saving both Earth and Digiworld from total destruction.	8-14	30	Edward Kay	1999	2007	f	4	5	Low	High	High	Moderate-High	High	High	High	\N	{TV}	{Adventure,Teamwork,Perseverance,Entertainment,"Fantasy Elements",Friendship,"Mild Fantasy Violence"}	Traditional 2D Anime-style Animation.	https://m.media-amazon.com/images/M/MV5BZmZjN2I2OGEtMzJkMS00Y2I2LWI0ZGQtMjExNzY0Mzk1YjEwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
71	Dinotrux	A children's TV show	4-8	23	\N	2015	2017	t	5	4	Moderate	Moderate	High	Moderate-High	High	High	High	\N	{TV}	{"Engineering Concepts",Teamwork,Dinosaurs,Perseverance,Entertainment,"Problem Solving","Creativity & Imagination"}	3D CGI Animation with detailed characters and environments. Color Palette: Bright and vivid colors with metallic textures.	/media/tv-shows/show-71.jpg	\N	\N	\N	f	\N	f	f	f
70	Dinosaur train	Friendly dinosaurs climb aboard a train to visit different times throughout the prehistoric age, learning about dinosaurs and having fun adventures.	3-6	26	Craig Bartlett	2009	2023	t	7	5	Moderate	High	High	Moderate-High	High	High	Moderate-High	\N	{TV}	{Paleontology,Dinosaurs,Science,"Natural World",Exploration,"Natural History",Friendship,STEM}	3D CGI animation	/media/tv-shows/show-70.jpg	\N	\N	\N	f	\N	f	f	f
163	Noddy Original Series (1998)	A children's TV show	3-6	10	\N	\N	\N	t	2	2	Low-Moderate	Low-Moderate	Low-Moderate	Moderate	Low-Moderate	Low-Moderate	Low	\N	{TV}	{Friendship,"Problem Solving",Adventure,Social-Emotional,"Social Development"}	Stop-Motion with simple models. Color Palette: Bright but soft colors.	/media/tv-shows/show-163.jpg	\N	\N	\N	f	\N	f	f	f
177	Peg+Cat	The Fred Rogers Company introduces a new animated preschool series featuring Peg and her sidekick, Cat, as they encounter unexpected challenges that require arithmetic and problem-solving skills. Each episode features two stories in which Peg and Cat face a math word problem that they must solve. Children will learn how to build calculation skills and think about larger concepts that will help them form the foundation for learning math at any level, from kindergarten through calculus.	4-7	11	Billy Aronson	2013	2018	t	3	3	High	High	Moderate	Moderate	High	Moderate	Moderate	\N	{TV}	{Math,"Problem Solving","Critical Thinking",Adventure,Perseverance}	2D Digital Animation with a hand-drawn, sketch-like aesthetic.	/media/tv-shows/show-177.jpeg	\N	\N	\N	f	\N	f	f	f
254	The Busy World of Richard Scarry	A children's TV show	3-6	23	\N	1993	1997	t	5	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Low-Moderate	\N	{TV}	{"Community Service","Cultural & Social","Relatable Situations","Learning from Mistakes",Curiosity,"Problem Solving",Social-Emotional}	Traditional 2D hand-drawn animation with detailed illustrations. Soft, pastel colors with a focus on everyday environments.	/media/tv-shows/show-254.jpg	\N	\N	\N	f	\N	f	f	f
61	Daniel Tiger's Neighbourhood	A children's TV show	2-5	26	\N	\N	\N	t	7	2	High	Moderate	Low	Low-Moderate	High	Low	Low-Moderate	\N	{TV}	{"Life Lessons","Relatable Situations","Problem Solving","Communiction & Expression","Social Development",Social-Emotional,"Family Relationships","Emotional Intelligence",Friendship}	Digital 2D animation	/media/tv-shows/show-61.jpg	\N	\N	\N	f	\N	f	f	f
68	Dino Dana	Dana is a 9-year old girl who loves dinosaurs. Her life changes forever when she's given a Dino Field Guide, which not only teaches her new things about dinosaurs, but gives her the power to imagine dinosaurs into real life.	5-9	30	J.J. Johnson	2017	2020	f	4	3	High	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Paleontology,Science,Curiosity,"Problem Solving","Critical Thinking","Natural History",Ecosystems,"Creativity & Imagination"}	Live-Action with CGI Dinosaurs. Color Palette: Natural colors with realistic environments.	https://m.media-amazon.com/images/M/MV5BMTY4MDU0MDM5NV5BMl5BanBnXkFtZTgwMTkxMzE0MjI@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
64	De Zoete Zusjes	A children's TV show	4-10	15	\N	\N	\N	t	\N	3	Moderate	Moderate-High	Medium	Moderate	Moderate	Moderate	Moderate-High	\N	{YouTube}	{"Family Values","Dutch Language",Vocabulary,"Relatable Situations","Problem Solving","Family Relationships","Creativity & Imagination"}	Live-Action with Puppetry and Props	/media/tv-shows/show-64.jpg	\N	\N	\N	f	\N	f	f	f
69	Dino Ranch	A children's TV show	3-6	11	Matthew Fernandes	2021	\N	t	3	3	Moderate	Moderate	Medium	Moderate-High	Moderate	Moderate-High	Moderate	\N	{TV}	{Adventure,Teamwork,Dinosaurs,Responsibility,"Problem Solving"}	3D CGI animation	/media/tv-shows/show-69.jpg	\N	\N	\N	f	\N	f	f	f
59	Curious George	Follows the mischievous adventures of a Monkey by the name of George.	3-6	30	\N	2006	2022	f	15	2	Moderate	Moderate	Medium	Moderate	Moderate-High	Moderate-High	Moderate	\N	{TV}	{"Motor Skills",Science,Curiosity,Discovery,Exploration,STEM}	Digital hand-drawn 2D artwork animation.	https://m.media-amazon.com/images/M/MV5BNTJjNDNlMmUtNzkxNi00ZDMwLThlMjItNDIyZGY5Y2U4MTk3XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
222	Spidey and his amazing friends	Follow Peter Parker, Gwen Stacy and Miles Morales and their adventures as the young heroes team up with Hulk, Ms. Marvel and Black Panther to defeat foes like Rhino, Doc Ock and Green Goblin and learn that teamwork is the best way to save the day.	3-7	30	\N	2021	\N	t	3	5	Low	High	High	High	High	High	High	\N	{TV}	{Teamwork,"Positive Role Models",Responsibility,Entertainment,"Mischievious Behaviour","Mild Peril","Super Hero Themes","Recurring Antagonist"}	3D CGI	https://m.media-amazon.com/images/M/MV5BNzBmMzljNGItY2ZhZi00ZDY2LTk2ZTYtMmI3ZjRjYzdiMDE3XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
87	Frog and Toad	Follows two amphibian friends striving to balance the great outdoors and home pleasure, as they are thrown from one optimistic adventure to another.	3-7	30	\N	2023	\N	t	2	1	Moderate	Moderate	Low	Low-Moderate	Moderate	Low	Low	\N	{TV}	{Nature,Patience,"Relatable Situations","Problem Solving","Emotional Intelligence",Friendship}	2D Digital Animation with a hand-drawn aesthetic.	https://m.media-amazon.com/images/M/MV5BY2M3NzE1NTYtZGJjMS00NTVjLWI5YTktMDM5ZDRjZGJmMWY0XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
74	Dora the Explorer	Dora is a little Hispanic girl with who goes on adventures with her red boot wearing monkey, conveniently named Boots. During her adventures we also get to meet her talking backpack (or la mochila) and the map who sings an annoyingly cute song. The show plays out almost like a computer adventure showing a mouse on different scenes where the kids make a decision. Dora asks your kids questions and then waits for a response. Dora would then congratulate your child for trying, while replying back with the correct answer to encourage them. The main purpose of the show is to teach Spanish to English-speaking children.	2-6	30	\N	2000	2019	f	8	5	High	High	High	High	High	High	High	\N	{TV}	{Elementary-Basics,Geography,Adventure,Teamwork,"Problem Solving","Language Learning","Cognitive Development"}	Digital 2D animation	https://m.media-amazon.com/images/M/MV5BZWFiZmM2ZGQtZGE0OC00ZmI4LWI0NzAtM2QzZDg5ODdiYWQ5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
76	Dragon Tales	A children's TV show	3-7	26	Ron Rodecker	1999	2005	t	3	2	Low-Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate	\N	{TV}	{Teamwork,Perseverance,"Problem Solving","Social Development",Social-Emotional,"Emotional Intelligence","Creativity & Imagination"}	Traditional 2D Animation with soft designs. Color Palette: Pastel colors with whimsical settings.	/media/tv-shows/show-76.jpg	\N	\N	\N	f	\N	f	f	f
77	Duck & Goose	Based on Tad Hills's beloved picture books, this series will follow the adventures of best pals, Duck and Goose.	2-5	30	Tad Hills	2022	\N	t	2	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Low-Moderate	\N	{TV}	{Teamwork,"Problem Solving","Social Development",Social-Emotional,"Emotional Intelligence",Friendship}	2D Digital Animation with a watercolor aesthetic. Color Palette: Soft and natural colors with pastel hues.	https://m.media-amazon.com/images/M/MV5BYmNkZmUyNGEtMmY1Ni00NjRmLWEzMWQtMzY2ZjMzZTUzNmQ1XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
82	Ernst, Bobbie en de rest	Dutch tv-show about two middle aged best friends who have the greatest adventures.	4-8	30	\N	1998	\N	t	7	3	Moderate	High	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Teamwork,Perseverance,"Problem Solving","Social Development",Humor}	Dutch children's show, Live-Action with comedic elements. 	https://m.media-amazon.com/images/M/MV5BZjU0MTQ3ODEtNzJlYS00YzQ4LWIxN2MtY2I2NTFhY2IzZWQ2XkEyXkFqcGdeQXVyNzE2MTQyMzM@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
89	Gecko’s Garage	A children's TV show	2-5	15	\N	2015	2017	t	\N	3	Moderate	Moderate-High	High	Moderate	Moderate-High	High	Moderate	\N	{YouTube}	{Mechanics,"Engineering Concepts",Teamwork,Shapes,"Vehicle Themes",Colours}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	/media/tv-shows/show-89.jpg	\N	\N	\N	f	\N	f	f	f
88	Gabby's Dollhouse	A children's TV show	3-7	24	Jennifer Twomey	2021	\N	t	10	4	Moderate	Moderate	High	Moderate-High	High	Moderate-High	High	\N	{TV}	{"Problem Solving","Emotional Intelligence","Creativity & Imagination"}	Live-action and 3D CGI animation	/media/tv-shows/show-88.jpg	\N	\N	\N	f	\N	f	f	f
80	Elmo's World	A children's TV show	1-4	15	\N	1979	2010	t	14	2	High	Moderate	Medium	Moderate-High	Moderate	Low-Moderate	Low-Moderate	\N	{TV}	{"Motor Skills",Shapes,"Sing Along",Colours,Literacy,Dance,Preschool-Basics,Social-Emotional,Numeracy}	Combination of Live-Action and 2D Animation. Color Palette: Bright and primary colors.	/media/tv-shows/show-80.webp	\N	\N	\N	f	\N	f	f	f
81	English Tree	A children's TV show	2-6	15	\N	\N	\N	t	\N	3	High	Moderate-High	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Learning through Songs",Phonics,Shapes,"Repetitive Learning",Vocabulary,"Sing Along",Colours,Literacy,Music,Numeracy,"Language Learning","Cognitive Development"}	2D and 3D Animation with Bright Colors and Simple Characters	/media/tv-shows/show-81.jpg	\N	\N	\N	f	\N	f	f	f
73	Doggyland	Doggyland is a 3D animated series that features a colorful cast of dogs in a vibrant world where they sing, rap and dance to fun and educational songs that teach learning and cognitive fundamentals for kids all around the world.	2-6	30	\N	2022	\N	t	\N	4	High	High	High	High	High	High	High	\N	{YouTube}	{"Learning through Songs",Animals,Shapes,"Repetitive Learning","Sing Along",Colours,Literacy,Music,Dance,Preschool-Basics,Social-Emotional,Numeracy,"Cognitive Development"}	3D Animation with Bright Colors and Anthropomorphic Dogs	/media/tv-shows/show-image-1748360048030-363098497-optimized.jpg	\N	\N	\N	f	\N	t	f	f
95	Go, Dog. Go!	Young pup Tag Barker and her adventures in Pawston, a colorful community of dogs on the go.	3-6	30	\N	2021	\N	t	4	4	Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate-High	High	\N	{TV}	{Teamwork,"Relatable Situations","Problem Solving","Critical Thinking",Friendship,"Creativity & Imagination"}	3D CGI Animation with stylized character designs based on the original book illustrations. Color Palette: Bright and vivid colors with a focus on primary colors.	https://m.media-amazon.com/images/M/MV5BMDM2YTM3MDYtMGFlYy00ZjRlLWI5MGEtYmQ4ZjVmNTc1YWJjXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
103	Helper Cars	A children's TV show	2-5	15	\N	\N	\N	t	\N	3	Low	Low-Moderate	High	Moderate	High	High	Moderate-High	\N	{YouTube}	{"Vehicle Themes",Teamwork,Colours,Shapes,"Problem Solving","Vehicle Recognition",Entertainment,Mechanics}	3D CGI Animation with Bright Colors and Friendly Vehicle Characters	/media/tv-shows/show-103.jpg	\N	\N	\N	f	\N	f	f	f
92	Gigantosaurus	Four curious young dinosaur friends explore the mystery of Gigantosaurus, the largest, fiercest dinosaur of all, as they face their individual fears and work together to solve problems during their many adventures. Based on the book 'Gigantosaurus' by Jonny Duddle.	3-6	30	Franck Salomé	2019	\N	t	3	4	Low-Moderate	Moderate	High	Moderate-High	High	High	High	\N	{TV}	{Adventure,Teamwork,Dinosaurs,Entertainment,"Problem Solving"}	3D CGI Animation with detailed and dynamic visuals.	https://m.media-amazon.com/images/M/MV5BMWM4Y2MwYzUtZDQ5NC00NWFhLTg5ZjEtYmRiZWMxYzE0YWYyXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
104	Hero Elementary	"HERO ELEMENTARY centers around a team of super students called Sparks' Crew. Led by their quirky and enthusiastic teacher, Mr. Sparks, these pint size heroes work together to help people, solve problems, and try to make the world a better place. When their imperfect powers aren't up to the task, they look to their other powers - the Superpowers of Science - to help them investigate, observe, make predictions, and figure out a solution to save the day!"	4-8	30	Christine Ferraro	2020	\N	t	2	4	High	High	High	Moderate-High	High	High	Moderate	\N	{TV}	{Teamwork,Science,Curiosity,"Problem Solving","Critical Thinking","Super Hero Themes","Emotional Intelligence",STEM}	2D Digital Animation with bright and colorful designs. Color Palette: Bright and vivid colors with emphasis on primary colors.	https://m.media-amazon.com/images/M/MV5BYTAwNDlhMzQtZGI0OC00MjQyLWE0NjUtNWMzNjliNmM3NGUyXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
111	It's a Big Big World	From the creator of "Bear in the Big Blue House," "It's a Big Big World" features Snook the sloth. He lives in the World Tree with various animal friends including marmosets, a tree frog and an anteater.	3-6	27	Mitchell Kriegman	2006	\N	t	2	2	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Enviromental Awareness",Science,Friendship,Nature,Ecosystems,Curiosity}	Live-action puppetry with CGI backgrounds.Color Palette: Soft, natural colors with earthy tones.	/media/tv-shows/show-111.jpeg	\N	\N	\N	f	\N	f	f	f
113	JoJo & Gran Gran	The adventures of a cheerful 4, going on 5-year-old JoJo and her loving Gran Gran.	3-6	11	\N	2020	\N	t	3	2	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Cultures & Traditions","Family Relationships","Family Values","Relatable Situations","Emotional Intelligence"}	2D Digital Animation with a hand-drawn aesthetic.	/media/tv-shows/show-113.jpg	\N	\N	\N	f	\N	f	f	f
121	Kipper	On Christmas Eve, the tree is decorated, and gifts are unwrapped ... and Arnold receives a fun gift from Kipper! As their world turns into a winter wonderland, Kipper and Tiger turn themselves into a giant snowball and build - what else? - a snow dog! From sledding down Big Hill to slip-sliding across a frozen pond to building an igloo, Kipper loves playing with his friends all winter long!	2-5	10	\N	1997	2004	t	6	1	Moderate	Low-Moderate	Low	Low-Moderate	Low	Moderate	Low	\N	{TV}	{"Problem Solving",Social-Emotional,Friendship,"Creativity & Imagination"}	Traditional hand-drawn 2D animation	/media/tv-shows/show-121.jpg	\N	\N	\N	f	\N	f	f	f
122	Kiri and Lou	Kiri and Lou is an animated series for children, hand-crafted in stop motion with creatures made of clay, in a forest of cut out paper. Each five minute story is told with humour and joy, about the friendship of two prehistoric creatures and their adventures in the forest. Kiri and Lou laugh and sing and play all kinds of games with their friends, as they learn to deal with the emotions of childhood. The series is written and directed by Harry Sinclair, based on an original idea by Rebecca Kirshner and Harry Sinclair.	3-6	5	\N	2019	\N	t	4	1	Moderate	Low-Moderate	Low	Low	Moderate	Low	Low	\N	{TV}	{Social-Emotional,Friendship,Nature,"Emotional Intelligence",Mindfulness}	Stop-motion animation using clay and paper cutouts	/media/tv-shows/show-122.jpg	\N	\N	\N	f	\N	f	f	f
120	Kids 2 kids	A children's TV show	5-10	15	\N	\N	\N	t	\N	4	Low	Moderate-High	Low-Moderate	Low-Moderate	Moderate	Moderate	High	\N	{YouTube}	{"Vehicle Themes","Learn Through Play","Creativity & Imagination",Social-Emotional,Humor,"Outdoor Exploration","DIY Projects",Curiosity,"Silly Comedy"}	Live-Action Family Videos	/media/tv-shows/show-120.png	\N	\N	\N	f	\N	f	f	f
112	Johnson & Friends	The adventures of Johnson the courageous pink elephant, Alfred the leaky hot water bottle, McDuff the cheeky concertina, Diesel the noisy dump truck, Squeaky the shy robot and Victoria the gracious dinosaur, who live amongst the clutter in Michael's bedroom. This irrepressible bunch of toys share their adventures while Michael is out or asleep.	3-6	10	\N	1990	1995	t	4	2	Moderate	Low-Moderate	Moderate	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Creativity & Imagination",Friendship,"Problem Solving",Teamwork}	Live action with costumed characters	/media/tv-shows/show-112.jpg	\N	\N	\N	f	\N	f	f	f
117	Katuri tv	A children's TV show	3-7	15	\N	\N	\N	t	\N	3	Low	Moderate	Moderate	Moderate	Moderate-High	Moderate	Low-Moderate	\N	{YouTube}	{Nature,"Family Relationships",Animals,"Nature Sounds","Problem Solving","Social Development",Entertainment,Humor,Social-Emotional}	3D CGI animation with bright and vivid colors	/media/tv-shows/show-117.webp	\N	\N	\N	f	\N	f	f	f
119	Kid-E-Cats	KID-E-CATS tells a story of family life, relationships and adventures of three kittens: Cookie, Pudding and their little sister Candy. They never stand still: together, they learn to express their feelings, support each other, and find a way out of any situation, with a little help from their imagination and some parental advice.\nНомер заявления о регистрации № 4875012312	3-6	15	Andrey Sikorsky	2015	\N	t	\N	3	Low-Moderate	High	Moderate	Moderate-High	High	Moderate	Moderate-High	\N	{YouTube}	{"Creativity & Imagination","Problem Solving",Friendship,"Emotional Intelligence","Conflict Resolution","Family Relationships","Family Values",Social-Emotional,"Social Development","Relatable Situations"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	/media/tv-shows/show-119.jpeg	512000	707	UCTtPd40aikv5DWdW3KGkrQA	t	2018-07-03T08:05:27Z	f	f	f
114	Juf Roos	A children's TV show	2-6	15	Frank Jan Horst	2015	\N	t	\N	3	Moderate	Moderate-High	Moderate	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Cultures & Traditions","Cultural Appreciation","Learning through Songs","Dutch Language","Language Learning","Sing Along",Dance,Literacy,Music}	Live-Action with Colorful Costumes and Simple Sets	/media/tv-shows/show-114.jpeg	\N	\N	\N	f	\N	f	f	f
118	Kazwa and Bilal	A children's TV show	3-6	11	\N	\N	\N	t	3	1	Moderate	Low	Moderate	Low-Moderate	Moderate-High	Moderate-High	Moderate	\N	{TV}	{"Cultural Appreciation","Cultures & Traditions","Cultural & Social",Curiosity,Social-Emotional,"Relatable Situations",Religion,Morality}	2D Digital Animation with bright and colorful designs. Color Palette: Bright and vivid colors with emphasis on primary colors.	/media/tv-shows/show-118.png	\N	\N	\N	f	\N	f	f	f
131	Little Bear	Little Bear learns the ways of the world in this wonderful series based on the classic children's book. Little Bear learns about character, honesty, and love. There are fun adventures, games and much more to be had here.	3-6	24	Else Holmelund Minarik	1995	2003	t	5	1	Low-Moderate	Moderate	Low	Low	Moderate	Low	Low	\N	{TV}	{"Creativity & Imagination","Family Relationships","Social Development","Emotional Intelligence","Family Values"}	Traditional Hand-Drawn 2D animation	/media/tv-shows/show-131.jpg	\N	\N	\N	f	\N	f	f	f
91	Get Rolling with Otis	Welcome to Long Hill Dairy Farm, home to Otis the tractor and all his friends. Otis may be little, but he has a big heart. Whenever he sees a friend in need, he hits the brakes to see what's wrong and rolls into action to help.	3-6	30	\N	2021	\N	t	2	3	Moderate	Moderate	Medium	Low-Moderate	Moderate	Low-Moderate	Low-Moderate	\N	{TV}	{Teamwork,Perseverance,"Problem Solving","Social Development","Emotional Intelligence"}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	https://m.media-amazon.com/images/M/MV5BOWQ0Y2MxMmItZmZiMC00YTg4LWIwOGEtZDE1YTc2NjRkYmZmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
133	Llama Llama	A children's TV show	3-6	24	\N	\N	\N	t	2	2	Moderate	Moderate	Low	Low-Moderate	Moderate	Low	Low-Moderate	\N	{TV}	{"Family Values","Relatable Situations","Problem Solving","Social Development",Social-Emotional,"Emotional Intelligence"}	Digital 2D animation	/media/tv-shows/show-133.jpg	\N	\N	\N	f	\N	f	f	f
109	If You Give a Mouse a Cookie	In the If You Give a Mouse a Cookie series, based on the beloved books by Laura Numeroff and Felicia Bond, we get to know Mouse, Pig, Moose, Dog and Cat and their favorite humans. When Mouse and friends get together, one thing always leads to another in the most unexpected ways. You just never know where things will end up, but you can be sure that IF Mouse and Friends go on an adventure together, THEN they will just have to have fun the whole time.	3-6	30	\N	2015	2021	f	2	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Cause and Effect","Life Lessons",Curiosity,"Problem Solving","Critical Thinking","Creativity & Imagination","Cognitive Development"}	2D digital animation	https://m.media-amazon.com/images/M/MV5BYmQ0MTM2NmItNGRkMi00ZmY2LThjMWYtZmJhZmI2NmNhMzM5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
18	Bananas in Pyjamas	What happens when B1 and B2, two mischievous bananas, get together with their neighbours, the Teddies? Plenty. An engaging series for children aged 1 to 5-years-old which sees the bananas and their friend Rat-in-a-Hat get up to all sorts of high jinx.	2-5	30	\N	1992	2001	f	\N	1	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Repetitive Learning","Problem Solving","Sing Along",Social-Emotional,Friendship}	3D CGI animation introduces brighter colors and more dynamic visuals but the animation remains straightforward to prevent overstimulation	https://m.media-amazon.com/images/M/MV5BZjBmN2Y3Y2EtODlkNi00ZjMxLWE3NjQtZGQyMzQ4YjQ2N2Q1XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
134	Lucas the spider(2021)	A children's TV show	3-6	359	\N	\N	\N	t	6	3	Low	Low	Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Overcoming Fears","Emotional Intelligence","Relatable Situations","Creativity & Imagination","Recurring Antagonist"}	3D CGI animation	/media/tv-shows/show-134.jpg	\N	\N	\N	f	\N	f	f	f
72	Doc McStuffins	A children's TV show	3-6	24	Chris Nee	2012	2022	t	5	3	High	Moderate-High	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Medical Care",Curiosity,"Problem Solving",Social-Emotional,"Emotional Intelligence","Health & Well-being"}	3D CGI Animation with soft, rounded designs. Color Palette: Bright and cheerful colors.	/media/tv-shows/show-72.jpg	\N	\N	\N	f	\N	f	f	f
135	Lyla in the loop	Seven-year-old Lyla and her close-knit family address everyday problems together in the big city.	5-8	26	David Peth	2024	\N	t	2	3	High	Moderate-High	Moderate	Moderate	Moderate-High	Moderate	Moderate	\N	{TV}	{"Creativity & Imagination",STEM,"Problem Solving","Motor Skills",Curiosity,"Critical Thinking","Relatable Situations"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds.	/media/tv-shows/show-135.jpg	\N	\N	\N	f	\N	f	f	f
132	Little Einsteins (2005-2009)	A children's TV show	3-6	24	\N	\N	\N	t	2	5	High	High	High	High	High	High	High	\N	{TV}	{"Cultural Appreciation",Music,Art,"Problem Solving","Cognitive Development",Teamwork,History}	digital 2D animation. CGI for the Rocket ship and certain elements.	/media/tv-shows/show-132.jpg	\N	\N	\N	f	\N	f	f	f
149	Ms Rachel	Ms. Rachel, a beloved YouTuber, brings her hit educational content: songs, games, and lessons to help kids learn. The show covers speech, words, phonics, and more, with subtitles in 33 languages.	1-4	15	\N	2025	\N	t	\N	4	High	High	Low-Moderate	Moderate	High	Low-Moderate	Low-Moderate	\N	{YouTube}	{Phonics,"Speech Development","Early Childhood experiences","Sing Along",Social-Emotional,"Language Learning","Cognitive Development"}	Primarily live-action with Miss Rachel interacting directly with the audience. Some Puppet and 2D Animation use	/media/tv-shows/show-149.webp	\N	\N	\N	f	\N	f	f	f
146	Mira, Royal Detective	A brave, resourceful girl becomes a royal detective in India after solving a mystery that saved the kingdom's young prince.	4-8	24	Becca Topol	2020	2022	t	2	4	High	Moderate-High	Moderate-High	Moderate	Moderate	Moderate-High	Moderate-High	\N	{TV}	{"Positive Role Models","Cultures & Traditions","Cultural Appreciation","Problem Solving","Critical Thinking",Mystery,Adventure,Curiosity}	2D Digital Animation with Vibrant Colors	/media/tv-shows/show-146.jpg	\N	\N	\N	f	\N	f	f	f
138	Maizen	Thank you very much for watching our videos. Please use this form to get in touch with us.\n►	7-12, 12+	15	Maizen	2020	\N	t	\N	4	Low	High	High	Moderate-High	High	High	High	\N	{YouTube}	{"Arts & Crafts",MineCraft,Entertainment,"Problem Solving","Critical Thinking","Interactive Game Elements","Building and Design","Creativity & Imagination",Humor}	Real In Game Video Footage	/media/tv-shows/show-138.jpg	13300000	1003	UCJHBJ7F-nAIlMGolm0Hu4vg	t	2020-12-27T05:59:33.722121Z	f	t	f
141	Mickey Mouse Clubhouse	Mickey and his friends Minnie, Donald, Pluto, Daisy, Goofy, Pete, Clarabelle and more go on fun and educational adventures.	2-5	24	Bobs Gannaway	2006	2016	t	4	4	High	Moderate-High	High	High	High	High	Moderate-High	\N	{TV}	{"Early Childhood experiences",Preschool-Basics,Numeracy,Teamwork,Shapes,"Cognitive Development"}	3D CGI animation	/media/tv-shows/show-141.jpeg	\N	\N	\N	f	\N	f	f	f
16	Babblarna	A children's TV show	1-4	3	\N	\N	\N	t	1	1	High	Low	Low	Moderate	High	Low	Low	\N	{TV}	{Phonics,"Repetitive Learning",Social-Emotional,"Language Learning","Creativity & Imagination"}	3D CGI animation delivered slowly and smoothly	/media/tv-shows/show-16.jpg	\N	\N	\N	f	\N	f	f	f
142	Miffy and friends	Miffy is about a white kid rabbit in different simple stories that are narrated by a child speaker and underlined with nice orchestrated music. Some episodes have other characters such as Poppy Pig. The animations are simplified and are in basic colors and clear lines by renowned dutch illustrator Dick Bruna. Great and light entertainment for kids from 1 years old onwards. Created in 1992 they are still good and timeless fun.	2-5	555	\N	2003	\N	t	3	1	Moderate	Low	Low	Low-Moderate	Moderate	Low	Low	\N	{TV}	{"Early Childhood experiences",Social-Emotional,"Social Development",Teamwork,"Emotional Intelligence"}	2D Stop-Motion Animation with Simple Designs, Emphasizes clear shapes and actions easily understood by young viewers.	/media/tv-shows/show-142.jpeg	\N	\N	\N	f	\N	f	f	f
137	Maggie and the Ferocious Beast	A precocious 5-year-old named Maggie conjures up an imaginary land where she and her favorite toys, Hamilton Hocks and Ferocious Beast, can play and have adventures. The Ferocious Beast is anything but ferocious, though he is large, with red spots and three horns on his head.	3-6	23	Betty Paraskevas	1998	2009	t	3	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate	\N	{TV}	{"Creativity & Imagination",Friendship,"Problem Solving","Emotional Intelligence"}	2D Digital Animation with simple, childlike designs. Color Palette: Bright and pastel colors with minimal backgrounds.	/media/tv-shows/show-137.jpg	\N	\N	\N	f	\N	f	f	f
150	Mister Maker	A childs entertainment show that teaches you numerous easy arts and crafts for anybody watching. Great for holidays.	3-7	19	\N	2007	2009	t	3	2	High	Moderate-High	High	Moderate-High	High	High	Moderate	\N	{TV}	{"Positive Role Models","Creativity & Imagination","Arts & Crafts",Curiosity,"Motor Skills",Art,Colours}	Live-Action with colorful crafts and animated segments. Color Palette: Bright and varied colors.	/media/tv-shows/show-150.jpg	\N	\N	\N	f	\N	f	f	f
143	Milo	The story of a girl with a golden voice, who is forced to hide her talent from the outside world.	3-6	11	\N	2024	2025	t	2	3	Moderate	Moderate	Moderate-High	Moderate	Moderate-High	High	Moderate	\N	{TV}	{"Cultural & Social","Career Exploration",Teamwork,"Problem Solving",Responsibility,Curiosity}	2D Digital Animation with bright colors. Color Palette: Vibrant but not overwhelming.	/media/tv-shows/show-143.jpg	\N	\N	\N	f	\N	f	f	f
144	Minno - Bible Stories for Kids	A children's TV show	3-10	15	\N	\N	\N	t	\N	3	High	Moderate-High	Moderate	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"Religious Teachings","Positive Role Models","Spiritual Development","Cultures & Traditions","Cultural & Social","Biblical Stories",Faith,Religion,"Christian Values",Morality,"Positve Mindset"}	Varies across series, primarily 2D and 3D animations with colorful visuals and relatable character designs.	/media/tv-shows/show-144.png	\N	\N	\N	f	\N	f	f	f
170	Olivia	Olivia is an imaginative, and creative pig. She does everything with her best friends, Julian and Francine. Olivia is always up for fun, if it's at school, at home, or at a friends house.	3-6	22	\N	2009	2015	t	2	3	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Creativity & Imagination",Social-Emotional,"Problem Solving",Teamwork,Perseverance}	3D CGI Animation with a unique visual style resembling charcoal drawings with splashes of color.	/media/tv-shows/show-170.jpg	\N	\N	\N	f	\N	f	f	f
168	Odd Squad	Young government agents Olive and Otto use math to investigate strange occurrences in their town. Produced by The Fred Rogers Co., this live-action series targets preschool and early elementary schoolchildren and their families. Odd Squad cases include disappearing zeroes, Santa's missing reindeer, runaway dinosaurs, and characters who escape from books. Throughout the series, Olive and Otto learn not only how to solve problems but also about working together, communication and perseverance.	6-10	27	Timothy McKeon	2014	2022	t	3	5	High	High	High	High	High	High	High	\N	{TV}	{STEM,Math,Numeracy,Teamwork,"Critical Thinking","Problem Solving"}	Combination of live-action and CGI animation.	/media/tv-shows/show-168.jpg	\N	\N	\N	f	\N	f	f	f
156	Mr Bean Cartoon	A children's TV show	6-10	11	\N	\N	\N	t	5	4	Low	Low-Moderate	High	Moderate-High	High	High	High	\N	{TV}	{"Creativity & Imagination",Humor,Entertainment,"Problem Solving","Mischievious Behaviour"}	2D Digital Animation with exaggerated expressions. Color Palette: Bright colors with bold contrasts.	/media/tv-shows/show-156.jpeg	\N	\N	\N	f	\N	f	f	f
157	Mr. Monkey, Monkey Mechanic	Mr. Monkey, Monkey Mechanic is the go-to monkey mechanic for every animal's vehicular needs! With a special workbench for drawing up plans, a garage full of wacky materials, and his trusty monkey wrench, Mr. Monkey can solve any visitor's vehicular problem in surprising and creative ways!	3-6	5	\N	2017	\N	t	2	3	Moderate	Low-Moderate	Moderate-High	Moderate	High	High	Moderate	\N	{TV}	{"Creativity & Imagination",STEM,Mechanics,"Problem Solving","Engineering Concepts"}	2D Digital Animation with bright colors. Color Palette: Vibrant and engaging.	/media/tv-shows/show-157.jpg	\N	\N	\N	f	\N	f	f	f
154	Moon and Me	Pepi Nana is a doll who comes to life whenever the moon comes out (and her owner is asleep). Moon Baby visits them from the moon and, in what some people might deem a rude guest, proceeds to wake the rest of the toy house with an African thumb piano. He then guides them to Storyland for a story and a song.	1-4	22	Andrew Davenport	2019	\N	t	1	1	Moderate	Low-Moderate	Low	Low	Moderate	Low	Low	\N	{TV}	{"Early Childhood experiences",Preschool-Basics,"Creativity & Imagination",Social-Emotional}	Stop-Motion Animation with soft toys. Color Palette: Soft, soothing colors.	/media/tv-shows/show-154.jpg	\N	\N	\N	f	\N	f	f	f
20	Barney & Friends	Hey kids! Pick your feet up off the floor; it's time to dance with the dinosaur - Barney, that is, in this high-energy song and dance revue. You can't help but twist and shout to these infectious grooves, a compliation of funky favorites and danceable debuts. When you're ready to get down to some serious singing and swinging, Barney's got the dino dancin' tunes you'll want to see again and again!	2-5	30	Dennis DeShazer	1992	2010	f	13	2	High	Moderate	Low	Moderate	High	Low	Moderate	\N	{TV}	{Teamwork,Shapes,"Sing Along",Literacy,Music,Dance,Preschool-Basics,Social-Emotional,Numeracy,"Emotional Intelligence",Friendship}	Live action with costumed characters	https://m.media-amazon.com/images/M/MV5BMGMwMjVhNDctMjE5My00YjViLWFkMGItYzU3N2M3OTdkMDViXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
160	Nick Cope's Popcast	Nick writes a 'popcast' about something he see's.	3-6	207	\N	2020	\N	t	3	3	High	Moderate	Moderate	High	High	Moderate	Moderate	\N	{TV}	{"Communiction & Expression","Creativity & Imagination",Social-Emotional,"Emotional Intelligence","Sing Along",Dance,Music}	Live-action educational series with some animation and CGI. Color Palette: Natural colors with bright visuals during explanations.	/media/tv-shows/show-160.jpg	\N	\N	\N	f	\N	f	f	f
167	Numberblocks (2017-present)	A children's TV show	3-6	5	\N	\N	\N	t	7	3	High	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Elementary-Basics,Numeracy,"Problem Solving",Math,"Repetitive Learning"}	3D CGI animation	/media/tv-shows/show-167.jpg	\N	\N	\N	f	\N	f	f	f
161	Ninja Kids	A children's TV show	5-12	15	\N	\N	\N	t	\N	5	Moderate	High	High	High	High	High	High	\N	{YouTube}	{"Super Hero Themes","Creativity & Imagination","Positive Role Models","Physical Fitness",Exercise,Adventure,Entertainment,"Skit Comedy","Choreographed Action Scenes","Outdoor Exploration",Courage,"Confidence Building","Martial Arts","Mild Violent themes","Mischievious Behaviour"}	Live-action videos with dynamic editing and occasional special effects to enhance the viewing experience.	/media/tv-shows/show-161.png	\N	\N	\N	f	\N	f	f	f
187	Planet earth	Each 50 minute episode features a global overview of a different biome or habitat on Earth (Polar, Mountain, Cave, Desert, Plains, Fresh Water, Seas, Ocean, Forest), followed by a ten-minute featurette which takes a behind-the-scenes look at the challenges of filming the episode.	8+	50	\N	2006	\N	t	1	3	Low-Moderate	Low-Moderate	Moderate	Moderate	High	Low-Moderate	Moderate	\N	{TV}	{"Enviromental Awareness","Natural World",Nature,"Natural History","Wildlife Exploration",Science,"Realistic Depictions of Nature"}	Live-action nature documentary with high-definition footage. Natural colors showcasing diverse ecosystems.	/media/tv-shows/show-187.jpg	\N	\N	\N	f	\N	f	f	f
180	Peter Rabbit	Join Peter and his two bosom buddies; Benjamin and Lily, on their whimsical adventures through timeless Lake District. Peter encounters real dangers, and he and his loyal friends and family must use their wits to outsmart incompetent villains whose barks are way worse than their bites. Peter is a 6-year-old rabbit who lives with his mother underneath a huge fir tree in a hidden burrow. He misses his late father and desperately wants to grow up to be just like him. Armed with his father's journal, which is basically a guide to everything one needs to become a truly wild rabbit, and aided and abetted by his two best friends, Benjamin and Lily, Peter sets off to make his own mark in life.	4-8	12	Justin Trefgarne, Mark Huckerby, Nick Ostler	2012	2016	t	2	3	Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Nature,Adventure,Teamwork,"Problem Solving","Enviromental Awareness",Courage}	3D CGI animation	/media/tv-shows/show-180.jpg	\N	\N	\N	f	\N	f	f	f
175	Pajanimals	The Pajanimals (a group of friendly animal puppets) sing songs to help children get ready for bed in a series of segments aired on Nick Jr. UK.	2-5	11	Jeff Muncy	2008	2013	t	2	2	Moderate	Moderate	Low-Moderate	Low-Moderate	High	Low	Low-Moderate	\N	{TV}	{"Overcoming Fears","Bedtime Routines",Social-Emotional,Relaxation,"Family Relationships","Emotional Intelligence"}	Live-action puppetry with colorful characters.	/media/tv-shows/show-175.jpg	\N	\N	\N	f	\N	f	f	f
183	Pinkalicious & Peterrific	Pinkalicious imagines creative possibilities everywhere she looks. Aimed at kids 3-5, PINKALICIOUS &amp; PETERRIFIC encourages viewers to engage in the creative arts and self-expression, including music, dance, theater and visual arts. Get creative with Pinkalicious, Peter and all their friends in Pinkville!	3-6	26	Gary Baseman	2018	\N	t	6	4	High	High	High	High	High	High	High	\N	{TV}	{"Creativity & Imagination",Art,Music,"Problem Solving",Teamwork,"Motor Skills"}	2D digital animation with bright colors and exaggerated, stylized designs. Bright and vivid colors with high contrast.	/media/tv-shows/show-183.jpg	\N	\N	\N	f	\N	f	f	f
174	Out of the Box	On this disney channel tv show, two caretakers named Tony and Vivian encourage children to get "out of the box" and use their imaginations. In their cardboard clubhouse; (which was done on a set) the duo sing songs, play games, make crafts, and perform stories on a wooden play structure with a group of children. With the feeling of fun, creativity, and play, children at home watching the show are encouraged to use their imaginations and play like Tony and Vivan do in their "Box."	3-7	25	Douglas Love	1998	2004	t	3	3	High	Moderate-High	Moderate	Moderate	High	Low-Moderate	Moderate	\N	{TV}	{"Creativity & Imagination","Arts & Crafts",Music,"Motor Skills",Social-Emotional,Colours,Shapes,Art}	Live-action with real actors.	/media/tv-shows/show-174.jpeg	\N	\N	\N	f	\N	f	f	f
185	Pipi Mā	A children's TV show	2-6	15	\N	\N	\N	t	\N	3	High	Moderate-High	Medium	Moderate	Moderate	Moderate	Low-Moderate	\N	{YouTube}	{"Cultural Appreciation","Traditional Narratives","Cultural & Social","Te reo Māori language development","Sing Along",Literacy,Numeracy,"Māori immersion preschool","Cultures & Traditions"}	2D Animation with Cultural Themes and Soft Colors	/media/tv-shows/show-185.jpg	\N	\N	\N	f	\N	f	f	f
173	Oswald	A story of a blue octopus and his dog that looks like a hotdog, named Weenie, and their friends like Daisy the daisy, and Henry the penguin. They go on adventures in their town that usually involves a problem that needs to be solved.	3-6	24	Dan Yaccarino	2001	2003	t	1	2	High	Moderate	Low	Low-Moderate	Moderate	Low	Low-Moderate	\N	{TV}	{Friendship,"Problem Solving",Social-Emotional,"Social Development","Critical Thinking","Conflict Resolution","Emotional Intelligence","Relatable Situations","Family Relationships"}	2D digital animation	/media/tv-shows/show-173.jpg	\N	\N	\N	f	\N	f	f	f
105	Hey Bear Sensory	A children's TV show	0-3	15	\N	\N	\N	t	\N	5	Low	Low	Moderate-High	High	High	High	High	\N	{YouTube}	{"Sensory Exploration","Early Childhood experiences","Motor Skills",Colours,Music}	High-Contrast 3D Animation with Bright Colors and Simple Shapes	/media/tv-shows/show-105.jpg	\N	\N	\N	f	\N	f	f	f
206	Rosie's Rules	Rosie's Rules is an animated preschool comedy series that follows the adventures of Rosie Fuentes, an inquisitive and hilarious 5-year-old girl just starting to learn about the wow-mazing world beyond her family walls. And she is ...	4-8	26	Jennifer Hamburg	2022	2024	t	1	3	High	Moderate-High	Moderate	Moderate-High	High	Moderate	Low-Moderate	\N	{TV}	{Elementary-Basics,Social-Emotional,"Problem Solving","Family Relationships",Responsibility,Teamwork,"Social Development","Family Values","Emotional Intelligence"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds.	/media/tv-shows/show-206.jpg	\N	\N	\N	f	\N	f	f	f
190	Pokemon	I Am Speechless Because They Are Legendary series So few Word's not Describe You Can watch.	7-12	22	\N	2014	2017	t	25	5	Low	High	High	High	High	High	High	\N	{TV}	{"Enviromental Awareness","Overcoming Fears",Friendship,Teamwork,"Wildlife Exploration",Entertainment,Humor,Exploration,Perseverance,"Mild Fantasy Violence"}	traditional and Digital hand-drawn 2D animation. Anime style	/media/tv-shows/show-190.jpg	\N	\N	\N	f	\N	f	f	f
204	Rolie Polie Olie	The show focuses on the Polie Family, who live in a teapot-shaped house in a geometric world (Planet Polie) populated by robot-based characters. The stories revolve around a young robot named Olie learning life lessons and going on wacky adventures (either real or imaginative) while growing up. These often include his little sister Zowie, his inventor father, his hard-working mom, his fun-loving grandfather Pappy, and his dog Spot. Although most of the main cast is composed of circular bots, other characters are featured in other shapes, such as Olie's friend Billy Bevel and his family, who are square-shaped bots from Planet Cubey.	3-6	22	William Joyce	1998	2007	t	6	3	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate-High	High	\N	{TV}	{"Creativity & Imagination",Friendship,"Problem Solving",Adventure,Social-Emotional,"Critical Thinking"}	3D CGI Animation	/media/tv-shows/show-204.jpg	\N	\N	\N	f	\N	f	f	f
196	Rainbow Ruby	Rainbow Ruby comes to the rescue whenever a doll friend needs help! When Choco's heart starts to glow, she knows it's time for a magical journey into Rainbow Village. With the help of her enchanted suitcase, the "Rainbow Roller", Rainbow Ruby takes on helping roles with enthusiasm and confidence!	3-7	15	Roberto Santiago	2016	2020	t	\N	5	Low-Moderate	High	High	Moderate-High	High	High	High	\N	{YouTube}	{"Creativity & Imagination","Career Exploration",Curiosity,"Emotional Intelligence","Fantasy Elements","Problem Solving",Social-Emotional}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	/media/tv-shows/show-196.jpg	\N	\N	\N	f	\N	f	f	f
203	Robocar Poli	Cartoon showing toddlers important life lessons while teaching them that police, fire, and rescue are good people and just want to help others. Cars transform during the show to be useful and help others.	3-6	11	\N	2011	\N	t	4	5	Moderate	High	High	High	High	High	Moderate-High	\N	{TV}	{"Cultural & Social",Safety,Teamwork,"Problem Solving",Adventure,"Community Service","Social Development",Social-Emotional}	3D CGI Animation with detailed and dynamic visuals.	/media/tv-shows/show-203.jpg	\N	\N	\N	f	\N	f	f	f
198	RC Action Channel	A children's TV show	0-13+	15	\N	\N	\N	t	\N	2	Low	Low-Moderate	High	Moderate-High	Low-Moderate	High	Moderate	\N	{YouTube}	{Mechanics,"Engineering Concepts",Hobbies,"Vehicle Recognition",Entertainment,"Vehicle Themes",Machinery,Relaxation}	Live-action footage of RC vehicles in operation	/media/tv-shows/show-198.png	\N	\N	\N	f	\N	f	f	f
194	Puppy Dog Pals	Fun-loving pug puppies, brothers Bingo and Rolly, have thrill-seeking appetites that take them on exhilarating adventures in their neighborhood and around the globe. Whether helping their owner Bob or assisting a friend in need, the pugs' motto is that life is more exciting with your best friend by your side. Each episode features two 11-minute stories that showcase Bingo and Rolly's similarities and differences while demonstrating positive lessons about friendship, problem-solving, collaboration, creativity and adventure.	3-6	11	Harland Williams	2017	2023	t	5	4	Moderate	High	High	High	High	High	Low	\N	{TV}	{Adventure,Teamwork,"Problem Solving",Social-Emotional,"Creativity & Imagination"}	3D CGI animation with bright and vivid colors.	/media/tv-shows/show-194.jpeg	\N	\N	\N	f	\N	f	f	f
192	Postman Pat: Special Delivery Service	A children's TV show	3-6	15	\N	\N	\N	t	\N	4	Low	Moderate-High	Moderate-High	High	High	High	High	\N	{TV}	{"Community Service",Teamwork,Responsibility,Entertainment,"Problem Solving"}	3D CGI animation	/media/tv-shows/show-192.jpg	\N	\N	\N	f	\N	f	f	f
202	Rhyme Time Town	Two best friends find fun and adventure while living in Rhyme Time Town, a fantastical place filled with beloved nursery rhyme characters.	3-6	24	Dan Berlinka	2020	2021	t	2	3	High	Moderate-High	Moderate	Moderate-High	High	Moderate	Low-Moderate	\N	{TV}	{"Language Learning",Literacy,"Sing Along","Cognitive Development",Social-Emotional,"Repetitive Learning",Music}	3D CGI Animation with extremely bright and vivid colors.	/media/tv-shows/show-202.jpg	\N	\N	\N	f	\N	f	f	f
201	Reef School	Welcome to Reef School, where every day is an underwater adventure. Join the little Reefies and their teacher Mr. Flip as they discover the extraordinary wonders of an imaginary Australian coral reef.	3-6	7	\N	2022	\N	t	2	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	High	\N	{TV}	{"Enviromental Awareness",Ecosystems,"Marine Bioligy",Curiosity,"Social Development","Emotional Intelligence","Wildlife Conservation","Natural World",Teamwork}	2D Digital Animation with a watercolor aesthetic. Color Palette: Soft and natural colors with pastel hues.	/media/tv-shows/show-201.jpg	\N	\N	\N	f	\N	f	f	f
209	Ryan's World	Ryan's World is a children's YouTube channel featuring Ryan Kaji, who is nine years old as of June 2020, along with his mother, father, and twin sisters.	0-5	15	\N	2017	\N	t	\N	5	Moderate	High	High	Moderate-High	High	High	High	\N	{YouTube}	{Science,"Creativity & Imagination","Learn Through Play",STEM,Geography,Numeracy,"Unboxing Videos",Entertainment,Humor,"Silly Comedy","Family Relationships","Family Values",Teamwork,"Toy Review"}	Live-Action with Bright Colors, High Energy, and Occasional Animations	/media/tv-shows/show-209.jpeg	\N	\N	\N	f	\N	f	f	f
25	Between the Lions	Lions Theo and Cleo and their cubs Lionel and Leona have many adventures at their library. Usually surrounding the many books within. Whether a daring story about Cliff Hanger, a vocabulary lesson from Chicken Jane, a song from the Monkey Pop-Up Theater and the Vowelles, as well as the lion family in a few zany skits of their own, such as Theo and Cleo as French chefs or Theo and Cleo as pop singers. There's no telling what can happen when you read...Between the Lions!	4-8	30	Kathryn Mullen	1999	2011	f	11	3	High	High	Medium	Moderate	High	Moderate	Moderate-High	\N	{TV}	{Phonics,Literacy,Music,"Reading Comprehension","Language Learning",Humor}	Combination of live-action puppetry, 2D animation, and CGI effects. Bright but balanced colors, with emphasis on text and literacy elements.	https://m.media-amazon.com/images/M/MV5BYWYxZjQ3N2UtZDM5MS00YmYwLTg1MTctM2NiOTU0YWVjYTVhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
223	Spirit Riding Free	The wild west adventures of a free-spirited girl and her wild stallion horse companion.	6-10	30	Aury Wallington	2017	2020	f	8	3	Low-Moderate	Moderate-High	Medium	Moderate	Moderate	Moderate	High	\N	{TV}	{Horses,Adventure,Responsibility,Perseverance,"Mild Intense Scenes",Friendship}	3D CGI Animation	https://m.media-amazon.com/images/M/MV5BNjliNDYxOWUtNTEwMi00ODYxLTkzZmQtZTI3ZTQ3MzFjNmQ5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
215	Shaun the Sheep	Shaun is a sheep who doesn't follow the flock - in fact, he leads them into all sorts of scrapes and scraps, turning peace in the valley into mayhem in the meadow. Shaun and his pals run rings around their poor sheepdog Bitzer, as he tries to stop the Farmer finding out what's going on behind his back. Every day brings a new adventure for Shaun.	6-10	7	David Fine	2007	2020	t	6	3	Low	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Creativity & Imagination","Problem Solving",Teamwork}	Traditional Stop-Motion (claymation) digital enhancements may be used for post-production	/media/tv-shows/show-215.jpg	\N	\N	\N	f	\N	f	f	f
221	Spanish with liz	A children's TV show	0-5	15	\N	\N	\N	t	\N	3	High	High	Medium	Moderate	High	Moderate	Low-Moderate	\N	{YouTube}	{"Learning through Songs",Phonics,"Cultural & Social",Vocabulary,Music,"Emotional Intelligence",Routine,"Spanish Language","Healthy Eating","Language Learning","Cultures & Traditions"}	Live-Action with Educational Props and Colorful Backgrounds	/media/tv-shows/show-221.png	\N	\N	\N	f	\N	f	f	f
218	Simon	This animated series follows Simon who is an adorable little rabbit who exudes all the vitality of childhood.	3-6	5	Stephanie Blake	2016	\N	t	8	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate-High	\N	{TV}	{"Relatable Situations","Problem Solving",Social-Emotional,"Family Relationships","Emotional Intelligence",Friendship}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds.	/media/tv-shows/show-218.jpeg	\N	\N	\N	f	\N	f	f	f
219	Something Special: Hello Mr Tumble	A children's TV show	2-6	30	\N	2010	\N	t	1	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Learning Disabilities","Early Childhood experiences","Makaton Sign Language",Social-Emotional,"Emotional Intelligence","Language Learning"}	Live-Action with Bright Colors and Simple Settings	/media/tv-shows/show-image-1748363853387-728180121-optimized.jpg	\N	\N	\N	f	\N	t	f	f
217	Silly Miss Lily (Paisley's Corner)	A children's TV show	2-5	15	\N	\N	\N	t	\N	3	High	Moderate-High	Medium	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{Shapes,"Sing Along",Colours,"Positive Engaging Screen-Time",Literacy,Preschool-Basics,Social-Emotional,Numeracy}	Live-Action with Bright Colors and Props	/media/tv-shows/show-217.png	\N	\N	\N	f	\N	f	f	f
212	Scooby-Doo, Where Are You! (1969–1970)	A children's TV show	7-12	22	\N	\N	\N	t	3	4	Low	Moderate	Moderate-High	Moderate-High	High	Moderate-High	Low	\N	{TV}	{"Problem Solving",Teamwork,Mystery,Entertainment,Humor,"Critical Thinking","Mild Peril","Mild Fantasy Violence"}	traditional hand-drawn 2D animation	/media/tv-shows/show-212.jpg	\N	\N	\N	f	\N	f	f	f
208	Rugrats (2021 Reboot)	A children's TV show	4-8	23	\N	\N	\N	t	\N	4	Low-Moderate	High	High	Moderate-High	Moderate-High	Moderate-High	Moderate	\N	{TV}	{"Creativity & Imagination","Social Development",Social-Emotional,"Relatable Situations","Emotional Intelligence","Problem Solving","Mischievious Behaviour"}	3D CGI animation	/media/tv-shows/show-208.jpg	\N	\N	\N	f	\N	f	f	f
232	Super Monsters	Preschool kids whose parents are the world's most famous monsters try to master their special powers while preparing for kindergarten.	3-6	30	Avi Arad	2017	\N	t	3	4	Moderate	Moderate-High	Medium	Moderate	Moderate-High	Moderate	High	\N	{TV}	{"Self Discipline","Cultural & Social",Entertainment,"Problem Solving","Social Development",Social-Emotional,"Emotional Intelligence",Friendship,"Creativity & Imagination"}	3D CGI animation with bright and vivid colors	https://m.media-amazon.com/images/M/MV5BMTYyODgxYzktNDZkNC00YThkLWJjNzgtMjFhZTlmMjZlNTI1XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
231	Storybots	Based on the award-winning educational apps, the StoryBots are curious little creatures who live in the world beneath our screens and go on fun adventures to help answer kids' questions.	3-6	30	Evan Spiridellis	2016	2019	f	3	4	High	High	High	High	High	High	Low	\N	{TV}	{Curiosity,"Problem Solving","Social Development",Literacy,"Critical Thinking","Reading Comprehension",STEM}	Combination of 2D and 3D Animation with Mixed Media	https://m.media-amazon.com/images/M/MV5BYTBlYjhhYWYtMjcwMi00YTZiLThlNmMtOWJjNjVlY2JjMjQwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
237	Superworm	A children's TV show	3-6	25	\N	\N	\N	t	\N	3	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	High	\N	{TV}	{Friendship,Teamwork,Nature,"Social Development"}	3D CGI animation with detailed textures and natural settings. Earthy tones with vivid highlights.	/media/tv-shows/show-237.jpg	\N	\N	\N	f	\N	f	f	f
236	Superkitties	A children's TV show	3-6	15	\N	\N	\N	t	2	5	Low-Moderate	High	High	High	High	High	High	\N	{TV}	{Adventure,Teamwork,Responsibility,Entertainment,"Problem Solving","Super Hero Themes",Friendship}	3D CGI Animation	/media/tv-shows/show-236.jpg	\N	\N	\N	f	\N	f	f	f
242	Teen Titans Go!	A children's TV show	8-12	11	Michael Jelenic	2013	2025	t	9	5	Low	High	High	Moderate-High	High	High	High	\N	{TV}	{Adventure,"Surreal Imagery",Teamwork,Entertainment,"Super Hero Themes","Mild Mature Themes",Friendship,Humor}	2D digital animation with bright colors and exaggerated, stylized designs. Bright and vivid colors with high contrast.	/media/tv-shows/show-242.jpeg	\N	\N	\N	f	\N	f	f	f
166	Noodle and Bun	Follow Noodle, Bean and Bun in theirevery day adventures - getting upto mischief, making new friendsand helping out those inneed along the way.	3-8	15	Gottfried Roodt	2020	\N	t	\N	5	Low	Moderate	Moderate-High	Moderate	High	Moderate-High	Moderate	\N	{YouTube}	{"Story Telling without Dialogue","Creativity & Imagination",Humor,"Silly Comedy","Captivating Visuals",Friendship,Animals}	3D CGI Animation with Detailed and Dynamic Visuals	/media/tv-shows/show-166.jpg	\N	\N	\N	f	\N	f	f	f
230	Story Time Book: Read-Along	Kids can read along with illustrated books that come to life through animation, music and narration. Exciting adventures, fuzzy animal friends and more.	3-7	30	\N	2022	\N	t	1	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Low	\N	{TV}	{"Repetitive Learning",Literacy,"Reading Comprehension","Language Learning","Creativity & Imagination","Cognitive Development"}	Illustrations or Minimal Animation	/media/tv-shows/show-image-1748357214154-714836840-optimized.jpg	\N	\N	\N	f	\N	t	f	f
227	Steve & Maggie	A children's TV show	2-6	15	\N	\N	\N	t	\N	3	High	High	High	Moderate	High	High	Moderate	\N	{YouTube}	{Phonics,"Repetitive Learning",Vocabulary,"Social Development",Literacy,Preschool-Basics,Social-Emotional,"Language Learning","Creativity & Imagination","Cognitive Development","Every Day Concepts"}	Live-Action with Puppet Interaction and Simple Animations	/media/tv-shows/show-227.jpg	\N	\N	\N	f	\N	f	f	f
226	Stella and Sam	Sweet little cartoon about big sister Stella and her little brother Sam set in an adorable world of imagination . The cute duo set off on all sorts of imaginative adventures in their own backyard whilst caring for each other and meeting friends along the way. My 3 &amp; 5 year old love it, and it's one of the rare toddler audience cartoons I don't mind having to watch, even multiple times. I highly recommend this one.	3-6	22	\N	2011	\N	t	2	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	High	\N	{TV}	{Curiosity,"Problem Solving","Social Development","Natural World",Social-Emotional,Exploration,"Family Relationships","Emotional Intelligence","Creativity & Imagination"}	2D Digital Animation with a watercolor aesthetic. Color Palette: Soft and natural colors with pastel hues.	/media/tv-shows/show-226.jpg	\N	\N	\N	f	\N	f	f	f
238	Takaro Tribe	A children's TV show	3-6	5	\N	\N	\N	t	3	2	High	Moderate	Low-Moderate	Moderate	High	Low-Moderate	Moderate	\N	{TV}	{"Cultures & Traditions","Cultural & Social","Cultural Appreciation",Religion,Literacy,History,Music,Routine,"Repetitive Learning",Social-Emotional,"Language Learning"}	2D Digital Animation with simple, flat designs. Bright but pastel-like colors with minimal shading.	/media/tv-shows/show-238.jpg	\N	\N	\N	f	\N	f	f	f
228	Stick man	A children's TV show	3-7	27	\N	\N	\N	t	3	3	Moderate	Moderate	Medium	Moderate	High	Moderate	Low-Moderate	\N	{TV}	{"Family Values",Perseverance,Social-Emotional,"Family Relationships","Mild Peril",Courage}	3D CGI animation delivered slowly and smoothly	/media/tv-shows/show-228.jpg	\N	\N	\N	f	\N	f	f	f
250	The Backyardigans	Follows five high-spirited young friends - Uniqua, Pablo, Tyrone, Tasha and Austin - who rely on their vivid imaginations to embark on amazing, epic adventures. In every episode, the backyard transforms into a new fantastic, photo-real landscape that serves as the backdrop for completely original, story-driven musicals. Broadway-caliber music spanning a variety of genres and cutting-edge 3D dance choreography propel the stories forward.	3-6	30	Janice Burgess	2004	2013	f	4	4	High	Moderate-High	Moderate-High	Moderate-High	High	Moderate-High	High	\N	{TV}	{Teamwork,"Problem Solving","Communiction & Expression",Music,Social-Emotional,"Creativity & Imagination"}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	https://m.media-amazon.com/images/M/MV5BNWM4ZGZiMmYtODQzYy00YjM4LTkyYmYtMDQ1OWZmMmNkMWQzXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
247	The Adventures of Paddington Bear Original Series (1997–2000)	A children's TV show	4-8	23	\N	\N	\N	t	3	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate	\N	{TV}	{"Cultural Appreciation","Problem Solving",Social-Emotional,"Emotional Intelligence",Friendship}	Traditional 2D hand-drawn animation with a unique style combining stop-motion elements.	/media/tv-shows/show-247.jpg	\N	\N	\N	f	\N	f	f	f
256	The Cat in the Hat	The Cat in The Hat knows a lot about virtually every thing. With the help of fish, thing 1, and thing 2; the Cat in the Hat teaches kids about many things through song and games.	3-7	30	\N	2010	2018	f	3	3	High	High	Moderate-High	High	High	Moderate-High	Moderate	\N	{TV}	{Geography,Nature,Science,Curiosity,"Problem Solving","Critical Thinking",Exploration,Ecosystems,STEM}	2D Digital Animation with a video game aesthetic. Color Palette: Bright, vivid colors with high saturation	https://m.media-amazon.com/images/M/MV5BMzk0MTYxOTMtMjMzNi00NDk0LWFmMzUtY2NlMDZkZjAyNjJmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
255	The Care Bears	The Care Bears live in a faraway place up in the clouds called Care-a-Lot. They travel around the world on Missions in Caring, whilst evil villains such as Lord No Heart, try to thwart their plans.	4-8	30	\N	1986	1988	f	3	2	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Learning from Mistakes","Social Development",Social-Emotional,"Emotional Intelligence",Friendship}	Traditional 2D animation with soft character designs. Color Palette: Pastel colors and gentle hues.	https://m.media-amazon.com/images/M/MV5BN2M3ZWU1YWEtZTQxYy00YTFhLWIzZmMtZDBjMWNiZjNhNDZiXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
249	The adventures of the gummi bears	A children's TV show	6-10	22	\N	\N	\N	t	6	4	Moderate	High	High	Moderate-High	High	High	Moderate	\N	{TV}	{Adventure,Perseverance,"Mild Violent themes","Fantasy Elements","Problem Solving","Overcoming Fears",Friendship,Courage}	Traditional 2D Anime-style Animation.	/media/tv-shows/show-249.jpg	\N	\N	\N	f	\N	f	f	f
253	The Big Comfy Couch	Loonette the clown and her dolly Molly solve everyday problems while residing in the comfort of a large couch.	2-6	30	Cheryl Wagner	1992	2013	f	7	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{Exercise,"Motor Skills","Problem Solving","Overcoming Fears",Literacy,Preschool-Basics,Social-Emotional,Numeracy}	Live-action costumed puppetry with detailed sets. 	https://m.media-amazon.com/images/M/MV5BNzFmNDM3YTQtNWZmOS00YWU1LWJiNDktMWM5MDQzYzIzMmFhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
258	The Crocodile Hunter	A children's TV show	8+	48	\N	\N	\N	t	8	3	High	High	Low	Moderate	Moderate	Low	Low-Moderate	\N	{TV}	{Animals,Nature,"Intense Animal Interaction","Positive Role Models",Curiosity,"Overcoming Fears","Natural World","Enviromental Awareness","Wildlife Exploration","Wildlife Conservation",Ecosystems,"Animal Behaviour"}	Live-action documentary featuring wildlife. Color Palette: Natural colors showcasing diverse environments.	/media/tv-shows/show-258.jpg	\N	\N	\N	f	\N	f	f	f
259	The Enchanted World of Brambly Hedge	A snobbish fox and a wily mouse find their positions reversed as part of a bet by two callous badgers.	4-8	25	\N	1996	2000	t	1	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate-High	Low-Moderate	Moderate	\N	{TV}	{Nature,Teamwork,Curiosity,"Problem Solving","Natural World",Social-Emotional,Mindfulness}	Stop-motion animation with hand-crafted models.	/media/tv-shows/show-259.jpg	\N	\N	\N	f	\N	f	f	f
244	Teletubbies (1997-2001)	A children's TV show	1-4	24	\N	\N	\N	t	2	2	Low	Low	Low	Low	Low-Moderate	Low	Low	\N	{TV}	{"Creativity & Imagination",Social-Emotional,"Repetitive Learning","Sensory Exploration",Routine,"Bedtime Routines"}	Live action costumed. some digital elements 	/media/tv-shows/show-244.jpg	\N	\N	\N	f	\N	f	f	f
263	The Land of Boggs	The Land of Boggs is all about Life On YouTube Get ready for Suspense Action Comedy and Fantasy	12+	30	\N	2021	\N	t	\N	5	Low	High	High	Moderate-High	Moderate	High	High	\N	{YouTube}	{"Slice of Life","Surreal Imagery","Mature Themes","Skit Comedy","Life Lessons","Cultural & Social","Relatable Situations","Learning from Mistakes",Entertainment,"Light Hearted","Silly Comedy","Complex Emotional Themes",Social-Emotional,"Creativity & Imagination",Humor}	2D animation with simple, colorful designs and expressive characters.	/media/tv-shows/show-image-1748353729096-672601231-optimized.jpg	\N	\N	\N	f	\N	t	f	f
269	The New Adventures of Winnie the Pooh	Follow Winnie the Pooh's adventures in the Hundred Acre Wood.	3-7	30	\N	1988	1991	f	4	2	Moderate	Low-Moderate	Low	Low	Moderate	Low	Low	\N	{TV}	{"Relatable Situations","Problem Solving","Social Development","Emotional Intelligence",Friendship,"Creativity & Imagination"}	Traditional Hand-Drawn 2D animation	https://m.media-amazon.com/images/M/MV5BMGQwMTU4MWQtNzgxNC00ZWNjLTg2MGItNDFjYzNmMTYwZGQ0XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
266	The Magic School Bus Rides Again	Ms. Frizzle and her class along with an inventive high-tech bus that invites children on high-flying hijinks that introduce the incredible world of science.	6-10	30	\N	2017	2021	f	4	4	High	High	Moderate-High	Moderate	Moderate	Moderate-High	High	\N	{TV}	{Nature,Science,Curiosity,Discovery,"Critical Thinking","Enviromental Awareness",Exploration,STEM}	Traditional hand-drawn 2D animation	https://m.media-amazon.com/images/M/MV5BMTY0MjA5Mjc4Ml5BMl5BanBnXkFtZTgwNDE2NDMzNTM@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
262	The Land Before Time 	The further adventures of Littlefoot and his friends learning about the world of dinosaurs.	4-8	30	\N	2007	2008	f	2	4	Low	Moderate-High	Moderate-High	High	High	High	High	\N	{TV}	{Adventure,Dinosaurs,Perseverance,Entertainment,"Mild Intense Scenes","Problem Solving","Mild Peril",Friendship}	3D CGI Animation	https://m.media-amazon.com/images/M/MV5BYzY5MDJmNjUtNjYwNy00YjllLWE0ZGUtYjk2OTgxZmY3ZGE0XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
273	The Stinky & Dirty Show 	The adventures of best friends and unlikely heroes, Stinky the garbage truck and Dirty the backhoe loader, a dynamic and hilarious duo of resourcefulness that learn that when things don't as expected, asking "what if" can lead to success. Based on the books by Jim and Kate McMullan. Written and developed by Guy Toubes.	3-6	30	\N	2015	2019	f	2	3	Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate-High	Moderate-High	\N	{TV}	{"Engineering Concepts",Teamwork,Perseverance,"Problem Solving","Critical Thinking","Creativity & Imagination"}	3D CGI animation	https://m.media-amazon.com/images/M/MV5BNjMxODI5MjAwN15BMl5BanBnXkFtZTgwNTY2NTI2OTE@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
270	The Octonauts	A team of adventure heroes who dive into action whenever there is trouble under the sea! In a fleet of aquatic vehicles, they rescue amazing sea creatures, explore incredible new underwater worlds, and often save the day before returning safely to their home base, the Octopod. Buoyed by the companionship of three leading characters - Captain Barnacles Bear, Lieutenant Kwazii Cat, and Doctor Peso Penguin - the Octonauts are always ready to embark on an exciting new mission.	4-8	11	\N	2010	2021	t	4	5	Moderate-High	High	High	Moderate	Moderate-High	High	High	\N	{TV}	{Teamwork,Curiosity,"Problem Solving","Natural World","Enviromental Awareness","Marine Bioligy",Ecosystems}	3D CGI animation set in an underwater world. Extremely bright and vivid colors with high saturation.	/media/tv-shows/show-270.jpg	\N	\N	\N	f	\N	f	f	f
40	Caitie's Classroom (SuperSimplePlay)	Caitie's Classroom is an educational and fun kids show that both children and parents love. Join Caitie in the classroom where we sing, dance, learn, explore, play, and create together. Each episode explores a theme with activitie...	1-5	30	\N	2020	\N	t	\N	3	High	High	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{Elementary-Basics,"Early Childhood experiences","Cultural & Social","Motor Skills","Social Development","Sing Along",Literacy,Music,Dance,Preschool-Basics,Social-Emotional,Numeracy,"Emotional Intelligence",STEM}	Live-Action with Puppetry and Props	/media/tv-shows/show-image-1748357689154-216615042-optimized.jpg	\N	\N	\N	f	\N	t	f	f
261	The fixies	A children's TV show	4-8	6	\N	2011	\N	t	5	4	High	High	High	Moderate-High	Moderate-High	High	High	\N	{TV}	{STEM,"Problem Solving",Curiosity,Teamwork,Science,"Motor Skills","Critical Thinking",Technology,"Engineering Concepts"}	3D CGI Animation with detailed and dynamic visuals.	/media/tv-shows/show-261.jpeg	\N	\N	\N	f	\N	f	f	f
243	Teletubbies (2015-2018)	A children's TV show	1-4	12	\N	\N	\N	t	\N	3	Low	Low	Low-Moderate	Low	Moderate	Low	High	\N	{TV}	{"Creativity & Imagination",Social-Emotional,"Repetitive Learning","Sensory Exploration",Routine,"Bedtime Routines"}	Live action costumed. some digital elements 	/media/tv-shows/show-243.jpg	\N	\N	\N	f	\N	f	f	f
207	Rugrats	Rugrats is a show about 4 babies, Tommy Pickles, Chuckie Finster, and Phil and Lil Deville. As we see their lives unravel, we get to hear them talk. On the sidelines are Tommy's mean cousin Angelica, their friend Susie Carmichael (same age as Angelica), and everybody's parents.	4-8	22	Gabor Csupo	1991	2003	t	9	3	Low-Moderate	Moderate-High	Moderate	Moderate	Moderate	Moderate	Moderate-High	\N	{TV}	{"Creativity & Imagination","Social Development",Social-Emotional,"Relatable Situations","Emotional Intelligence","Problem Solving","Mischievious Behaviour"}	Traditional 2D hand-drawn animation with a distinctive, sketchy style. Muted and earthy tones, reflecting a somewhat realistic environment.	/media/tv-shows/show-207.jpg	\N	\N	\N	f	\N	f	f	f
153	Moominvalley	Moomin is a new adaptation of Tove Jansson's loved body of work. The protagonist of the series is Moomintroll, who is curious, kind, sensitive and idealistic. He is a typical hero in a coming-of-age story: he tries to tackle the puzzle of growing up to his true, individualistic self while remaining a beloved part of the family.	6-10	22	Tove Jansson	2019	\N	t	3	2	Moderate	Moderate	Moderate	Low-Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Creativity & Imagination",Social-Emotional,Friendship,"Fantasy Elements","Emotional Intelligence",Relaxation}	3D CGI Animation with a soft aesthetic. Color Palette: Pastel colors and gentle hues.	/media/tv-shows/show-153.jpeg	\N	\N	\N	f	\N	f	f	f
151	Mister Rogers' Neighbourhood	A children's TV show	3-7	28	\N	\N	\N	t	31	1	High	Moderate	Low	Low-Moderate	Moderate	Low	Low	\N	{TV}	{"Cultural & Social",Elementary-Basics,"Life Lessons",Social-Emotional,"Social Development",Literacy,"Emotional Intelligence","Relatable Situations",Relaxation,"Community Service","Problem Solving","Critical Thinking","Family Values","Sing Along",Morality,Friendship,"Creativity & Imagination"}	Live-Action with puppet segments. Color Palette: Soft, natural colors.	/media/tv-shows/show-151.jpg	\N	\N	\N	f	\N	f	f	f
241	Team Umizoomi	Team Umizoomi is an American 2010 Nick Jr. and Nickelodeon TV show, involving preschool math concepts. Milli, Geo, Bot, and the child who is watching the show uses their 'Mighty Math Powers!' to help in everyday problems. Team Umizoomi looks for problems in Umicity in Bot's Belly, Belly, Belly Screen! They live in Umicity. The show first aired in January 25, 2010. Milli is a measurement expert and has pattern powers. Geo uses shapes to build stuff that Team Umizoomi may need. Bot uses his Belly, Belly, Belly Screen to video call people who need help. This show is appropriate for young children and it teaches math. Team Umizoomi calls the viewer Umifriend and encourages the Umifriend to help them as they develop his/her Mighty Math Powers, just like Team Umizoomi.	3-6	30	Soo Kim	2010	2025	f	5	5	High	High	High	High	High	High	High	\N	{TV}	{Teamwork,Shapes,Math,"Problem Solving","Critical Thinking",Numeracy,STEM}	3D CGI animation with bright and vivid colors	https://m.media-amazon.com/images/M/MV5BYzA5MWM5ODctODk4My00MDY0LThlYWMtYTI1MGI5MmI3MzBlXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
136	Maddie's Do You Know?	A children's TV show	4-8	14	\N	\N	\N	t	5	3	High	High	Moderate	Moderate	Moderate	Moderate	High	\N	{TV}	{STEM,"Creativity & Imagination",Curiosity,Science,Technology,Exploration,"Engineering Concepts","Critical Thinking","Problem Solving"}	Live-action educational series with some animation and CGI. Color Palette: Natural colors with bright visuals during explanations.	/media/tv-shows/show-136.jpeg	\N	\N	\N	f	\N	f	f	f
275	Theodore Tugboat	The adventures of a young tugboat and his friends in the Big Harbour, with the Dispatcher and the Harbourmaster keeping ever-watchful eyes.	3-6	30	Andrew Cochran	1993	2000	f	5	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	High	\N	{TV}	{Adventure,Teamwork,Responsibility,"Problem Solving","Enviromental Awareness",Social-Emotional,Friendship}	Combination of live-action, puppetry, and CGI elements. Color Palette: Bright and vivid colors with high contrast	https://m.media-amazon.com/images/M/MV5BMTI4MTEzMzU2MF5BMl5BanBnXkFtZTcwNTAzMjMyMQ@@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
277	Thomas & Friends: All Engines Go		2-5	30	\N	2021	\N	t	\N	5	Low	High	High	High	High	High	Low	\N	{TV}	{Teamwork,Responsibility,"Problem Solving",Friendship}	3D CGI animation	https://m.media-amazon.com/images/M/MV5BMTc3NDM4ZjEtNGU1MS00NTc4LTg1MGEtM2IzODdmZDExMTkxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
31	Bluey	Bluey follows the adventures of a lovable and inexhaustible six-year-old Blue Heeler puppy who lives with her dad, mum and four-year-old little sister, Bingo. In every episode, Bluey uses her limitless Blue Heeler energy to play elaborate games that unfold in unpredictable and hilarious ways.	3-8	30	\N	2018	\N	t	4	3	Moderate	Moderate	Medium	Moderate	High	Moderate	Moderate	\N	{TV}	{"Family Values","Family Relationships","Emotional Intelligence","Creativity & Imagination","Conflict Resolution"}	Digital 2D animation	https://m.media-amazon.com/images/M/MV5BYWU1YmQzMjEtMDNjOS00MGIyLWExY2ItZDAzNmU5NWViMGZmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
171	Omar and hana	A children's TV show	3-7	5	\N	\N	\N	t	5	4	Moderate	High	Medium	Moderate	High	Moderate	Moderate	\N	{TV}	{"Family Values","Cultural & Social",Morality,"Relatable Situations","Family Relationships","Emotional Intelligence",Religion,"Sing Along","Cultures & Traditions","Mild Peril"}	2D Digital Animation with bright colors. Color Palette: Vibrant but not overwhelming.	/media/tv-shows/show-171.jpg	\N	\N	\N	f	\N	f	f	f
285	Tumble leaf	Tumble Leaf is a series aimed at preschoolers, set in a whimsical land where a small blue fox named Fig plays each day and discovers adventure, friendship and love around every bend in the path. Children will be enriched by these narratives that promote play, the fun of learning and understanding the world around them.	3-6	30	Drew Hodges	2013	2019	f	4	2	High	Low	Low-Moderate	Moderate	Moderate-High	Moderate	High	\N	{YouTube}	{Nature,"Motor Skills","Critical Thinking","Natural World",Exploration,"Creativity & Imagination","Cognitive Development"}	Digital 3D Stop-Motion	https://m.media-amazon.com/images/M/MV5BNzMwODVmMDgtMWJmNC00ZGU4LTgxNGYtYThkYTM1YjZjZmE1XkEyXkFqcGc@._V1_SX300.jpg	19300	69		t	2023-04-17T22:17:16.425305Z	t	t	t
283	Tractor Ted	Encourages children to listen, read, count and sing and gain great knowledge while enjoying every minute	2-5	30	\N	2020	\N	t	3	2	High	Low-Moderate	Low	Low-Moderate	Moderate	Low	Low-Moderate	\N	{YouTube}	{Animals,Nature,"Farm Life",Machinery,Agriculture,"Animal Behaviour"}	Live-Action and 2D Animation	/media/tv-shows/show-283.jpg	249000	260		t	2010-09-07T19:25:27Z	t	t	f
281	Topsy and Tim	Follow the activities of two children.	3-6	30	\N	2013	\N	t	3	2	Moderate	Moderate	Low	Low-Moderate	Moderate	Low	High	\N	{YouTube}	{"Relatable Situations","Problem Solving",Social-Emotional,"Family Relationships","Emotional Intelligence"}	Live-action with real actors.	https://m.media-amazon.com/images/M/MV5BOWNkNmUyYjktZmIyZi00MmNmLTljNTktMGUxNThkM2Y2MTg2XkEyXkFqcGc@._V1_SX300.jpg	119000	41		t	2017-10-27T08:47:49Z	t	t	f
282	Tots TV	Three rag doll puppets live together in a countryside cottage: Tilly, a French girl, with red hair, who speaks in basic French; Tom, a blue haired boy with glasses; and Tiny, the green-haired youngest Tot.	2-5	30	Anne Wood	1993	\N	t	5	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{YouTube}	{Curiosity,"Problem Solving",Literacy,Social-Emotional,"Language Learning","Cultures & Traditions","Creativity & Imagination"}	Live-Action with puppet segments. Color Palette: Soft, natural colors.	https://m.media-amazon.com/images/M/MV5BY2YyMGZkYzUtZGVjMS00ZjhmLTkwYTgtYzg3MWY0NWNkZGEyXkEyXkFqcGc@._V1_SX300.jpg	239000	39		t	2014-02-06T11:13:54Z	t	t	f
297	Work It Out Wombats	Work It Out Wombats! is a PBS KIDS animated series following a playful trio of marsupial siblings— Malik, Zadie, and Zeke— who live with their grandmother in a fantastical treehouse apartment complex. The Treeborhood is home to a diverse and quirky community of neighbors, who just happen to be wombats, snakes, moose, kangaroos, iguanas, fish, tarsiers, and eagles! Our educational framework introduces preschoolers to "computational thinking," which enables them to solve problems, express themselves, and accomplish tasks using the practices, processes, and ideas at the core of computer science, laying important groundwork for success in school and life. Where there's a will, there's always a way!	4-7	30	Kathy Waugh	2022	\N	t	1	3	High	Moderate-High	Medium	Moderate	Moderate-High	Moderate	Low-Moderate	\N	{YouTube}	{Teamwork,"Life Lessons","Relatable Situations","Problem Solving","Critical Thinking",Social-Emotional}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	https://m.media-amazon.com/images/M/MV5BODA3ZjRmMjctMTE2YS00Y2EzLWEyYTktYWE4ZTU0ODFiZTM2XkEyXkFqcGc@._V1_SX300.jpg	3440	52		t	2022-01-06T22:01:20.418587Z	t	t	f
296	Woolly and Tig	Woolly And Tig is a series of 5 minute episodes for pre-school children made by the BBC. Tig is a young girl who, with the help of her toy spider Woolly, learns how to cope with the problems faced by pre-school children everyday ranging from a visit to the dentist, sharing toys and facing the first day of school.	2-5	30	Brian Jameson	2012	\N	t	2	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{YouTube}	{"Relatable Situations","Overcoming Fears",Social-Emotional,"Emotional Intelligence",Courage}	Combination of live-action and CGI animation.	/media/tv-shows/show-image-1748363332028-669253900-optimized.jpg	3710000	1259		t	2014-05-12T13:25:50Z	t	t	f
284	Trash truck	Six-year old Hank and his best pal, a giant trash truck, explore the world around them on fantastical adventures with their animal friends.	3-6	30	Max Keane	2020	2021	f	2	4	Low	Moderate-High	High	Moderate	Moderate-High	Moderate-High	Moderate	\N	{TV}	{"Problem Solving","Emotional Intelligence","Creativity & Imagination"}	3D CGI animation	https://m.media-amazon.com/images/M/MV5BM2U3ZTM3ZDYtMGQyMi00ZTkxLTg1NDQtMGUxZmZjNTUyODUwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
290	Vlad and Nikki	A children's TV show	3-8	15	\N	\N	\N	t	\N	5	Low	High	High	High	High	High	High	\N	{YouTube}	{"Learn Through Play",Adventure,Hyper-Activity,Entertainment,"Problem Solving","Multi-Lingual Learning","Family Relationships","Creativity & Imagination",Humor}	Live-action videos featuring Vlad and Niki, often enhanced with special effects and animations to create engaging and fantastical elements.	/media/tv-shows/show-290.jpg	\N	\N	\N	f	\N	f	f	f
1	A for Adley	mini professional fun haver :) i make my videos and dad does my emails -- Adley@Spacestation.com	3-8	15	A for Adley - Learning & Fun	2017	\N	t	\N	4	Moderate	Moderate-High	Moderate-High	Moderate	Moderate	Moderate	Moderate-High	\N	{YouTube}	{"Family Values","Relatable Situations","Problem Solving",Preschool-Basics,"Family Relationships","Creativity & Imagination","Conflict Resolution"}	Live-Action Family Videos	/media/tv-shows/show-1.png	7900000	734	UCBJuxfqZuiibvcwSc8ViGsQ	t	2017-10-04T21:19:39Z	f	t	f
291	Vooks	Vooks is a digital library of children’s storybooks brought to life with subtle animation, read-aloud narration, engaging music and sound, and read-along highlighted text. We’re educational, safe screen time that inspires a love of reading in kids around the globe.	2-8	30	Vooks	2018	\N	t	\N	2	High	Moderate	Low-Moderate	Moderate	Moderate-High	Moderate-High	Low-Moderate	\N	{YouTube}	{Phonics,"Speech Development",Read-Along,Vocabulary,Literacy,Music,"Reading Comprehension","Language Learning","Creativity & Imagination","Cognitive Development"}	Animated adaptations of children's books, featuring subtle animations that complement the original illustrations, accompanied by professional narration and sound effects.	/media/tv-shows/show-291.jpg	891000	377		t	2018-07-24T22:11:52Z	t	t	f
298	Xavier Riddle and the Secret Museum	This exciting new series teaches kids that everyone can do remarkable things. Follow the adventures of three children as they enter a "secret museum" and travel back in time to meet real life heroes from the past, when the heroes were kids. In each episode, Xavier, Yadina, and Brad learn about the challenges these inspirational figures faced and the path they took to achieve greatness, showing the kids that they, too, can be heroes. This all-new, animated, adventure-comedy series is now available for corporate sponsorship.	5-8	26	Chris Eliopoulos	2019	\N	t	2	3	High	Moderate-High	Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Cultures & Traditions","Life Lessons",History,Morality,"Problem Solving",Curiosity,Courage,Adventure}	2D Digital Animation with a watercolor aesthetic. Color Palette: Soft and natural colors with pastel hues.	/media/tv-shows/show-298.jpg	\N	\N	\N	f	\N	f	f	f
295	Wishenpoof	Bianca is just like any girl... well, kind of. She has one teeny ability, "wish magic" - the power to make wishes come true.	3-6	30	Angela Santomero	2014	2019	f	2	3	High	High	Medium	Moderate	Moderate-High	Moderate	High	\N	{TV}	{Morality,"Problem Solving","Social Development",Social-Emotional,"Emotional Intelligence","Creativity & Imagination"}	3D CGI Animation with stylized and colorful designs. Bright but not overly saturated colors, with a focus on vibrant settings.	https://m.media-amazon.com/images/M/MV5BY2FjMmQyYWUtNTBiOC00ODJmLWFkZGYtMDgxZjRkMTgyNDE3XkEyXkFqcGdeQXVyNjI4OTg2Njg@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
9	Andy's Dinosaur Adventures	Whilst working in a museum Andy finds a portal to the age of the dinosaurs.	4-8	30	Andy's Adventures	2014	\N	t	1	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{YouTube}	{Paleontology,Adventure,Dinosaurs,Science,Curiosity,"Natural History"}	Combination of live-action and CGI animation.	/media/tv-shows/show-image-1748363891988-315172901-optimized.jpg	15	14	UCnMc4j7Pg961kzmguZ43esg	t	2017-04-08T05:57:44Z	t	t	f
294	What's New, Scooby-Doo? 	Scooby-Doo and the Mystery, Inc. gang are launched into the 21st century, with new mysteries to solve.	7-12	30	\N	2002	2006	f	\N	5	Low	Moderate-High	High	High	High	High	Moderate	\N	{TV}	{Teamwork,Entertainment,"Problem Solving","Critical Thinking",Mystery,"Mild Peril","Mild Fantasy Violence",Humor}	Digital 2D animation	https://m.media-amazon.com/images/M/MV5BMTIwN2U2OTctMTcxMi00NjllLWE5ZjktZmFiNzAxOWM3YWEwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
299	Zaky & friends	A children's TV show	3-8	15	Zaky & Friends Band	2018	\N	t	\N	3	High	Moderate-High	Moderate	Moderate	Moderate-High	Moderate	Low-Moderate	\N	{YouTube}	{"Life Lessons","Cultures & Traditions","Learning through Songs","Cultural Appreciation","Spiritual Development","Quranic stories",Religion,Literacy,Numeracy,"Social Development",Social-Emotional,"Emotional Intelligence"}	2D Digital Animation with bright colors. Color Palette: Vibrant and engaging.	/media/tv-shows/show-299.jpg	5	2	UCQSyvDdu5yomaGeURMFUHjQ	t	2018-01-15T14:58:12Z	f	f	f
300	Zoboomafoo (1999-2001)	A children's TV show	4-8	26	\N	\N	\N	t	2	3	Moderate	High	Moderate	Moderate-High	High	Moderate	Moderate-High	\N	{TV}	{"Enviromental Awareness","Wildlife Exploration",Animals,Curiosity,Nature,"Wildlife Conservation"}	Live-action, puppetry, and animation	/media/tv-shows/show-300.jpg	\N	\N	\N	f	\N	f	f	f
78	Ed Edd n Eddy	The off-the-wall, day-to-day life of three friends who have exactly the same name.	8-12	30	Danny Antonucci	1999	2008	f	6	5	Low	High	High	Moderate-High	High	High	High	\N	{TV}	{"Cause and Effect","Problem Solving","Mischievious Behaviour",Friendship,"Creativity & Imagination",Humor}	Traditional 2D Animation with exaggerated designs. Color Palette: Bright colors with bold outlines.	https://m.media-amazon.com/images/M/MV5BOWNmY2Y0MDUtMmM4Zi00NGEzLWI1MjEtMDUzYmM2MzFjNTU2XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
96	Gracie's Corner	Gracie's Corner is a YouTube channel for kids. It provides a combination of educational, fun, and encouraging songs for children from diverse backgrounds. Come sing and dance with Gracie as she takes a fun imaginary journey with f...	3-7	30	\N	2020	\N	t	\N	4	High	Moderate-High	High	Moderate-High	High	High	High	\N	{YouTube}	{"Learning through Songs","Cultural Appreciation","Early Childhood experiences","Cultural & Social","Sing Along",Literacy,Music,Dance,Social-Emotional,Numeracy,"Emotional Intelligence","Healthy Eating"}	2D animation with bright, colorful visuals and rhythmic, energetic choreography.	/media/tv-shows/show-96.jpg	\N	\N	\N	f	\N	t	f	f
292	Wacky Races	The Wacky Races are a series of car competitions in which 11 racers race in locations throughout North America. The rules are extremely lax and allow for almost any vehicle design, power system and a wide range of tactics like combat and shortcuts. Despite this loose rule structure, competitors Dick Dastardly and his dog sidekick, Muttley, are still determined to cheat in their own ineffectual way.	6-10	30	\N	1968	1969	f	1	5	Low	Moderate-High	High	High	High	High	Moderate	\N	{TV}	{Mechanics,"Engineering Concepts",Adventure,"Lack of Consequences","Slapstic Comedy",Perseverance,"Mild Violent themes",Entertainment,"Mild Intense Scenes","Creativity & Imagination",Humor,"Recurring Antagonist"}	Cartoonish 2D animation style	https://m.media-amazon.com/images/M/MV5BZjRhMTFjZTQtOTc3MC00NzVjLThlN2ItMjA1MGI5M2Q1YjRhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
90	Genevieve playhouse	A children's TV show	2-5	15	\N	\N	\N	t	\N	3	High	Moderate	Moderate-High	Moderate	High	High	Moderate-High	\N	{YouTube}	{Vocabulary,Entertainment,"Multi-Lingual Learning",Colours,Literacy,Preschool-Basics,"Teaching with Toys",Numeracy,Humor}	Live-Action Toy Demonstrations with Bright Colors	/media/tv-shows/show-90.png	\N	\N	\N	f	\N	f	f	f
106	Hey Duggee	Duggee looks after the Squirrels, who earn different badges on their adventures.	2-5	30	Grant Orchard	2014	\N	t	4	4	High	Moderate	Moderate-High	Moderate-High	High	High	Moderate	\N	{TV}	{Teamwork,"Merit Reward systems",Perseverance,"Problem Solving","Creativity & Imagination"}	2D Digital Animation with simple, geometric shapes and bold outlines. Bright and bold colors with clear contrasts.	https://m.media-amazon.com/images/M/MV5BMTQ3NjYxNjYxNV5BMl5BanBnXkFtZTgwMzc1Mzg1NDE@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
240	Tayo the Little Bus	In a big city where various vehicles are happily living together, our little bus Tayo has just started learning his route in the city. There is lots more to learn for Tayo. Tayo and his friendly friends Rogi, Lani and Gani are helping each other to become great mature buses.	3-6	30	\N	2010	2022	f	\N	4	Low-Moderate	High	Medium	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"Community Service","Vehicle Recognition",Teamwork,Responsibility,Entertainment,"Vehicle Themes","Problem Solving","Social Development",Social-Emotional}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	https://m.media-amazon.com/images/M/MV5BZTc3NDFmZWUtN2VhOC00MzA0LWFmM2EtNjZjMTVkMmRkODY2XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
66	Diego	Diego, a boy who loves nature, helps save animals in trouble with his friend jaguar.	3-6	30	Valerie Walsh Valdes	2005	2013	f	\N	4	High	High	High	Moderate-High	Moderate-High	High	High	\N	{TV}	{"Cultural & Social","Problem Solving","Natural World","Enviromental Awareness","Language Learning","Wildlife Conservation","Animal Behaviour"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	https://m.media-amazon.com/images/M/MV5BYzZjOGE1YTgtMGNjMC00ZTM5LTlhMDQtYmEwN2MzOGZlMWQ2XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
127	Upin & Ipin	A children's TV show	4-10	15	\N	\N	\N	t	\N	3	Moderate	High	Medium	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"Cultural Appreciation","Family Values","Cultural & Social",Responsibility,Morality,"Relatable Situations","Learning from Mistakes",Social-Emotional,"Family Relationships","Emotional Intelligence","Cultures & Traditions"}	3D CGI animation with vibrant colors and detailed environments reflecting Malaysian village life.	/media/tv-shows/show-127.jpg	\N	\N	\N	f	\N	f	f	f
32	Bob the Builder	Bob the Builder and his machine team are ready to tackle any project. Bob and the Can-Do Crew demonstrate the power of positive thinking, problem-solving, teamwork, and follow-through. The team always shows that "The Fun Is In Getting It Done!" Bob the Builder can be seen building, digging, and hauling.	3-6	30	Keith Chapman	1997	2015	f	21	3	Low-Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Low-Moderate	\N	{TV}	{Teamwork,"Repetitive Learning","Problem Solving",Friendship,"Creativity & Imagination"}	Traditional Stop-Motion animation	https://m.media-amazon.com/images/M/MV5BNzUyYTZhNDYtMTEzNS00N2FhLTg3ZWUtNGQ3ODI4NDY1YzNhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
94	Go Go! Cory Carson	A children's TV show	2-5	15	\N	\N	\N	t	7	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Relatable Situations","Vehicle Themes","Problem Solving",Social-Emotional,"Emotional Intelligence",Friendship}	3D CGI Animation with stylized and colorful designs. Bright but not overly saturated colors, with a focus on vibrant settings.	/media/tv-shows/show-94.jpg	\N	\N	\N	f	\N	f	f	f
116	KarazahChannel	A children's TV show	3-8	15	\N	\N	\N	t	\N	3	High	Moderate	Moderate	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"Cultures & Traditions","Cultural Appreciation","Cultural & Social","Language Learning","Arabic Language Learning",Literacy,"Sing Along","Reading Comprehension",Music,"Repetitive Learning"}	Mix of 3D CGI animations for the characters and settings	/media/tv-shows/show-116.png	\N	\N	\N	f	\N	f	f	f
55	Colourblocks	Each vibrant Colourblock personifies a color, making it memorable and exciting for a child. The Colourblocks discover that they can add colour to the world and, by working together, they can create new colours and make new friends.	3-6	30	\N	2022	2024	f	\N	3	High	Moderate-High	Medium	Moderate-High	High	Moderate	Moderate-High	\N	{YouTube}	{"Colour Combinations","Motor Skills",Shapes,Colours,Preschool-Basics,Art,"Creativity & Imagination"}	2D Digital Animation using Colorforms-inspired designs. Color Palette: Bright and bold primary colors with simple shapes.	https://m.media-amazon.com/images/M/MV5BMjA0NDBlMWUtNDIyMy00OTM1LWE3MjUtNjFkM2MyOTJlZjIxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
179	Pete The Cat	Based on the New York Times #1 best-selling children's books by author James Dean, "Pete the Cat" is a fun, musically driven series about exploring your world and trying new things; pushing the boundaries while being smart, accepting, and optimistic. Pete is a very cool and loveable cat who, along with his friends, experiences the day-to-day challenges and changes that children can relate to on a personal level. Whether you're making new friends, or facing all of life's ups and downs, Pete highlights the lessons life can teach you.	3-7	14	James Dean	2017	2022	t	2	2	Moderate	Moderate	Low-Moderate	Low-Moderate	High	Low	Moderate	\N	{TV}	{"Creativity & Imagination",Music,"Emotional Intelligence","Problem Solving"}	2D Digital animation with a hand-drawn look	/media/tv-shows/show-179.jpg	\N	\N	\N	f	\N	f	f	f
2	Ada Twist, Scientist	Ada Twist, Scientist follows the adventures of eight-year-old Ada Twist, a pint-sized scientist with a giant-sized curiosity, who aspires to discover the truth about absolutely everything. With the help of her two best friends, Rosie Revere and Iggy Peck, Ada unravels and solves mysteries for her friends and family. But solving the mystery is only the beginning, because science isn't just about learning how and why and what it's about putting that knowledge into action to make the world a better place.	4-8	30	Chris Nee	2021	2023	f	4	3	High	Moderate-High	Medium	Moderate	Moderate	Moderate	Moderate	\N	{YouTube}	{Teamwork,"Positive Role Models",Science,Perseverance,Curiosity,"Problem Solving","Critical Thinking",STEM}	3D CGI animation with bright and vivid colors	https://m.media-amazon.com/images/M/MV5BMDZjOTE4MTgtYzE2ZC00YjZiLWJmZWEtM2YxYTAxZjVjZTBmXkEyXkFqcGc@._V1_SX300.jpg	279	11		t	2021-08-15T11:19:30.304842Z	t	t	f
213	Sea of love	Sea animal friends Bruda, Bobbi, Wayu and Puri go on mini adventures in the ocean, where relatable, everyday moments come with a splash of magic.	3-6	13	\N	2022	\N	t	1	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Enviromental Awareness",Teamwork,"Marine Bioligy","Wildlife Conservation",Friendship,"Natural World",Responsibility,Social-Emotional,"Problem Solving"}	3D CGI Animation with stylized and colorful designs. Bright but not overly saturated colors, with a focus on vibrant settings.	/media/tv-shows/show-213.jpg	\N	\N	\N	f	\N	f	f	f
45	Charlie's Colorforms City	Charlie introduces the audience to a colorful cast of characters while taking them on an imaginative journey.	2-5	30	\N	2019	\N	t	3	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate	\N	{TV}	{Shapes,"Repetitive Learning",Colours,"Critical Thinking",Preschool-Basics,"Creativity & Imagination","Cognitive Development"}	2D Digital Animation using Colorforms-inspired designs. Color Palette: Bright and bold primary colors with simple shapes.	https://m.media-amazon.com/images/M/MV5BZDM2NjFiZTAtMTg5MS00NDNkLWIzOTQtNzI4ZGEzZGRmOGQ1XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
205	Rosie & Jim	Rosie and Jim are two rag dolls that magically come to life when no-one is looking. They explore different aspects of Great Britain as they travel along the canal network aboard the narrow-boat "Ragdoll" with the boat's owner.	3-6	15	John Cunliffe	1990	2000	t	8	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Moderate	\N	{TV}	{"Repetitive Learning",Curiosity,"Problem Solving","Sing Along",Preschool-Basics,"Language Learning","Creativity & Imagination"}	Live-action puppetry with colorful characters.	/media/tv-shows/show-image-1748363737979-980364607-optimized.jpg	\N	\N	\N	f	\N	f	f	f
235	Superbook	Chris Quantum is your typical Middle School student -- except if you take into account one of his best friends is a robot named Gizmo. Add his best friend Joy Pepper into the mix and you have a recipe for adventure. The adventures begin for this trio when a mysterious device appears and takes them on journeys throughout the Bible. Travel back in time and get ready for the journey of a lifetime!	6-10	30	\N	2011	2021	f	5	4	Moderate	High	High	High	High	High	Moderate	\N	{TV}	{"Cultural Appreciation","Cause and Effect","Positive Role Models",Morality,"Repetitive Learning",Literacy,History,Religion,"Cultures & Traditions",Courage}	3D CGI Animation with Detailed and Dynamic Visuals	https://m.media-amazon.com/images/M/MV5BOTEzNDI2MzEwOV5BMl5BanBnXkFtZTgwMTQwNzQ4NDE@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
225	Star Wars: Young Jedi Adventures	The young Jedi embark on adventures in Tenoo.	4-8	30	\N	2023	2024	f	2	5	Moderate	High	High	Moderate-High	High	High	High	\N	{TV}	{Adventure,"Cause and Effect",Teamwork,"Positive Role Models",Responsibility,Morality,Entertainment,"Mild Intense Scenes","Fantasy Elements",Friendship,"Mild Fantasy Violence","Cultures & Traditions","Conflict Resolution",Courage}	3D CGI Animation with detailed and dynamic visuals.	https://m.media-amazon.com/images/M/MV5BNTZmOTEyMDgtZThkYS00OTkzLTg2ZmYtMjBkMzkyYTE5M2E5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
165	Noodle & Pals	A children's TV show	2-5	15	Noodle & Pals	2021	\N	t	\N	3	Moderate	Moderate-High	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{Literacy,Music,Preschool-Basics,Social-Emotional,Numeracy,"Language Learning","Cognitive Development"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	/media/tv-shows/show-165.jpg	1850000	110	UCUamVL0L_lgG720vqmdZqoA	t	2021-06-15T20:07:03.401512Z	f	f	f
159	Nanalan	A small girl has adventures in her grandmother's back yard.	2-5	15	Jamie Shannon	1999	2004	t	\N	1	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low-Moderate	Low	\N	{YouTube}	{"Early Childhood experiences","Creativity & Imagination",Preschool-Basics,"Communiction & Expression",Vocabulary,Social-Emotional,"Social Development","Relatable Situations"}	Puppet-based animation with simple sets and characters, creating a unique and engaging visual experience	/media/tv-shows/show-159.jpeg	\N	\N	\N	f	\N	f	f	f
195	Raa Raa the Noisy Lion	It features a lion name Raa Raa and his adventures and activities with his friends Topsy, Zebby, Hufty, Ooo Ooo and Crocky in the Jingly Jangly Jungle.	2-5	15	Curtis Jobling	2011	2018	t	3	3	Moderate	Moderate-High	Moderate-High	Moderate	Moderate	High	High	\N	{TV}	{"Communiction & Expression",Social-Emotional,"Social Development",Friendship,"Problem Solving","Emotional Intelligence"}	3D CGI Animation with a soft aesthetic. Color Palette: Pastel colors and gentle hues.	/media/tv-shows/show-195.jpg	\N	\N	\N	f	\N	f	f	f
199	Reading rainbow	LeVar Burton introduces an appropriate subject for each episode to go with the featured children's book that is read in its entirety. This is followed by suggestions of other books for further reading.	5-9	15	\N	1983	2006	t	16	2	High	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	High	\N	{TV}	{"Cultural & Social","Cultural Appreciation","Life Lessons","Positive Role Models","Creativity & Imagination",Social-Emotional,Literacy,Curiosity}	Combination of Live-Action and 2D Animation. Color Palette: Bright and primary colors.	/media/tv-shows/show-199.jpg	\N	\N	\N	f	\N	f	f	f
184	Pip and Posy	Pip and Posy are a mouse and a rabbit whose lives revolve around a wonderful world of play. Packed with warmth and humour, the series is a joyful celebration of their great friendship, its laughter and games, its ups and downs.	2-5	15	\N	2021	\N	t	2	3	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{"Cause and Effect",Friendship,Social-Emotional,"Problem Solving","Emotional Intelligence","Conflict Resolution","Relatable Situations","Social Development"}	3D CGI animation delivered slowly and smoothly	/media/tv-shows/show-184.jpeg	\N	\N	\N	f	\N	f	f	f
216	Sid the Science Kid	A young and curious boy constantly wonders the fields of science.	4-7	30	Jim Henson	2008	\N	t	4	3	High	High	Moderate-High	Moderate-High	High	Moderate-High	High	\N	{TV}	{"Motor Skills",Science,"Relatable Situations",Curiosity,"Problem Solving","Critical Thinking",STEM}	3D CGI Animation with Motion Capture	https://m.media-amazon.com/images/M/MV5BYjIzMjFjNjgtMTJmYy00YzYxLTg0YmEtYTc2YjNkOTcyN2I5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
158	MyGo! Sign Language for Kids	It's My Go, it's Your Go. Ready? Let's Go. Let's learn American Sign Language with the MyGos.	0-5	15	\N	2019	\N	t	\N	3	High	High	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Deaf Community","Memory Exercises","Motor Skills","Communiction & Expression",Literacy,"Visual Demonstrations","American Sign Language","Language Learning","Cognitive Development"}	Live-action demonstrations combined with animated segments to illustrate signs and concepts effectively.	/media/tv-shows/show-158.jpg	\N	\N	\N	f	\N	f	f	f
214	Sesame Street (1969-present)	A children's TV show	2-5	15	\N	\N	\N	t	54	1	High	Moderate	Low-Moderate	Moderate	High	Low	Low-Moderate	\N	{TV}	{Preschool-Basics,"Cultural & Social",STEM,Elementary-Basics,"Cultures & Traditions","Social Development",Routine,"Motor Skills","Emotional Intelligence"}	Various Art Styles	/media/tv-shows/show-214.jpeg	\N	\N	\N	f	\N	f	f	f
3	Adventure Agents	The Adventure Agents is a Family Friendly show produced by the South Family. Life is an adventure, Love is the Key!	6-12, 12+	30	ADVENTURE AGENTS	2018	\N	t	\N	4	High	Moderate-High	Moderate-High	Low	Low	Moderate-High	Moderate	\N	{YouTube}	{Animals,Nature,Adventure,"Farm Life","Cause and Effect","Mature Themes","Outdoor Exploration",Teamwork,"Life Lessons","Motor Skills",Curiosity,"Problem Solving",Discovery,"Confidence Building",Safety,"Critical Thinking","Nature Sounds","Natural World","Enviromental Awareness",Exploration,"Emotional Intelligence","Healthy Eating","Wild Animal Captures and Cooking"}	Live Action Outdoors Survival Adventure	/media/tv-shows/show-3.png	530000	160		t	2019-03-02T02:30:25Z	t	t	f
252	The Berenstein Bears	A children's TV show	4-8	13	\N	\N	\N	t	5	2	Moderate	Moderate	Low-Moderate	Low-Moderate	Moderate	Low	Moderate-High	\N	{TV}	{"Family Values","Relatable Situations","Social Development",Social-Emotional,"Family Relationships","Emotional Intelligence"}	Traditional 2D animation with a hand-drawn look.	/media/tv-shows/show-252.jpg	\N	\N	\N	f	\N	f	f	f
246	The Adventures of Paddington (2019)	A children's TV show	4-8	11	\N	\N	\N	t	3	3	Moderate	Moderate	Moderate-High	Moderate	High	Moderate	Low-Moderate	\N	{TV}	{"Cultural & Social","Emotional Intelligence","Problem Solving","Family Values","Social Development","Family Relationships"}	3D CGI animation	/media/tv-shows/show-246.jpg	\N	\N	\N	f	\N	f	f	f
245	The Adventures of Abney & Teal	Animated adventures of two friends who live on an island in the middle of a lake, in the middle of a park, in the middle of the big city.	3-6	30	\N	2011	2012	f	2	1	Moderate	Low-Moderate	Low	Low-Moderate	Moderate	Low	Low	\N	{TV}	{Nature,"Problem Solving",Social-Emotional,"Creativity & Imagination"}	Stop-motion animation with hand-crafted models.	/media/tv-shows/show-image-1748363793906-839023434-optimized.jpg	\N	\N	\N	f	\N	t	f	f
279	Tinga Tinga Tales	Created for a global audience of 3 to 6 year olds, Tinga Tinga Tales is a land full of big stories and big surprises! Inspired by traditional African Folk tales and the art of Tanzania, Tinga Tinga Tales opens up a fantastical world of colour, characters and transformation. Based upon animal creation stories from all over the African continent Tinga Tinga Tales brings to life tall tales of how of your favourite animals came to be the way they are today. It's a world of stripes and spots, rainbows and patterns. A world where humans don't exist and animals live by their own rules. A world of myth, legend and friendship. A world where you can fly too close to the sun, jump off clouds, and summon musical storms; where you can sing and dance with the dawn chorus, or fall asleep under the stars. A magical world where animals transform before your very eyes! Please subscribe to our channel and share these delightful tales with all your friends.	4-7	30	Claudia Lloyd	2014	\N	t	\N	3	Moderate	Moderate-High	Medium	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"African folk tales","Cultural Appreciation",Animals,Geography,"Traditional Narratives","Cultural & Social",Responsibility,Morality,"Learning from Mistakes",Entertainment,"Light Hearted",Curiosity,"Nature Sounds",Social-Emotional,Friendship,"Cultures & Traditions",Humor,"Animal Behaviour"}	2D Animation Inspired by Tinga Tinga African Art	https://m.media-amazon.com/images/M/MV5BOTZkZjUzODEtODZhMC00YTUyLWE0ZjktODE5NGZhOWFiNzYzXkEyXkFqcGdeQXVyNjExODE1MDc@._V1_SX300.jpg	343000	748		t	2014-03-11T16:30:20Z	t	t	f
289	VeggieTales in the House	Get ready to love your veggies! The beloved faith-based brand has a fresh new look as Bob the Tomato, Larry the Cucumber and all their Veggie friends venture off the countertop for the first time ever in an all-new television series, available exclusively on Netflix. Every episode also features a brand-new, upbeat silly song as the Veggie crew embarks on new adventures throughout their house. This loveable comedy stays true to the roots of the VeggieTales brand by seamlessly weaving in strong moral messages that will capture the hearts of Veggie lovers of all ages.	4-7	30	\N	2014	2016	f	\N	3	Moderate	High	Medium	Moderate	High	Moderate	Moderate	\N	{TV}	{"Community Service","Family Values",Responsibility,"Biblical Teachings","Social Development",Literacy,History,Religion,"Cultures & Traditions"}	3D CGI	https://m.media-amazon.com/images/M/MV5BMmZhM2QxNzctZGU4ZS00NmI3LWI3ZWYtNGE3MGI4MGJkYWVmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
272	The Snoopy Show	The world's most iconic dog is ready for his close-up. Dive into new adventures with the happy-dancing, high-flying, big-dreaming beagle, who's joined by best friend Woodstock and the rest of the "Peanuts" gang.	6-10	30	Rob Boutilier	2021	\N	t	3	3	Low-Moderate	Low-Moderate	Moderate-High	Moderate	High	High	High	\N	{TV}	{"Cultural & Social",Entertainment,"Social Development",Friendship,"Creativity & Imagination"}	2D digital animation	https://m.media-amazon.com/images/M/MV5BNmViOTc4NGQtYThkOC00YTRkLTlmN2UtODMyZmQxNmE1YzFiXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
48	City Vehicles	City Vehicles is a 3D CGI Animation with Bright Colors and Realistic Models show for 2-5 year olds. It features Vehicle Themes, Creativity & Imagination, Engineering Concepts, Mechanics, Problem Solving, Teamwork, Music, and Entertainment themes.	2-5	15	\N	\N	\N	t	\N	5	Low	Moderate	High	High	High	High	High	\N	{YouTube}	{Mechanics,"Engineering Concepts",Teamwork,Entertainment,"Vehicle Themes","Problem Solving",Music,"Creativity & Imagination"}	3D CGI Animation with Bright Colors and Realistic Models	/media/tv-shows/show-48.png	\N	\N	\N	f	\N	f	f	f
176	Paw patrol	Led by a boy named Ryder, a team of six playful rescue dogs use their individual talents to protect the seaside town of Adventure Bay.	3-6	22	Keith Chapman	2013	\N	t	11	5	Low	High	High	High	High	High	High	\N	{TV}	{"Community Service",Teamwork,"Problem Solving",Courage}	3D CGI animation	/media/tv-shows/show-176.webp	\N	\N	\N	f	\N	f	f	f
276	Thomas & Friends 	The series is set in the fictional island of Sodor, located in the Irish Sea. Sodor is depicted as located in Cumbria, near the historical town of Barrow-in-Furness Thomas the Tank Engine is an anthropomorphic steam locomotive, with a design loosely based on the LB&amp;SCR E2 class (1913-1963). Thomas and his associates work at the North Western Railway, the main standard gauge rail network of Sodor. The series focuses on their work relationship.	3-6	30	\N	1984	2021	f	25	1	Moderate	Low	Low	Low	Moderate	Low	Low-Moderate	\N	{YouTube}	{Teamwork,Responsibility,"Problem Solving",Friendship}	Traditional Stop-Motion animation with live-action model sets	https://m.media-amazon.com/images/M/MV5BOTBiODYxNTgtY2UwMy00NjIxLWJmZWYtYzE1MTVkZmFjMGRhXkEyXkFqcGc@._V1_SX300.jpg	3860000	2761		t	2006-06-25T02:43:16Z	t	t	f
234	Super Why!	Super why is a great adventure to get kids to "look in a book!" Wyatt and his pals usually have to solve a problem by looking into a story and solving a puzzle. My infant son loves this show! I find myself singing and dancing to the beginning song! Alpha pig, Princess P, and Red all help Wyatt solve the problem. Great, educational show.	3-6	30	Angela C. Santomero	2007	2016	f	3	3	High	High	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Elementary-Basics,"Problem Solving",Literacy,Numeracy}	3D CGI animation with bright colors and clear designs. Bright and vivid colors focused on storybook settings.	https://m.media-amazon.com/images/M/MV5BYWE4ZmU2MjktZTZhOC00MjQ0LTlmMGEtZWFhYjUzMjNhMmE5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
229	Stillwater	Kids with typical kid challenges have Stillwater, a wise panda, as their next-door neighbor. Through his example, Stillwater gives them a deeper understanding of their feelings as well as tools that help them face their own challenges.	4-8	30	\N	2020	2023	f	3	2	High	Low-Moderate	Low	Low	Moderate	Low	Moderate-High	\N	{TV}	{"Life Lessons","Problem Solving",Social-Emotional,Mindfulness,"Emotional Intelligence","Conflict Resolution"}	Mix of 3D CGI animations for the characters and settings	https://m.media-amazon.com/images/M/MV5BMmVkZDZhNWMtYzZmNC00MGY1LWJiMTYtMzgxMDgwNTY0ZjcwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
36	Brain Candy TV	Early learning for a brighter future. That's the mantra we live by at Brain Candy TV as we produce our fun educational videos for pre-K and elementary school kids. Your children will love to learn their ABCs, numbers, colors and even some math and science with the help of our action-packed vehicles including monster trucks, dump trucks, trains and more, plus our cute dog Lizzy.	0-13+	30	\N	2014	\N	t	\N	5	High	Moderate-High	Moderate-High	Moderate	Moderate-High	High	Moderate	\N	{YouTube}	{Elementary-Basics,Phonics,"Engineering Concepts","Early Childhood experiences","Spacetime and the Cosmos",Science,Vocabulary,Curiosity,Colours,Literacy,Preschool-Basics,"Natural History","Language Learning","Cognitive Development",STEM}	3D CGI Animation with Bright Colors and Realistic Models	https://m.media-amazon.com/images/M/MV5BNzczMDNmMzktMGY4MC00NWFiLWJlNmMtMWJjOWIwMTY0NTNhXkEyXkFqcGdeQXVyOTk4NzI0OTY@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
278	Time for school	The series follows real children embarking on the biggest journey of their lives, their first ever term at school, helping both pre-schoolers and grown-ups prepare for this huge milestone. This innovative project delivers authentic, diverse real-life experiences, key learning outcomes and stimulating interactive content for children and parents alike.	3-6	30	\N	2014	\N	t	1	2	Moderate	Moderate	Low	Moderate	Low-Moderate	Low	High	\N	{TV}	{"Arts & Crafts",Elementary-Basics,"Motor Skills","Relatable Situations","Social Development",Preschool-Basics,Social-Emotional,Routine}	Live-action with real actors.	/media/tv-shows/show-image-1748363352439-799895271-optimized.jpg	\N	\N	\N	f	\N	t	f	f
35	Bounce Patrol	A children's TV show	3-6	15	\N	\N	\N	t	\N	5	High	High	High	High	High	High	High	\N	{YouTube}	{Phonics,Animals,Exercise,Vocabulary,"Sing Along",Colours,Literacy,Dance,Preschool-Basics,Social-Emotional,Numeracy}	Live-Action with Bright Colors and Simple Settings	/media/tv-shows/show-35.jpg	\N	\N	\N	f	\N	f	f	f
4	Adventure Time	Prof. Simon Petrikoff is driven insane by an ancient magic crown the magic, which is the only thing that keeps him and his adopted demon daughter marceline alive after the human world is destroyed. 1000 years later a new world is formed a kingdom of candy run by a harsh ruler Bonnibel bubblegum and monsters and demons roam the lands. Finn and Jake two adventurers become great friends with Marceline, Bubblegum and Simon and they uncover secrets about their past as Finn (the last human) searches for that of his own. As the evil Lich resurfaces, Simon's time displaced fiance Betty goes insane and Finn's sentient grass arm becomes a conflicted volitle plant clone. Finn, Jake, Simon, Marceline and Bubblegum must do whatever they can to save the world from another apocalypse when Bonnibel's evil uncle declares war.	10-14	30	Adventure Time	2010	2018	t	10	5	Low	High	High	Moderate-High	High	High	High	\N	{YouTube}	{Adventure,Entertainment,"Fantasy Elements","Problem Solving","Mild Mature Themes",Friendship,"Creativity & Imagination",Humor}	Traditional hand-drawn 2D animation	https://m.media-amazon.com/images/M/MV5BMjkxMzIwNmQtMzM5Ni00YWJiLTg4YjQtNjBiN2IxMjZhMGQ2XkEyXkFqcGc@._V1_SX300.jpg	1290000	1357	UCFuU-5B1eKAWaTeLUu3JuyA	t	2016-11-03T14:10:13Z	t	t	f
11	Art Kids TV	🧮 Welcome to the official YouTube channel of ART Kids TV! Our channel is dedicated to providing fun, engaging, and educational videos for young learners. We create content that helps toddlers and preschoolers learn the alphabet, numbers, shapes, colors, and more through interactive toy-based activities. Each video encourages a love for learning and develops fine motor skills and cognitive abilities in a playful and imaginative way.\n➡️ Join us for exciting puzzle games, colorful activities, and engaging storytelling. From discovering the ABCs with friendly animals to counting with vibrant fish and identifying shapes with fun puzzles, our videos offer endless opportunities for young minds to grow and thrive. Our content is created by a certified teacher with over 12 years of experience, ensuring each video is educationally sound and developmentally appropriate. 🎬 Subscribe to our channel and hit the bell (🔔) to never miss a video!	5-12	15	ART Kids TV	2014	\N	t	\N	3	High	Moderate-High	Medium	Moderate	Moderate-High	Moderate	Low-Moderate	\N	{YouTube}	{"Arts & Crafts","Motor Skills",Shapes,Painting,Colours,Literacy,Preschool-Basics,Numeracy,Drawing,Origami,"Creativity & Imagination"}	Live-Action with Bright Colors and Simple Settings	/media/tv-shows/show-11.png	53200	168		t	2014-05-24T03:15:24Z	f	t	f
267	The Magic School Bus	In a small grade school, one class has a unique way of learning about the world with their teacher, Ms. Frizzle. To illustrate the science concepts they discuss, they always take a field trip on the Magic School Bus, a magic vehicle that can go anywhere and be anything as the class explores space, the arctic, the human body, and more in order to have a firsthand experience of the principles of science.	6-10	30	\N	1994	1997	f	4	4	High	High	High	Moderate-High	Moderate-High	High	Moderate-High	\N	{TV}	{Experimentation,"Engineering Concepts",Nature,Science,Curiosity,"Enviromental Awareness",STEM}	2D Traditional hand-drawn	https://m.media-amazon.com/images/M/MV5BOWMxZTBkMWEtNWQzOS00NDZmLWJjNWQtYzljMjZmYjUzMDAyXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
53	Cocomelon	In the town of Cocomelon, baby JJ and his siblings go on fun every-day adventures with nursery, play, exploration, and learning - situations that any preschooler could relate to. Fun, relatable stories set to toe-tapping songs.	1-4	30	\N	2018	2024	f	10	5	High	Low	High	Moderate-High	High	High	High	\N	{TV}	{Shapes,"Sing Along",Literacy,Preschool-Basics,Social-Emotional,Numeracy,Routine,"Language Learning","Cognitive Development"}	3D CGI Animation with extremely bright and vivid colors.	https://m.media-amazon.com/images/M/MV5BMmM5OGI0YjAtZGFlMC00MThmLTgwM2MtZTdhYmQ3YzJlNmYwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
265	The Little Mermaid	The adventures of Ariel (Jodi Benson) and her friends at the age of fourteen. From her first known trouble with Ursula (Pat Carroll) to her collection of human objects, the show illustrates the Princess's journey as she finishes growing up. It also introduced new characters such as Ariel's merboy friend (an orphan named Urchin (Danny Cooksey), who her family all saw as a little brother), the snobbish merteen called Pearl (Cree Summer), the Lobster Mobster (Joe Alaskey), Evil Manta (Tim Curry), Sebastian's (Samuel E. Wright's) family, and an orca that Ariel named "Spot".	6-10	30	\N	1992	1994	f	3	4	Low-Moderate	High	High	High	High	High	High	\N	{TV}	{Adventure,Teamwork,Entertainment,"Enviromental Awareness","Mild Peril","Marine Bioligy",Friendship,Courage}	Traditional 2D Animation with Bold Designs	https://m.media-amazon.com/images/M/MV5BY2IyMDJhODYtMTZjOS00YjI0LThiN2QtNGE3N2E3NTYzMTEwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
129	Listener Kids	A children's TV show	2-6	15	\N	\N	\N	t	\N	2	High	High	Moderate	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Learning through Songs","Cultures & Traditions","Cultural & Social","Spiritual Development",Faith,"Biblical Stories",Religion,"Christian Values",Morality,"Sing Along","Social Development","Positve Mindset"}	Combination of live-action and animated elements, featuring colorful visuals and friendly characters.	/media/tv-shows/show-129.jpg	\N	\N	\N	f	\N	f	f	f
57	Courage the Cowardly Dog	The offbeat adventures of Courage, a cowardly dog who must overcome his own fears to heroically defend his unknowing farmer owners from all kinds of dangers, paranormal events and menaces that appear around their land.	10-14	30	\N	1999	2002	f	4	5	Low-Moderate	Moderate	High	Moderate-High	High	High	High	\N	{TV}	{"Dark Themes","Surreal Imagery",Perseverance,Entertainment,"Mild Intense Scenes","Problem Solving","Overcoming Fears","Creativity & Imagination",Humor,Courage}	Traditional 2D Animation with surreal and sometimes dark visuals. Color Palette: Varied colors with contrasting dark and bright tones.	https://m.media-amazon.com/images/M/MV5BMzdiMWI4OGMtZDc2MC00NDllLTgyMWUtN2ZmZjVlYWFkYjQxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
100	Gumby	The adventures of Gumby, a being made of clay and who can transform into several shapes, without losing his anatomy. He is accompanied by his red pony Pokey.	4-8	30	\N	1956	1969	f	3	2	Low	Moderate	Medium	Moderate	High	Moderate	Low-Moderate	\N	{TV}	{Perseverance,"Problem Solving","Creativity & Imagination"}	Stop-Motion Animation using clay figures (claymation). Color Palette: Varied colors with a mix of bright and muted tones. Unique asthetic uncommon in the present day.	https://m.media-amazon.com/images/M/MV5BNmEwYTY0MDMtY2FlMy00NzdhLTljZWUtNTg4NmIyM2FkN2U0XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
264	The Lion Guard	Disney's 1994 classic "The Lion King (1994)" is one of the most beloved animated films in the company's storied history. This follow-up series introduces Simba's son, fun-loving Kion, who is happy that his sister, Kiara, is destined to rule the Pride Lands. He soon discovers that as the second-born he has his own destiny: to lead the Lion Guard, a team that protects the Pride Lands and defends the Circle of Life. As the leader, Kion receives the Roar of the Elders; a power that makes him the fiercest creature in the land. But he can't do it alone, so he assembles a team of animals who are brave, strong and fast. His team includes honey badger Bunga, hippo Beshte, cheetah Fuli and egret Ono.	4-8	30	Ford Riley	2015	2019	f	3	4	Moderate	High	High	Moderate-High	High	High	High	\N	{TV}	{Responsibility,"Natural World","Enviromental Awareness","Wildlife Exploration","Wildlife Conservation",Courage}	2D Digital Animation with bright and colorful designs. Color Palette: Bright and vivid colors with emphasis on primary colors.	https://m.media-amazon.com/images/M/MV5BMGY4NTUwZDUtMzQ5ZS00YzVmLTgyMzEtMTY5YzY2OWE2NWI4XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
14	Baba blast	Baba Blast! provides educational videos for toddlers and kids. Created by Kyle Kittleson, Baba Blast! releases new kids videos each week - designed for viewers in early childhood. Children will love exploring new and exciting locations such as the zoo, dinosaur exhibits, fire stations, and more! They'll have fun learning through engaging gameplay, learning about animals, and new dance moves to their new favorite songs. Baba Blast! aims to entertain, teach, encourage empathy, focus on diversity, and developmental milestones throughout this YouTube Channel designed for kids. YouTube educational videos for toddlers and kids are categorized into four primary categories; playing and learning, tours and adventures, music and self-expression, and relax and calm. You can learn more about how Baba Blast! constructs educational and entertaining videos for kids at babablast.com/about. Website ► / Instagram ►	3-6	15	Baba Blast! Animal & Dinosaur Videos for Kids	2022	\N	t	\N	4	High	High	Moderate-High	Moderate	Moderate	Moderate-High	Moderate	\N	{YouTube}	{Paleontology,"Early Childhood experiences",Dinosaurs,Entertainment,"Sing Along",Dance,Social-Emotional,Exploration,"Natural History"}	Combination of Live-Action and 2D Animation. Color Palette: Bright and primary colors.	/media/tv-shows/show-14.jpg	158000	301	UC6X4scOCUwpKFZUsCwv4mfw	t	2022-01-31T02:04:10.38046Z	f	t	f
293	Wallykazam	A children's TV show	3-6	26	Adam Peltzman	2014	2017	t	2	3	High	High	Medium	Moderate	Moderate-High	Moderate	High	\N	{TV}	{Elementary-Basics,Phonics,"Motor Skills","Fantasy Elements","Problem Solving",Literacy,"Reading Comprehension","Language Learning"}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	/media/tv-shows/show-293.jpg	\N	\N	\N	f	\N	f	f	f
288	VeggieTales	After years of being seen via VHS and DVD, Bob the Tomato, Larry the Cucmber, and their friends come to TV. Every week Bob invites us to his house where he and the gang answer letters from kids and help them with their problems using their fun and sometimes wacky stories.	4-8	30	Phil Vischer	1993	2015	f	2	4	Moderate	High	Medium	Moderate	High	Moderate	High	\N	{YouTube}	{"Community Service","Family Values",Responsibility,"Biblical Teachings","Social Development",Literacy,History,Religion,"Cultures & Traditions"}	3D CGI	https://m.media-amazon.com/images/M/MV5BYjhmNmYyNDQtZTQ3Yi00OTcwLWIyODMtZDgyNmFlZjIyYWE4XkEyXkFqcGc@._V1_SX300.jpg	767000	1460		t	2006-07-06T22:16:09Z	t	t	f
7	Alphablocks	Learning ABCs and spelling with 26 personifications of the letters of the alphabet, each with their own quirks.	3-6	30	Alphablocks	2010	2021	f	5	3	High	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{YouTube}	{Phonics,Literacy,Preschool-Basics,"Language Learning"}	2D digital animation with colorful and stylized block characters.	/media/tv-shows/show-image-1748363963898-439445275-optimized.jpg	3150000	1738		t	2015-01-15T10:40:49Z	t	t	f
280	Tom & Jerry	The Hanna-Barbera-created Oscar-winning cat-and-mouse team of Tom &amp; Jerry returned to TV in an hour-long stretch of new adventures. Here, T&amp;J, after years of rivalry, have become the best of friends (and Jerry dons a red bow tie, so the animators would be able to "fragment" his movements), in episodes wherein they roamed the world competing in sports, enduring on-the-job misadventures, running afoul of dastardly villains, solving mysteries and helping others. In the first season, three 7-minute New Tom &amp; Jerry segments alternated with two 10-minute ones concerning a 40-foot purple ape, Grape Ape (voiced by Bob Holt) and his fast-talking beagle buddy, a carnival hustler answering to the unlikely moniker of Beegle Beagle (voiced by Marty Ingels), or "Beegley Beagley," as G.A. would lovingly refer to him. The second season ushered in 16 6-minute segments of The Mumbly Cartoon Show, a new Hanna-Barbera comedy/mystery concerning a snickering plainclothes man detective hound named Lt. Mumbly (voiced by the late Don Messick and patterned loosely after Muttley of Wacky Races [CBS, 1968-70] and Dastardly And Muttley In Their Flying Machines [CBS, 1969-71] fame) and his schlocky stooge, Shnooker (voiced by John Stephenson).	6-12	30	Sherm Cohen	1975	1977	f	1	4	Low	Moderate	High	High	High	High	Low-Moderate	\N	{TV}	{"Slapstic Comedy",Entertainment,"Problem Solving",Music,Rivalry,"Mild Fantasy Violence","Creativity & Imagination",Humor}	2D Digital Animation with exaggerated and dynamic character movements.	https://m.media-amazon.com/images/M/MV5BY2M1Mzc5NGItZmM0Yi00NDUzLWExYzUtMDlmZmFiM2Q0NDZmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
260	The Epic Tales of Captain Underpants	George and Harold's school has been selected to go to space along with their principal, Mr. Krupp. And when danger is very near, they snap their fingers... and Mr. Krupp turns into Captain Underpants, a superhero in only his cape and undies.	6-10	30	\N	2018	2019	f	\N	5	Low	High	High	Moderate-High	High	High	Low-Moderate	\N	{TV}	{Entertainment,"Toilet Humour","Problem Solving","Mischievious Behaviour",Friendship,"Creativity & Imagination",Humor}	2D animation with a comic-book aesthetic	https://m.media-amazon.com/images/M/MV5BMTE0NjExODU0NDZeQTJeQWpwZ15BbWU4MDg5NTk3ODUz._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
257	The Clangers	The series chronicled the melancholically funny lives of the Clangers, a flutey-voiced family of woolen, knitted aliens living below the surface of a knobbly little planet far out in space. Their misadventures brought them into contact with such unlikely creatures as the Soup Dragon, the Froglets, the Iron Chicken and the Glow Buzzers.	3-6	30	\N	1969	1974	f	2	2	Moderate	Low	Medium	Moderate	Moderate-High	Moderate	High	\N	{TV}	{"Spacetime and the Cosmos",Teamwork,"Problem Solving","Social Development",Social-Emotional,Exploration,"Creativity & Imagination"}	Traditional Stop-Motion animation with live-action model sets	https://m.media-amazon.com/images/M/MV5BODU4NTY5NTY1OV5BMl5BanBnXkFtZTcwNTQ1OTkxMQ@@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
21	Be Cool, Scooby-Doo!	After finishing up their senior year of high school, the Scooby-Doo-gang decide to travel in the Mystery Machine, seeking fun and adventure during what could possibly be their last summer together. However, monsters prevent them from completing their journey.	7-12	30	\N	2015	2018	f	\N	5	Low	High	High	High	High	High	High	\N	{TV}	{Teamwork,Entertainment,"Problem Solving","Critical Thinking",Mystery,"Mild Peril","Mild Fantasy Violence",Humor}	Cartoonish 2D animation style	https://m.media-amazon.com/images/M/MV5BMzk0ZGQyMjgtYWU1OS00MjRlLThlOGQtYjI5NzA1ZGRjNWM4XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
29	Blue's Clues	Blue's Clues is a breakthrough play-along show that allows its preschool audience to "step inside" and become part of a bright, fanciful world where the host, Steve, lives with his animated puppy, Blue. The audience actively participates in Steve's daily routine and helps solve everyday problems, all within a context of entertaining games and activities. Blue's Clues is designed to develop preschoolers' thinking, reasoning and social skills through an educational approach called "flexible thinking," a theory that recognizes that children need to learn, not just what to think, but how to think for themselves. Blue's Clues uses a play-along format, which encourages kids to actively participate in using the clues as they view the program.	3-6	30	\N	1996	2007	f	6	1	High	Moderate	Low	Low-Moderate	Moderate	Low	Low	\N	{TV}	{"Problem Solving","Critical Thinking",Preschool-Basics,"Emotional Intelligence"}	Live action, Digital 2D animation	https://m.media-amazon.com/images/M/MV5BYmFjN2RhZmEtNDI5Zi00MWI5LWE0M2QtZDlmYWM0ZTYyZDc5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
30	Blue's Clues & You!	Blue's Clues and You follows Blue as she invites viewers to join her and Josh on a clue-led adventure and solve a puzzle in each episode. With each signature paw print, Blue identifies clues in her animated world that propel the story and inspire the audience to interact with Josh and Blue to figure out Blue's Clues.	3-6	30	\N	2019	\N	t	6	1	High	Moderate	Low	Low-Moderate	Moderate	Low	Low	\N	{YouTube}	{"Problem Solving","Critical Thinking",Preschool-Basics,"Emotional Intelligence"}	Live action, Digital 2D animation	https://m.media-amazon.com/images/M/MV5BNWE4NTQxODctMDc5ZS00MGYzLTlmMjctNzdjMGY4NTFiNWUxXkEyXkFqcGc@._V1_SX300.jpg	3020000	1595		t	2020-01-03T17:06:41.892147Z	t	t	f
193	Puffin Rock	Puffin Rock follows the adventures of Oona, her little brother Baba, and their family and friends on a gorgeous and wild Irish island.	2-5	7	Lily Bernard	2015	2016	t	2	1	Moderate	Low	Low	Low	Low-Moderate	Low	Low	\N	{TV}	{Nature,"Problem Solving","Enviromental Awareness","Family Relationships","Wildlife Exploration"}	Digital 2D animation	/media/tv-shows/show-193.jpg	\N	\N	\N	f	\N	f	f	f
186	PJ Masks	Three children become superheroes at night. During the school day a problem arises, and during the night the culprit is found by the PJ Masks and the problem gets solved by sharing ideas, recognizing strengths and weaknesses, and the ability of working together to get the problem solved. Everything is made right for the children the next day thanks to the PJ Masks. Because bedtime is the right time to fight crime.	3-6	11	\N	2015	2025	t	6	5	Low-Moderate	High	High	High	High	High	High	\N	{TV}	{Morality,Entertainment,"Social Development",Social-Emotional,"Super Hero Themes","Creativity & Imagination","Recurring Antagonist"}	3D CGI Animation with bright and vibrant colors. Color Palette: Bright and cheerful colors with high saturation.	/media/tv-shows/show-186.jpeg	\N	\N	\N	f	\N	f	f	f
251	The Bear Construction	A children's TV show	3-7	15	\N	\N	\N	t	\N	3	Low	Moderate	High	Low	Low	High	Moderate-High	\N	{YouTube}	{"Engineering Concepts","Vehicle Recognition",ASMR,Teamwork,Entertainment,"Vehicle Themes",Curiosity,"Story Telling without Dialogue","Problem Solving",Machinery,Construction}	3D CGI animation with detailed depictions of construction sites and machinery	/media/tv-shows/show-251.png	\N	\N	\N	f	\N	f	f	f
287	Ultimate Spiderman	A children's TV show	7-12	22	\N	\N	\N	t	4	5	Low-Moderate	High	High	High	High	High	Moderate	\N	{TV}	{Responsibility,"Mild Violent themes",Morality,Entertainment,"Problem Solving","Super Hero Themes","Mild Fantasy Violence",Humor,Courage}	2D Digital Animation with bold lines and exaggerated expressions. Color Palette: Bright and vivid colors with high contrast	/media/tv-shows/show-287.jpeg	\N	\N	\N	f	\N	f	f	f
271	The Oddbods Show	Oddbods is a sketch-based series following the adventures of seven adorable characters as they laugh, fool, and trip their way through the most seemingly ordinary situations, often with unexpected consequences. Each Oddbod has a distinct personality that was created to appeal to adults and children alike. Everything is about to get a little odd.	6-10	30	\N	2016	\N	t	4	5	Moderate	Low	High	High	High	High	High	\N	{TV}	{"Slapstic Comedy",Entertainment,"Problem Solving",Social-Emotional,"Mischievious Behaviour",Friendship,"Creativity & Imagination",Humor}	3D CGI animation with bright and vivid colors	https://m.media-amazon.com/images/M/MV5BMWZiZjc4YzktMWExMC00OTA2LWEwMDctOWM1MjI1NWE3MWJmXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
220	Sonic the Hedgehog	In a post-apocalyptic and dystopian future, all life has been challenged by oppression and tyranny, as the evil Dr. Robotnik is on the wake of controlling Mobius.	7-12	15	\N	1993	1994	t	2	5	Low-Moderate	High	High	High	High	High	Low-Moderate	\N	{TV}	{Adventure,Teamwork,Perseverance,Entertainment,Friendship,"Mild Fantasy Violence",Humor,Courage}	3D CGI Animation with detailed and dynamic visuals.	/media/tv-shows/show-220.jpg	\N	\N	\N	f	\N	f	f	f
239	Tangled: Before Ever After	A children's TV show	3-6	15	\N	\N	\N	t	3	5	Moderate	High	High	High	High	High	Low-Moderate	\N	{TV}	{Nature,Adventure,Responsibility,Perseverance,"Mild Intense Scenes","Fantasy Elements","Social Development","Overcoming Fears","Mild Peril",Friendship,Courage}	2D digital animation	/media/tv-shows/show-239.jpeg	\N	\N	\N	f	\N	f	f	f
197	Rapunzel's Tangled Adventure	Set between Walt Disney Animation Studios' "Tangled" and its short film "Tangled Ever After," this animated adventure/comedy series unfolds as Rapunzel acquaints herself with her parents, her kingdom and the people of Corona.	6-10	22	Shane Prigmore	2017	2020	t	3	5	Moderate	High	High	High	High	High	Moderate	\N	{TV}	{"Creativity & Imagination","Life Lessons","Overcoming Fears",Adventure,Courage,Friendship,"Emotional Intelligence","Problem Solving",Perseverance,"Mild Intense Scenes"}	2D digital animation with bright colors and exaggerated, stylized designs. Bright and vivid colors with high contrast.	/media/tv-shows/show-197.jpg	\N	\N	\N	f	\N	f	f	f
169	Oggy and the Cockroaches	From the makers, and broadcasters of "Space Goofs" (1997), comes the tale of an otherwise contented cat named Oggy, who faces constant harassment by a group of annoying cockroaches. Relying on no dialogue whatsoever, this half-season cartoon operated with semi-silent humor, reminiscent of the original Tom &amp; Jerry cartoons, and the many incarnations of "The Pink Panther Show"	6-10	7	Jean-Yves Raimbaud	1995	2018	t	7	5	Low-Moderate	Low	High	High	High	High	High	\N	{TV}	{"Slapstic Comedy",Entertainment,"Problem Solving","Mischievious Behaviour","Creativity & Imagination",Humor}	2D Digital Animation with exaggerated and dynamic character movements.	/media/tv-shows/show-169.jpg	\N	\N	\N	f	\N	f	f	f
139	Marcus Level	Zapped into his favorite video game, Marcus has to get through tons of levels and other shenanigans to beat the game and return home, with the help of two allies from the game. Meanwhile, the star of the game is in the real world, dealing with a babysitter.	7-11	11	\N	2014	\N	t	1	5	Moderate	High	High	High	High	High	High	\N	{TV}	{"Creativity & Imagination","Fantasy Elements","Problem Solving",Perseverance,Adventure,Teamwork,"Critical Thinking","Mild Peril","Mild Fantasy Violence"}	2D Digital Animation with a video game aesthetic. Color Palette: Bright, vivid colors with high saturation	/media/tv-shows/show-139.jpeg	\N	\N	\N	f	\N	f	f	f
162	Ninjago	Fire Chapter- 6 months after March Of The Oni, A greater threat disturbs the peace and quiet of Ninjago. Meanwhile, Zane get dreams of the future. Ice Chapter- Save Zane! After Zane's banishment to the Never-Realm, The Ninja will go there to save Zane, while saving the realm and the inhabitants from Ice Samurai and the Ice Emperor.	7-12	22	Tommy Andreasen	2019	2022	t	4	5	Low-Moderate	High	High	High	High	High	High	\N	{TV}	{Teamwork,"Complex & Emotional Themes",Perseverance,"Mild Violent themes",Morality,Entertainment,"Problem Solving","Mild Fantasy Violence",Courage,"Super Hero Themes"}	3D CGI Animation with Detailed and Dynamic Visuals	/media/tv-shows/show-162.jpg	\N	\N	\N	f	\N	f	f	f
248	The Adventures of Teddy Ruxpin	Illiop Teddy Ruxpin (Illiops being bear-like creatures) leaves his homeland in Rillonia with his friend Grubby, an octopede, in search of adventure. They meet up with an inventor named Newton Gimmick who accompanies them on their quest for the Treasure of Grundo. What the Trio unexpectedly find are six crystals with different meanings and powers. These crystals, however, also can enable the Monsters and Villains Organization (MAVO) to have absolute power over the land, and the leader, Quellor, wants to make sure that an Illiop never possesses the crystals. Elsewhere, a less pronounced threat also routinely besieges the Trio, which is the wannabe villain Jack W. Tweeg, a greedy Troll-half Grunge who has huge hopes for joining MAVO. The sixty five episode series, based upon the tape-and-book toy bear Teddy Ruxpin, unfolds gradually, as the Trio meet up with more and more interesting and often friendly creatures and visit intriguing lands.	5-8	30	Ken Forsse	1987	1988	f	1	3	Moderate	Moderate	Medium	Moderate	Moderate	Moderate	Moderate	\N	{TV}	{Adventure,"Life Lessons",Perseverance,Morality,"Fantasy Elements","Problem Solving",Social-Emotional,"Mild Peril",Friendship,Courage}	Traditional 2D hand-drawn animation with detailed illustrations. Soft, pastel colors with a focus on everyday environments.	https://m.media-amazon.com/images/M/MV5BMTMxOTY3MjYwM15BMl5BanBnXkFtZTcwNzk0MTIzMQ@@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
39	Caillou	Entertaining misadventures of a four year old boy named Caillou, where each day he discovers something new and interesting with his mommy, daddy, and Rosie. Between Caillou segments are segments featuring Caillou's pet cat Gilbert, Caillou's teddy bear, Teddy, and Caillou's toy dinosaur, Rexy, in puppet form. The show deals with issues like fear of the dark, patience, being a good friend, being a good sibling, and other important facts of life.	2-5	30	\N	1997	2018	f	8	2	Low	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Low-Moderate	\N	{TV}	{"Frequent Whining","Lack of Consequences",Tantrums,Patience,"Relatable Situations",Social-Emotional,"Family Relationships","Emotional Intelligence",Friendship,"Conflict Resolution"}	Traditional hand-drawn 2D animation. DIgital later in the seasons	https://m.media-amazon.com/images/M/MV5BMjgyM2MzYmYtMjYxNy00NTAyLWEwMGItYzViZGZlOGU0YzQwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
224	SpongeBob SquarePants	The character-driven cartoon chronicles the nautical and often nonsensical adventures of SpongeBob, an incurably optimistic and earnest sea sponge, and his underwater friends. Dwelling a few fathoms beneath the tropical isle of Bikini Atoll in the sub-surface city of Bikini Bottom, SpongeBob lives in a two-story pineapple. Instead of taking the logical approach to everyday challenges, SpongeBob approaches life in a wayward and unconventional way. Whether searching for the ultimate spatula to perfect his burger flipping technique at the Krusty Krab or just hanging out with his best friend Patrick (an amiable starfish), SpongeBob's good intentions and overzealous approach to life usually create chaos in his underwater world.	6-12	30	Stephen Hillenburg	1999	\N	t	15	5	Low-Moderate	High	High	Moderate-High	High	High	Moderate	\N	{TV}	{"Surreal Imagery",Entertainment,"Mild Intense Scenes","Problem Solving",Friendship,"Creativity & Imagination",Humor}	Traditional 2D animation with expressive and exaggerated character designs. Bright and vivid colors with high contrast.	https://m.media-amazon.com/images/M/MV5BYjJmMjBkZjMtZThiZS00Nzk3LWJlN2UtYmE5ZjkyNjJiZjgxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
42	Captain Planet and the Planeteers	Seeing the Earth in its profound environmental peril, Gaia (Whoopi Goldberg), goddess of the Earth, summons five kids from around the world to become the Planeteers, an opposing force to fight back and educate others in the need to be environmentally responsible. To accomplish that task, each kid is given a magic ring that each has a power of earth, wind, water, fire and heart. When the threat they face is too big for them to face, they can combine and amplify their powers to create Captain Planet (David Coburn), who has the power to stop catastrophic environmental disasters himself, while the Planeteers contribute with the things anyone can and should do to help.	7-12	30	\N	1990	1996	f	6	4	Moderate	High	High	High	High	High	High	\N	{TV}	{Teamwork,Responsibility,Entertainment,"Social Development","Enviromental Awareness","Mild Peril","Super Hero Themes",Ecosystems}	Traditional 2D Animation with Bold Designs	https://m.media-amazon.com/images/M/MV5BMzQxODk4YWEtOTNhYS00YzZlLWE0ZDktNDk3MzE4ODI4MzIyXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
211	Sarah and Duck	Sarah is a young British girl whose best friend happens to be a duck, named Duck. Everyday they embark on small adventures learning about the world as they go with the help of their friends. From Sarah's love of the tuba and sea cows to Duck's obsession with bread there's always much to do, even if that simply means a good sit-and-think.	3-6	7	Sarah Gomes Harris	2013	2017	t	3	1	Low-Moderate	Low-Moderate	Low	Low	Moderate	Low	Moderate	\N	{TV}	{"Creativity & Imagination",Friendship,"Problem Solving","Relatable Situations",Social-Emotional}	2D Digital animation with a hand-drawn look	/media/tv-shows/show-211.jpeg	\N	\N	\N	f	\N	f	f	f
210	Sagwa, the Chinese Siamese Cat	Sagwa (a kitten), her siblings, and her parents are owned by a Chinese official called "The Foolish Magistrate" (since he tends to make laws and proclamations rather grandiosely and illogically) in 19th Century China. She and her parents are "scribe" cats, who transcribe the magistrate's words to paper in beautiful calligraphy. The series begins by showing how Sagwa came to the magistrates favor by negating one of his foolish laws at the same time ink-staining her face to appear as a Siamese cat. She has many adventures with her siblings, her friend Fufu (a bat), and the local village cats who don't live as luxuriously as her and her family.	4-8	24	Erica Rothschild	2001	2004	t	1	3	Moderate	Moderate	Moderate	Moderate	Moderate	Moderate	High	\N	{TV}	{"Cultural Appreciation","Cultures & Traditions","Cultural & Social",Friendship,"Problem Solving","Family Values"}	Traditional 2D animation with a hand-drawn look.	/media/tv-shows/show-210.jpeg	\N	\N	\N	f	\N	f	f	f
182	Pingu	Who is Pingu? He's a charming and cheeky young penguin who lives in the snow and ice of the South Pole. Often finding himself in tricky and comical situations, the mischievous penguin meets the challenges of life head on, as he grows into a cooler and wiser penguin along the way. The award-winning, stop-frame calymation show appeals to millions of fans worldwide. Pingu has fun chillin' with his family and friends at their Arctic home, but that's just the tip of the iceberg when it comes to the cool adventures of this humorous penguin. Penguins have feelings too, and Pingu experiences the joys and frustrations of kids everywhere in these fun-filled stories. But sometimes things get out of hand as the mischievous little penguin goes from one "ice-capade" to another!	2-5	5	Erika Brueggemann	1980	2006	t	6	1	Low	Low	Low	Low-Moderate	Low-Moderate	Low-Moderate	Low	\N	{TV}	{Social-Emotional,"Mischievious Behaviour","Family Relationships","Emotional Intelligence"}	Traditional Stop-Motion (claymation)	/media/tv-shows/show-182.jpeg	\N	\N	\N	f	\N	f	f	f
181	Phineas and Ferb	Phineas Flynn (Vincent Martella) and Ferb Fletcher's (Thomas Brodie-Sangster's) backyard is the neighborhood hotspot for all of their cool inventions. Meanwhile, their elder sister Candace (Ashley Tisdale) is obsessed with busting her brothers for all the inventions to her mom once and for all. Simultaneously, their secret-agent pet, Perry the Platypus (Dee Bradley Baker) fouls the "evil" schemes and plans of Dr. Heinz Doofenshmirtz (Dan Povenmire).	8-12	22	Jeff 'Swampy' Marsh	2007	\N	t	6	5	Low	High	High	Moderate-High	High	High	High	\N	{TV}	{STEM,"Creativity & Imagination","Problem Solving",Curiosity,Adventure,Humor,"Family Relationships",Entertainment,"Engineering Concepts","Mischievious Behaviour"}	2D Digital Animation with stylized, geometric designs. Bright and vivid colors with detailed backgrounds.	/media/tv-shows/show-181.jpeg	\N	\N	\N	f	\N	f	f	f
178	Peppa pig	Peppa is a loveable, cheeky little piggy who lives with her little brother George, Mummy Pig and Daddy Pig. Peppa's favourite things include playing games, dressing up, days out and jumping in muddy puddles. Her adventures always end happily with loud snorts of laughter.	2-5	15	Neville Astley, Mark Baker	2004	\N	t	8	3	Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low	Moderate	\N	{TV}	{Tantrums,"Relatable Situations","Social Development",Social-Emotional,"Mischievious Behaviour","Family Relationships",Routine,Friendship}	2D Digital Animation with simple, flat designs. Bright but pastel-like colors with minimal shading.	/media/tv-shows/show-178.jpg	\N	\N	\N	f	\N	f	f	f
54	Codename: Kids Next Door	Codename: Kids Next Door follows the escapades of five eager, yet bumbling, ten-year-olds as they join forces against adulthood to fight for the right to enjoy all the fun things in life. These principled kids tackle the really important issues facing their peers, like the right to stay up late or to eat whatever they want. But when taking a stand is just not enough, this crew embarks on top secret missions on behalf of children everywhere, utilizing fantastic homemade technology like flying machines and catapults, to accomplish their goals. Like any good team, the agents in Codename: Kids Next Door each have their own distinct identities, skills and personalities. Numbuh One is Nigel Uno, the British-accented leader of the group. Hoagie P. Gilliam, a mechanical genius and expert pilot, is known as Numbuh Two. Diversionary tactics are the specialty of Kiki Sanban, also known as Numbuh Three. Brash and impulsive Numbuh Four (Wallabee Beatles) is a master of hand to hand combat. And Numbuh Five, alias Abigail "Abby" Lincoln, is the quiet one with the most common sense. Whether it's the possibility of getting shipped off to summer camp, battling the imposition of adult swim time at the local swimming pool, or clashing with adult enemies such as Gramma Stuffum, Knightbrace, Mr. Wink and Mr. Fibb, these kids have their work cut out for them.	7-12	30	Tom Warburton	2002	2008	f	6	4	Low-Moderate	High	High	Moderate-High	High	High	High	\N	{TV}	{Teamwork,"Problem Solving","Mischievious Behaviour","Mild Fantasy Violence","Creativity & Imagination",Courage}	2D Digital Animation with stylized character designs. Color Palette: Bright and varied colors with bold outlines.	https://m.media-amazon.com/images/M/MV5BMTdkNmY4ZGMtZTk3YS00OWUxLTlmNTktZTAxNTg1MWM2YmM2XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
191	Postman Pat	This classic children's series follows the adventures of everyone's favourite postman as he carries out his mail rounds in the village of Greendale.	3-6	15	John Cunliffe	1981	2017	t	9	2	Low	Moderate	Low-Moderate	Low-Moderate	Moderate	Low-Moderate	Low-Moderate	\N	{TV}	{"Community Service",Teamwork,Responsibility,Entertainment,"Problem Solving"}	Traditional Stop-Motion animation	/media/tv-shows/show-191.jpg	\N	\N	\N	f	\N	f	f	f
189	Pocoyo	Pocoyo is a curious toddler dressed all in blue, from his blue cap to his blue jumpsuit. He's full of fun and perhaps a touch of good-natured mischief. His friends include Pato, the yellow duck; Elly, the pink elephant with a blue backpack; Loula, his faithful dog; Sleepy Bird, the droopy-eyed blue-green bird always asleep in her nest; and many others. The Narrator greets little Pocoyo every day and gently suggests an answer to anything that puzzles him. But just as often, the Narrator himself learns something valuable. Pocoyo's computer-animated world is full of simple shapes, bright colors and cheerful music.	2-4	7	Andy Yerkes	2005	\N	t	5	3	High	Low	Moderate	Moderate	Moderate	Moderate	Low-Moderate	\N	{TV}	{"Creativity & Imagination","Cultural & Social","Language Learning",Social-Emotional,"Problem Solving",Teamwork,"Emotional Intelligence",Curiosity,"Cognitive Development"}	3D CGI animation delivered slowly and smoothly	/media/tv-shows/show-189.jpeg	\N	\N	\N	f	\N	f	f	f
58	Cowboy Jack	Cowboy Jack is an educational and fun channel for kids that takes them on adventures to explore this amazing world we call home.  Every week, Cowboy Jack leads a new virtual field trip to somewhere new and exciting that is fun for the entire family to enjoy.	3-8	15	\N	\N	\N	t	\N	4	High	High	Moderate-High	Moderate-High	High	Moderate-High	High	\N	{YouTube}	{Adventure,"Life Lessons","Positive Role Models","Cultural & Social",Vocabulary,"Relatable Situations",Curiosity,"Social Development",Discovery,History,"Travel Geography",Social-Emotional,Exploration,"Cultures & Traditions"}	Live-Action with Real-World Exploration	/media/tv-shows/show-58.png	\N	\N	\N	f	\N	f	f	f
37	Bubble Guppies	For over a decade, giving children ages 1-7 underwater discoveries, Bubble Guppies is still relying on six guppies, going on seven. Molly, Gil, Goby, Deema, Oona, Nonny, and their new friend Zooli are still soaking up the fun of everything on Nickelodeon.	3-6	30	Jonny Belt	2011	2023	f	6	5	High	High	High	Moderate-High	High	High	High	\N	{TV}	{Elementary-Basics,Teamwork,Science,Math,"Problem Solving","Sing Along",Literacy,Social-Emotional,Numeracy,"Cognitive Development"}	3D CGI animation set in an underwater world. Extremely bright and vivid colors with high saturation.	https://m.media-amazon.com/images/M/MV5BNWVkM2EwNGMtOWRmNi00Y2IxLThlNDMtZWE4N2YyYmFiMDkzXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
28	Blippi	Blippi is an American character on YouTube. Blippi videos are aimed at young children, and are educational. Blippi is a likable character and children love him. His special forté is his silly dancing. He has videos about everything from farms, tractors and bin lorries, to museums and theme parks. He introduces all sorts of concepts to children in a really fun, happy way. He even has a music album with his songs from his videos, such as 'Im an excavator'.	2-5	30	Blippi Toys	2014	\N	t	\N	5	High	High	High	High	High	High	High	\N	{YouTube}	{Animals,Nature,Adventure,"Early Childhood experiences",Hyper-Activity,Shapes,Vocabulary,Curiosity,"Sing Along",Colours,"Silly Comedy",Dance,"Natural World",Preschool-Basics,Exploration,"Creativity & Imagination"}	Live-Action with Bright Colors and Real-World Settings	https://m.media-amazon.com/images/M/MV5BMTc0Yzc5ZDgtZmU5YS00Y2MzLTg3MTMtY2UxMGZmMjM4OTQyXkEyXkFqcGc@._V1_SX300.jpg	14000000	1188	UC-Gm4EN7nNNR3k67J8ywF4g	t	2015-07-06T12:32:14Z	t	f	f
124	Lazytown	A pink-haired girl named Stephanie moves to LazyTown with her uncle (the mayor of said town) where she tries to teach its extremely lazy residents that physical activity is beneficial.	3-6	24	Magnús Scheving	2002	2014	t	\N	5	High	High	High	High	High	High	High	\N	{TV}	{"Physical Fitness","Positive Role Models","Healthy Eating",Teamwork,"Problem Solving",Exercise,"Motor Skills","Sing Along",Dance,Perseverance}	Combination of live-action, puppetry, and CGI elements. Color Palette: Bright and vivid colors with high contrast	/media/tv-shows/show-124.jpg	\N	\N	\N	f	\N	f	f	f
172	One Piece	There once lived a pirate named Gol D. Roger. He obtained wealth, fame, and power to earn the title of Pirate King. When he was captured and about to be executed, he revealed that his treasure called One Piece was hidden somewhere at the Grand Line. This made all people set out to search and uncover the One Piece treasure, but no one ever found the location of Gol D. Roger's treasure, and the Grand Line was too dangerous a place to overcome. Twenty-two years after Gol D. Roger's death, a boy named Monkey D. Luffy decided to become a pirate and search for Gol D. Roger's treasure to become the next Pirate King.	12+	24	Eiichirô Oda	1999	\N	t	1500	5	Moderate	High	High	Moderate-High	High	High	Moderate-High	\N	{TV}	{"Cultures & Traditions","Creativity & Imagination","Complex & Emotional Themes",Teamwork,Perseverance,Morality,Entertainment,Humor,"Slapstic Comedy","Emotional Intelligence",Friendship,Social-Emotional,Adventure,"Mild Violent themes","Mild Fantasy Violence","Mild Peril","Mild Mature Themes"}	Traditional 2D Animation with a distinctive anime style, featuring exaggerated expressions, dynamic action sequences, and detailed environments.	/media/tv-shows/show-172.jpg	\N	\N	\N	f	\N	f	f	f
328	Creature Cases	Follows the adventures of Sam Snow and Kit Casey, agents of CLADE: the Covert League of Animal Detective Experts. In a world populated exclusively by animals, these brilliant sleuths travel the globe solving mind-boggling mysteries that mix real zoological facts with wild detective action.	3-8 years	11	Gabe Pulliam	2022	\N	t	4	4	Moderate	Moderate-High	Medium	Moderate-High	Moderate	Moderate	Moderate	\N	{}	{"Creativity & Imagination",Preschool-Basics,Mystery,Animals,"Animal Behavior",Nature,"Problem Solving",Teamwork,Curiosity,Humor,Friendship}	3D CGI	https://m.media-amazon.com/images/M/MV5BY2Y5ZmI2ZDMtN2QxYi00ZjUwLWJiNGUtMzk4ZWZkOTEzMWNiXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
60	Cyberchase	CYBERCHASE takes kids on a wild ride through cyberspace where they are challenged to use the power of math in a classic good-versus-evil battle. When the dastardly villain Hacker (played deliciously by Christopher Lloyd) launches a mad mission to conquer the virtual universe, Motherboard calls upon three Earth kids for help. They are Jackie, Matt and Inez - the heroes of CYBERCHASE - who travel from their real-world realm, along with the wise-cracking cyber-bird Digit (comic actor Gilbert Gottfried), to the colorful virtual vistas of cyberspace where they vanquish the bad guys in an all-out battle of wits. Each episode takes the kids on a thrilling adventure driven by a different math concept - from tackling time in ancient Egyptian tombs, to cracking codes in creepy caves, or making sense of numbers in a fractured fairy tale world. In their quest, the heroes use minds, not muscles, to overcome obstacles and danger everywhere. Every episode of CYBERCHASE concludes with a "For Real" live action segment in which a young comic actor encounters a situation which reinforces the math concept explored in the animated story line.	8-12	30	\N	2002	\N	t	15	4	High	Moderate-High	High	Moderate-High	High	High	Moderate	\N	{TV}	{Science,Math,Entertainment,"Problem Solving","Critical Thinking",STEM}	traditional 2D hand-drawn animation. Digital in later series.	https://m.media-amazon.com/images/M/MV5BOWZhZTgxMDAtMGFlZi00NmM2LWFhNzYtZGE1NzM0ZmU1OGY5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
63	Davey and Goliath	In this stop-action animated series, young Davey Hansen and his best friend (and dog) Goliath live ordinary suburban American lives. In each episode, Davey and Goliath experience some form of moral conflict either in themselves or in their friends. Drawing upon the guidance of his parents, his teachers, and his own religious beliefs, Davey doesn't always do the right thing, but he does always come away from the experience having learned valuable moral and life lessons.	4-8	30	\N	1960	2004	f	5	2	Moderate	Moderate	Low	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Family Values","Cause and Effect","Life Lessons",Responsibility,Morality,"Emotional Intelligence",Religion}	Stop-Motion Animation using clay figures	https://m.media-amazon.com/images/M/MV5BZTEwM2I4NWMtNjZmOS00OWE2LTk2MWItYWFhZDZmNWMwMjg4XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
75	Dragon Ball	What starts off as a bizarre re-telling of the Chinese legend "Journey to the West" quickly transforms into pure madness. On a twisted version of Earth, the ridiculously strong child-fighter Son Gokû is joined by several companions in the quest for the seven "dragon balls", which, when assembled, will summon the Grand Dragon, who will grant the bearer of the balls one single wish. The problem is, the Grand Dragon can only be invoked once a year, and villains battle Goku and friends constantly for possession of the Dragon Balls.	10-16	30	\N	1986	1989	f	1	5	Low	High	High	High	High	High	High	\N	{TV}	{"Martial Arts",Adventure,"Positive Role Models","Mild Violent themes",Morality,Entertainment,"Fantasy Elements","Mild Peril","Super Hero Themes","Mild Fantasy Violence"}	2D Hand-drawn animation (Anime style).	https://m.media-amazon.com/images/M/MV5BMGQ0ZWE4NDYtYWY0Mi00MjE0LWI1MzctZDA1NGExYzE3N2FiXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
152	Molly of Denali	An action-adventure comedy that follows the adventures of feisty and resourceful 10-year-old Molly Mabray, an Alaska Native girl, her dog Suki, and friends Tooey and Trini on their adventures in epically beautiful Alaska.	4-8	15	Kathy Waugh	2019	\N	t	4	3	High	Moderate-High	Moderate	Moderate	Moderate	Moderate-High	Moderate	\N	{TV}	{STEM,"Cultures & Traditions","Cultural & Social","Cultural Appreciation","Problem Solving",Adventure,Exploration,Nature,"Natural World",Mystery}	2D Digital Animation with cultural representation. Color Palette: Bright colors reflecting Alaskan landscapes.	/media/tv-shows/show-152.jpeg	\N	\N	\N	f	\N	f	f	f
145	Minuscule	A children's TV show	0-13+	15	Thomas Szabo	2006	\N	t	\N	1	Low	Low	High	Low-Moderate	High	High	Moderate	\N	{YouTube}	{"Slice of Life",Nature,ASMR,Entertainment,"Light Hearted","Story Telling without Dialogue","Insect Behaviour","Silly Comedy",Music,"Nature Sounds","Natural World",Relaxation,"Enviromental Awareness",Ecosystems,"Creativity & Imagination",Humor}	Combination of CGI and Real-Life Backdrops	/media/tv-shows/show-145.png	\N	\N	\N	f	\N	f	f	f
79	Elena of Avalor	Teenage princess Elena has saved her magical kingdom, Avalor, from an evil sorceress and must now learn to rule as its crown princess. Elena's adventures will lead her to understand that her new role requires thoughtfulness, resilience and compassion, the traits of all truly great leaders. Since she is only 16 years old, she has a Grand Council comprised of her grandparents, older cousin Chancellor Esteban and a new friend, Naomi, to give advice along the way. Elena also looks to her younger sister Isabel, her friends Mateo and Gabe, and a trio of magical flying creatures called jaquins for guidance and support.	5-9	30	Craig Gerber	2016	2020	f	3	4	Moderate	High	High	Moderate-High	High	High	High	\N	{TV}	{"Cultural Appreciation",Leadership,"Positive Role Models",Responsibility,Morality,"Emotional Intelligence","Cultures & Traditions"}	3D CGI Animation with detailed designs. Color Palette: Bright and vibrant colors with cultural motifs.	https://m.media-amazon.com/images/M/MV5BMjY1NjNjOTktZjVhMy00ZDdkLTkzNmQtZDI5NmIwODA0MDQ2XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
130	Little Angel	Little Angel is an animated musical show for pre-schoolers. The show has been captivating families around the world with its cheeky humor and catchy upbeat songs.	1-4	3	\N	2022	\N	t	1	5	High	Moderate-High	High	Moderate-High	High	High	Moderate-High	\N	{TV}	{Preschool-Basics,Numeracy,Literacy,Routine,Social-Emotional,"Sing Along","Cognitive Development","Repetitive Learning"}	3D CGI animation with bright and vivid colors.	/media/tv-shows/show-130.jpg	\N	\N	\N	f	\N	f	f	f
83	Fireman Sam	Sam the fireman is one of several firefighters stationed in the Welsh village of Pontypandy. Despite its small population, the village regularly suffers from fires and other dangers. The local firefighters have to respond to these dangers and keep the village safe.	4-8	30	\N	1987	2024	f	15	2	Low-Moderate	Moderate	Low-Moderate	Moderate	Moderate	Low-Moderate	Low	\N	{TV}	{"Community Service",Teamwork,"Positive Role Models",Responsibility,"Problem Solving",Safety}	Traditional Stop-Motion animation	/media/tv-shows/show-image-1748360384586-67946245-optimized.jpg	\N	\N	\N	f	\N	t	f	f
84	Fireman Sam	Sam the fireman is one of several firefighters stationed in the Welsh village of Pontypandy. Despite its small population, the village regularly suffers from fires and other dangers. The local firefighters have to respond to these dangers and keep the village safe.	4-8	30	\N	1987	2024	f	15	4	Low-Moderate	Moderate	Moderate-High	Moderate	Moderate	Moderate	Moderate-High	\N	{TV}	{"Community Service",Teamwork,"Positive Role Models",Responsibility,"Problem Solving",Safety}	Traditional Stop-Motion animation	https://m.media-amazon.com/images/M/MV5BYjExMzkwYmUtOTg0ZS00MWMzLWIwYzUtYzgyMzU4ZmYxM2U5XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
140	Masha and the Bear	Masha and the Bear are heroes of Russian folklore, known to all Russian children. Just that in the series they are different and live in the modern world, which gave the creators from Animaccord Animation Studio the ability to bring new possibilities to their interactions. Series tell us about a unique relationship between two main characters. Masha is an exceedingly active little girl who can't sit still on one place and has to make everything a business of her own. The Bear is a big and hearty guy who loves comfort and quietness. After their first met the Bear is always in anticipation for another fun and wild adventure that Masha will surely pull him in. Every 7-minute high-quality 3D CGI animated episode includes original music and songs and the series is largely played out through action with little dialog making it easy for children around the world to understand.	3-7	759	Oleg Kuzovkov	2007	\N	t	5	5	Low-Moderate	Moderate	High	Moderate-High	High	High	High	\N	{TV}	{"Creativity & Imagination",Friendship,"Problem Solving",Patience,Humor,"Mischievious Behaviour"}	3D CGI animation with high-quality, detailed visuals	/media/tv-shows/show-140.jpg	\N	\N	\N	f	\N	f	f	f
85	Franklin	The popular children's books, written by Paulette Bourgeois, come alive in this television series about a turtle named Franklin. Each episode has a story of Franklin and his friends. You'll meet his parents, Bear (his best friend), Goose, Beaver, Rabbit, Mr. Owl, Badger and Snail along with other animal friends. You will follow the adventures of Franklin as he learns about the world around him, and how to be an honest turtle with good character.	4-8	30	\N	1997	2006	f	6	1	Low-Moderate	Moderate	Low	Low	Low-Moderate	Low	Low	\N	{TV}	{"Relatable Situations","Problem Solving",Social-Emotional,Friendship}	Traditional Hand-drawn 2D animation	https://m.media-amazon.com/images/M/MV5BZTc5OTE3NjYtYzkzZC00NmM4LTgwNjMtNDAyNjMwYzk0MzExXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
98	Guess How Much I Love You	The 'Guess How Much I Love You animated series is set in a timeless watercolour landscape of grassy fields, mossy forests, lazy rivers and sunny green valleys. It's an innocent, picture-book world of butterflies, flowers, whimsy and wonder. This is the idyllic home of Little Nutbrown Hare and his father, Big Nutbrown Hare. The series follows their adventures as they explore their beautiful surrounds, play with their friends and delight in the love between them. Always ready to play and laugh, Little Nutbrown Hare bounds through his days with whisker-twitching curiosity. The ever patient Big Nutbrown Hare lovingly leads his son on journeys of discovery -- discovery of the joys that nature holds. Fun-loving Little Field Mouse and mischievous Little Grey Squirrel often join them on their adventures and not too far away they might encounter tricky Little Redwood Fox, or Little White Owl with her tall tales of mystery and magic. Together they explore the meadows, forests and streams - playing, laughing and discovering the wonder that the world holds.	2-5	30	\N	2012	\N	t	3	2	Moderate	Low-Moderate	Low	Low-Moderate	Moderate	Low	Moderate	\N	{TV}	{"Family Values",Social-Emotional,"Emotional Intelligence",Friendship}	2D Digital Animation with a watercolor aesthetic. Color Palette: Soft and natural colors with pastel hues.	https://m.media-amazon.com/images/M/MV5BMzljMDViOTgtNmE2Yi00MjBkLTk2YWEtZTAxODIxNGEwZTNiXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
126	Leo the wildlife ranger	Join Leo and friends as they go on exciting adventures around the world and explore exotic locations and learn fun facts about animals and nature!	3-7	15	\N	2015	\N	t	\N	4	Low-Moderate	High	Medium	Moderate	Moderate-High	Moderate	Moderate-High	\N	{YouTube}	{Animals,Nature,Responsibility,Curiosity,"Problem Solving","Natural World","Wildlife Exploration","Wildlife Conservation","Animal Behaviour"}	3D CGI animation with detailed depictions of animals and environments.	/media/tv-shows/show-126.webp	\N	\N	\N	f	\N	f	f	f
286	Tweedy & Fluff	Tweedy is a little toy made from tweed cloth, living alone in a weaver's cottage until the arrival of Fluff - a four-legged ball of woolly fuzz who becomes his beloved pet.	2-5	30	Corrinne Averiss	2023	\N	t	\N	1	Low-Moderate	Low	Medium	Low-Moderate	Moderate-High	Moderate	Low	\N	{YouTube}	{"Relatable Situations","Slice of Life","Pet Ownership",Empathy,"Life Lessons",Stop-Motion,"Gentle Humour","Communication and Expression","Problem Solving",Friendship,"Exploring Emotions"}	Traditional stop-frame animation techniques, meticulously capturing each movement of the handcrafted puppets frame by frame to create fluid and engaging motion.	/media/tv-shows/show-image-1748363372438-580483907-optimized.jpg	2440	79		t	2023-09-19T16:00:24.985688Z	t	t	f
110	In the Night Garden	A toddler/infant adventure garden which tip-toes between the twilight state of a child being awake and moving through to a state of sleep. It is somewhat psychedelic, yet to a child it is fun, imaginative, colourful and, as the programme comes to a close, relaxing and sweet.	1-4	30	\N	2007	2009	f	3	1	Low	Low	Low	Low	Low	High	Low	\N	{TV}	{"Sensory Exploration","Motor Skills","Repetitive Learning",Preschool-Basics,"Cognitive Development"}	Live-action costume performances combined with CGI-enhanced environments	https://m.media-amazon.com/images/M/MV5BYjJlZDRlNjUtZGRjNS00YjBjLWFkYjEtZDU0OTM2OWY3NDIxXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
97	Grizzy and the Lemmings	The forest ranger's house is the only area of human civilization in the middle of untamed wilderness in a vast natural reserve in Canada. When the ranger is away, a bear named Grizzy feels that the ranger's house is his territory, given that bears sit at the top of the food chain. After making his way inside the home, Grizzy takes advantage of all the modern conveniences there, including a comfortable sofa, air conditioning and fully equipped kitchen. He's not alone, though, because a group of small creatures called lemmings also populate the ranger's house when he is away. Because Grizzy and the lemmings are not civilized enough to live together in peace, it becomes an atmosphere of madness when the two sides try to outdo each other with tricks.	6-10	30	Josselin Charier, Antoine Rodelet	2016	2024	f	4	5	Low	Low	High	High	High	High	High	\N	{TV}	{"Slapstic Comedy",Entertainment,"Problem Solving","Communiction & Expression","Mild Fantasy Violence",Humor,"Mischievious Behaviour"}	3D CGI animation	https://m.media-amazon.com/images/M/MV5BMGQ0NTE5YWUtMWZkNy00MjMwLTkwYWItYWY1Mzk5YTlhNGQ4XkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
107	Horrid Henry	For Horrid Henry, life is just not fair! He feels that the rest of the world is against him and he wages a constant war against the tyranny of adults. Like any headstrong young boy, he is determined, relentless, he doesn't hold back and he never admits defeat! He will stop at nothing to outwit the enemy and teachers, relatives and babysitters avoid him at all costs. Even his parents argue over whose turn it is to look after him! Henry is endearingly straight forward and lives for the moment, he'll wolf down his little brother Peter's chocolates before even thinking of an alibi! He doesn't try to be truly horrid, it just comes naturally! He's still young, however, and can be scared by talk of ghosts or monsters. The school doctor's syringe reduces him to a quivering heap! Although Henry is certainly proud of himself, he never learns from his mistakes. Henry indulges in fantasies, transforms into terrifying creatures to match his frustrations and often has 'Eureka moments' when he has what he thinks is a spectacularly wonderful idea. In every story, there is something Henry has to get or do (or occasionally avoid doing) and the ensuing chaos is the consequence of this overriding desire. When he thinks of a plan it is simple to get his own way, never to make trouble purely for its own sake. He takes life very seriously and he sincerely believes in what he is doing. No wonder his favorite saying is ... 'it's not fair!!!!'	6-10	11	Francesca Simon	2006	2021	t	6	4	Low-Moderate	High	High	Moderate-High	High	High	High	\N	{TV}	{"Creativity & Imagination","Cause and Effect",Morality,Humor,Entertainment,"Mischievious Behaviour"}	2D Digital Animation with bold lines and exaggerated expressions. Color Palette: Bright and vivid colors with high contrast	/media/tv-shows/show-107.jpg	\N	\N	\N	f	\N	f	f	f
101	Handyman Hal	Handyman Hal is a family friendly show that takes you on entertaining and educational adventures. Follow Handyman Hal as he makes repairs and learns how things work. Would you like to go behind the scenes at a fire station? Want t...	3-8	30	\N	2022	\N	t	\N	4	Moderate	High	High	Moderate-High	High	High	High	\N	{YouTube}	{Mechanics,"Cultural Appreciation","Engineering Concepts","Farm Life","Life Lessons",Entertainment,"Vehicle Themes",Curiosity,Safety,Agriculture,"Cultures & Traditions",Humor,STEM}	Primarily live-action with occasional animated elements to highlight tools or processes.	/media/tv-shows/show-image-1748362678049-718993150-optimized.jpg	\N	\N	\N	f	\N	t	f	f
13	Avatar: The Last Airbender	The world is divided into four elemental nations: The Northern and Southern Water Tribes, the Earth Kingdom, the Fire Nation, and the Air Nomads. The Avatar upholds the balance between the nations, but everything changed when the Fire Nation invaded. Only the Avatar, master of all four elements, can stop them. But when the world needs him most, he vanishes. A hundred years later Katara and Sokka discover the new Avatar, an airbender named Aang. Together they must help Aang master the elements and save the world.	8-14	30	Michael Dante DiMartino	2005	2008	t	3	5	Low-Moderate	High	High	Moderate	Moderate-High	High	High	\N	{YouTube}	{"Martial Arts","Cultural Appreciation",Teamwork,"Life Lessons",Responsibility,Perseverance,Morality,Entertainment,"Fantasy Elements","Mild Peril","Emotional Intelligence",Friendship,"Mild Fantasy Violence","Cultures & Traditions"}	2D animation inspired by anime styles.	https://m.media-amazon.com/images/M/MV5BMDMwMThjYWYtY2Q2OS00OGM2LTlkODQtNDJlZTZmMjAyYmFhXkEyXkFqcGc@._V1_SX300.jpg	189000	531	UC5UxQbRoUOSlDfE6PXpIz0g	t	2022-10-03T09:08:08.008054Z	t	t	f
22	Bear in the Big Blue House	Bear lives in a Big Blue House with several of his muppet friends: Treelo the lemur, Ojo the bear cub, Tutter the mouse, and Pip and Pop the otters. Every day bear uses his reassuringly shaggy presence to help solve problems and explore a different topic of the day (for instance "finding" or "helping"). He also frequently talks to his other friends, Shadow, who tells stories and sings nursery rhymes, and Luna the moon, who helps provide 'The Big Picture'.	2-5	30	Mitchell Kriegman	1997	2006	f	5	2	High	Moderate	Low-Moderate	Low-Moderate	Low-Moderate	Low	Low-Moderate	\N	{TV}	{"Bedtime Routines","Relatable Situations","Problem Solving","Social Development","Sing Along",Social-Emotional,"Emotional Intelligence",Routine,Friendship}	Live-action costumed puppetry with detailed sets. 	https://m.media-amazon.com/images/M/MV5BMjdlMTRiM2UtMDFkOS00OTkxLTgxODAtNTk3MmUzM2U4ODRhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
102	He-Man and the Masters of the Universe	In a distant and mystical land, wimpy Prince Adam leads the life of royalty. Unknown to all but a few close friends/allies, Prince Adam is actually a hero, the mighty He-Man. Together with his friends, (such as Teela; her father, a man-at-arms; mysterious Orko and his mighty friend/horse substitute Battle Cat), He-Man battles the evil Skeletor and his minions for control of the world, and, more importantly, for the control, power and "honor of Greyskull," the mysterious castle from which He-Man derives his powers.	8-12	30	\N	1983	1985	f	2	4	Low-Moderate	Moderate-High	High	Moderate-High	High	High	Moderate-High	\N	{TV}	{Adventure,"Positive Role Models",Responsibility,"Mild Violent themes",Morality,Entertainment,"Fantasy Elements","Super Hero Themes","Mild Fantasy Violence","Recurring Antagonist"}	Traditional 2D Animation with action-oriented designs. Color Palette: Bright and vivid colors with bold contrasts.	https://m.media-amazon.com/images/M/MV5BYzAxYzg1YmUtMzJkOS00NGEyLTkyM2MtNTk1NzE4MTQ1MDUwXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
322	Blaze and the Monster Machines	AJ is an 8-year-old techie who drives monster-truck Blaze, the top racer in Axle City. The two go on adventures that have them taking on problems involving science and math. Many predicaments they face are caused by Blaze's rival, Crusher, a tractor-trailer that will do anything to beat other vehicles to the finish line, who also has his own subplots in some episodes featuring his boyfriend Pickle. The animated series is billed as the first TV show for preschoolers to comprehensively cover areas of science, technology, engineering and math. Most episodes introduce different STEM concepts, including but not limited to buoyancy and trajectory.	3-6 years	30	N/A	2014	2025	t	9	5	Moderate	Moderate-High	High	High	High	High	Moderate-High	\N	{YouTube}	{STEM,Protagonist,"Recurring Antagonist","Problem Solving","Engineering Concepts"}	3D animation with bright and high contrasting colours	/media/tv-shows/show-322.jpg	6450000	1669	UCmWZB57dUwFfj847-4y63JA	t	2020-01-03T17:05:27.412018Z	f	f	f
188	Play School	This television show for babies aims to encourage viewers to wonder, to think, to feel and to imagine. The program shows two warm, caring people taking the time to be with one child. They address the child directly and personally. Into this relationship are woven the stories, songs and activities that form the fabric of Australian children's culture. Play School is successful because it satisfies our basic human need to interact with other people and to be valued by them. Play School aims to extend the child's interest and it encourages participation. Each program contains a story, some songs (both traditional and new) and a variety of play ideas with things to make and do. Each week has a theme which is developed in different ways depending on the day. The daily format usually includes the Clock and a look outside Play School via the Windows. More recently the Play School projector is also used for a mindfulness segment asking viewers to stop, look and listen.	2-5	25	\N	1966	\N	t	59	2	High	Moderate	Low-Moderate	Moderate	Moderate-High	Low-Moderate	Moderate	\N	{TV}	{"Creativity & Imagination",Preschool-Basics,Numeracy,Literacy,Shapes,Colours,Social-Emotional,"Problem Solving","Sing Along"}	Live-action with real actors.	/media/tv-shows/show-188.webp	\N	\N	\N	f	\N	f	f	f
274	The Wiggles	Welcome to The Wiggles YouTube channel, where you'll find all types of fun toddler tunes - from playful kids songs and classic nursery rhymes, to educational children's music and exciting dance tracks! Join us on a musical journey designed to engage young minds and promote early learning. With colourful performances and interactive content, we aim to create a joyful learning experience for children. Little ones will develop essential skills while having a blast! Across our videos, you'll get to know each of The Wiggles: Tsehay; Lachy; Simon; Anthony; Caterina; John; Evie and Lucia - as well as all our Wiggly friends: Dorothy the Dinosaur; Wags the Dog; Henry the Octopus, Captain Feathersword, and of course, The Tree of Wisdom! Subscribe now and let us fill your child's world with laughter, imagination, and the magic of music. #TheWiggles #KidsSongs #NurseryRhymes #toddler	1-4	30	Murray Cook	2007	2022	t	6	4	High	High	Moderate-High	High	High	Moderate-High	Moderate	\N	{YouTube}	{"Physical Fitness","Motor Skills",Entertainment,"Sing Along",Music,Dance,Preschool-Basics,Social-Emotional}	Live-Action with Bright Colors and Simple Settings	https://m.media-amazon.com/images/M/MV5BYTMwMTEyNjQtNTMzMy00MDU0LTg0NGUtODYyNGU5NmYyM2EyXkEyXkFqcGc@._V1_SX300.jpg	6230000	959		t	2007-04-04T14:19:48Z	t	t	f
41	Canticos	Canticos brings the tradition and culture of nursery rhymes to families through lovable characters, and fun sing-along the whole family can enjoy in English and Spanish providing an innovative learning experience.	1-5	30	\N	2018	\N	t	3	3	High	Moderate-High	Medium	Moderate-High	High	Moderate	Moderate-High	\N	{TV}	{"Cultural Appreciation","Cultural & Social","Sing Along",Literacy,Music,"Language Learning","Cultures & Traditions"}	Digital 2D animation with a simple, storybook-inspired art style. The characters are designed with soft, rounded features and bright, pastel colors, reflecting the show's musical and educational focus. The animation often incorporates interactive elements, encouraging audience participation.	/media/tv-shows/show-image-1748357858106-525834991-optimized.jpg	\N	\N	\N	f	\N	t	f	f
34	Booba	Booba is cute and inquisitive, like a five-year-old kid. He explores the world without anger or resentment, only joy and wonder. He doesn't talk, although he does make sounds to express his emotions. Nobody knows where he came from, but he has obviously missed the last 100 years of human progress and explores modern locations with boundless energy and enthusiasm. His awkward movements, combined with a strong desire to learn more about the world around him, often have hilarious results. However, this doesn't satisfy Booba's curiosity, so his adventures will continue in the upcoming series.	3-6	30	\N	2014	\N	t	5	4	Moderate	Low	High	Moderate-High	High	High	High	\N	{TV}	{"Early Childhood experiences","Motor Skills","Social Development","Sing Along",Dance,Social-Emotional,"Emotional Intelligence",Friendship,"Creativity & Imagination",Humor}	3D CGI animation with realistic textures and environments.	https://m.media-amazon.com/images/M/MV5BNmM3NGQ3OWQtMTcxMS00MTI1LWEyN2QtYWJkYjYyNDIzYzNhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
268	The Mik Maks	A children's TV show	2-6	15	\N	\N	\N	t	\N	5	High	Moderate-High	Medium	Moderate-High	High	Moderate	Moderate	\N	{YouTube}	{"Learning through Songs",Elementary-Basics,Phonics,"Family Values",Exercise,"Motor Skills",Vocabulary,Entertainment,"Sing Along","Silly Comedy",Music,Dance,Preschool-Basics,"Family Relationships",Instruments}	Live-Action Performances with Colorful Costumes and Sets. Some 2D animations	/media/tv-shows/show-268.jpg	\N	\N	\N	f	\N	f	f	f
115	JunyTony - Songs and Stories	A children's TV show	2-6	15	\N	\N	\N	t	\N	4	High	High	High	High	High	High	High	\N	{YouTube}	{"Creativity & Imagination","Learning from Mistakes","Learning through Songs","Cultures & Traditions","Cultural Appreciation",Literacy,Numeracy,"Sing Along",Dance,Phonics,Vocabulary,Music,Routine,Social-Emotional}	2D Animation with Vibrant Colors and Cute Characters	/media/tv-shows/show-115.jpeg	\N	\N	\N	f	\N	f	f	f
200	Ready, Steady, Wiggle!	Ready, Steady, Wiggle is a brand new series from the early childhood entertainment specialists, The Wiggles. Featuring brand new songs, along with fresh interpretations of classics.	1-4	11	Anthony Field	2013	2024	t	6	5	High	High	High	High	High	High	Moderate	\N	{TV}	{"Physical Fitness",Elementary-Basics,"Sing Along",Dance,Music,Friendship,"Motor Skills","Repetitive Learning",Entertainment,Numeracy,Literacy,Social-Emotional}	Live-Action with Bright Colors and Simple Settings	/media/tv-shows/show-200.jpg	\N	\N	\N	f	\N	f	f	f
155	Mother goose club	Mother Goose Club breathes new life into classic nursery rhyme characters to promote early literacy, mathematics, and more! Join in as they dance, sing, twirl, and rhyme through these catchy songs that are as educational as they are fun.	2-5	15	\N	2009	\N	t	\N	4	High	High	Moderate	Moderate	High	Moderate	Moderate	\N	{YouTube}	{Preschool-Basics,"Learning through Songs","Creativity & Imagination",Literacy,Numeracy,"Language Learning","Speech Development","Sing Along",Dance,Music,"Cognitive Development"}	Live-Action with Colorful Costumes and Simple Sets	/media/tv-shows/show-155.jpg	\N	\N	\N	f	\N	f	f	f
123	Laurie Berkner	A children's TV show	2-6	15	\N	\N	\N	t	\N	3	Low-Moderate	Moderate-High	Moderate	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Learning through Songs","Physical Fitness","Early Childhood experiences",Music,"Sing Along",Social-Emotional,Literacy,Entertainment,Dance}	Live-Action with Colorful Green Screen Animations	/media/tv-shows/show-123.jpg	\N	\N	\N	f	\N	f	f	f
128	LifeKids (Blinky’s Bible adventures)	LifeKids is the children’s ministry of Life.Church for kids birth—6th grade (ages 0—12 years). Kids love our fun, age-appropriate videos, Christ centered activities, small group connections, and family resources. We are passionate about to partnering with parents to lead children to become fully devoted followers of Christ! \nTo learn more about our ministry and to check out kid-friendly videos without YouTube distractions, visit  \nIf you’re a pastor or church leader, use this entire curriculum 1...	0-13+	15	LifeKids	2012	\N	t	\N	2	High	Moderate	Low	Moderate	Moderate	Low	Low-Moderate	\N	{YouTube}	{"Religious Teachings","Cultures & Traditions","Cultural & Social","Cause and Effect","Life Lessons","Spiritual Development",Religion,"Family Relationships","Relatable Situations",Social-Emotional,Morality,"Sing Along","Repetitive Learning",Dance}	Combination of Live-Action and 2D Animation. Color Palette: Bright and primary colors.	/media/tv-shows/show-128.png	271000	951	UCcGvV66gr1IItGbbBodqc7A	t	2012-06-25T20:17:10Z	f	f	f
233	Super Simple Song	A children's TV show	2-5	15	\N	\N	\N	t	\N	4	High	Moderate-High	Medium	Moderate	High	Moderate	Low-Moderate	\N	{YouTube}	{"Learning through Songs","Motor Skills",Shapes,Vocabulary,"Story Telling without Dialogue","Social Development","Sing Along",Colours,Literacy,Music,Dance,Preschool-Basics,Social-Emotional,Numeracy,"Language Learning","Cognitive Development"}	2D and 3D Animation with Bright Colors and Simple Characters	/media/tv-shows/show-233.jpeg	\N	\N	\N	f	\N	f	f	f
65	DG Bible Songs	A children's TV show	3-8	15	\N	\N	\N	t	\N	3	Moderate	Moderate	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Biblical Stories","Cultural Appreciation","Family Values","Religious Teachings","Christian Values","Sing Along",Music,Social-Emotional,Faith,"Spiritual Development",Religion,"Cultures & Traditions"}	high-quality animation and music	/media/tv-shows/show-65.png	\N	\N	\N	f	\N	f	f	f
148	Ms Moni	A children's TV show	2-5	15	\N	\N	\N	t	\N	3	High	Moderate-High	Medium	Moderate	High	Moderate	Low-Moderate	\N	{YouTube}	{"Learning through Songs",Phonics,"Early Childhood experiences",Vocabulary,"Sing Along",Literacy,Music,"Auslan (Sign Language)",Preschool-Basics,Numeracy,"Language Learning","Cognitive Development"}	Live-Action and 2D Animation	/media/tv-shows/show-148.png	\N	\N	\N	f	\N	f	f	f
147	Miss Katie Sings	A children's TV show	2-6	15	\N	\N	\N	t	\N	2	Moderate	Moderate	Medium	Moderate	High	Moderate	Low	\N	{YouTube}	{"Learning through Songs","Cultural & Social","Positve Mindset","Politcal Leanings","Communiction & Expression","Sing Along",Music,Social-Emotional,Mindfulness,Diversity,Courage}	Live-Action Performances with Simple Props and Backgrounds	/media/tv-shows/show-147.jpg	\N	\N	\N	f	\N	f	f	f
44	Casper Babypants	A children's TV show	1-5	15	\N	\N	\N	t	\N	2	Moderate	Moderate	Medium	Moderate	High	Low-Moderate	Low-Moderate	\N	{YouTube}	{Phonics,"Sensory Exploration","Bedtime Routines","Motor Skills","Repetitive Learning",Vocabulary,"Sing Along",Literacy,Music,Dance,Relaxation,Preschool-Basics,Numeracy,Routine,"Language Learning","Cognitive Development"}	Simple Animations or Live-Action with Gentle Imagery	/media/tv-shows/show-44.jpg	\N	\N	\N	f	\N	f	f	f
56	Cosmic kids yoga	Using adventure stories, the instructor talks kids through different yoga poses.	3-8	30	\N	2012	2017	f	\N	3	High	High	Medium	Moderate	Moderate-High	Moderate	Moderate	\N	{YouTube}	{"Sensory Exploration",Exercise,"Life Lessons","Positve Mindset","Sing Along","Positive Engaging Screen-Time",Yoga,Relaxation,Mindfulness,"Emotional Intelligence",Routine}	Live-Action with Colorful Green Screen Animations	/media/tv-shows/show-56.jpg	\N	\N	\N	f	\N	t	f	f
99	Gullah, Gullah Island	Hosts Ron and Natalie Daise, a warm and loving African-American couple who live on a sea island off the coast of South Carolina, open their home to preschoolers and their caregivers with a rich mix of song, games, stories, dance and humor. The sing-along series stimulates active participation from viewers around such familiar topics as birthdays, jokes, baby animals, rhyming, collecting and preparing food. With the Daises and their three children at the heart of the show, a variety of friends, relatives, neighborhood children and a bright-yellow tree frog named Binyah Binyah Pollywog (a full body puppet) form an extended family with viewers. Each episode also features an exploration of the unique culture of the Sea Island region with an up-close look at the community and its people, including artists, fishermen, weavers and farmers.	3-7	30	Kathleen Minton	1994	1998	f	4	3	High	Moderate-High	Medium	Moderate-High	High	Moderate	Moderate	\N	{TV}	{"Cultural Appreciation","Life Lessons","Cultural & Social","Social Development","Sing Along",Music,Dance,Social-Emotional,"Cultures & Traditions"}	Live-Action with musical elements. Color Palette: Bright and vibrant colors reflecting the cultural setting.	https://m.media-amazon.com/images/M/MV5BYzM2YWYzNTUtYTk4ZS00NGJhLThhMGItZWUwZTBlNjIxYmZhXkEyXkFqcGc@._V1_SX300.jpg	\N	\N	\N	f	\N	t	f	f
5	Akili and Me	Akili is a four-year-old who lives in the Savannah highlands in Kilimanjaro. Every time she goes to sleep, she finds herself in a magic world called Lala Land. With the help of her new best friends in Lala Land, Akili goes on adventures where she learns English words, how to draw, count, and so much more.	3-6	30	Akili and Me	2016	\N	t	\N	3	High	High	Medium	Moderate	High	Moderate	Moderate	\N	{YouTube}	{"Early Childhood experiences",Exercise,"Life Lessons","Cultural & Social","Motor Skills",Shapes,"Repetitive Learning","Sing Along",Colours,Literacy,Music,Preschool-Basics,Social-Emotional,Numeracy,"Language Learning","Cultures & Traditions","Creativity & Imagination","Cognitive Development"}	2D digital animation with a hand-drawn look. Bright and cheerful colors with simple backgrounds	/media/tv-shows/show-image-1748363878084-27141263-optimized.jpg	1070000	1036		t	2016-02-12T17:33:01Z	t	t	f
51	Cloudbabies	Cloudbabies is an adorable animated series about four enchanting, childlike characters, Baba Pink, Baba Blue, Baba Yellow and Baba Green whose job is to look after the sky and their Sky Friends, Sun, Moon, Rainbow, Fuffa Cloud and Little Star. They live together with Bobo White, a mischievous little Sky Imp, in a house on a big fluffy Cloud. Every morning, they jump on their Skyhorsies and begin their days work of looking after the sky.	2-5	30	\N	2012	2013	f	\N	2	Moderate	Moderate	Low-Moderate	Moderate	Moderate-High	Low-Moderate	Low-Moderate	\N	{YouTube}	{Nature,"Natural Science",Teamwork,"Bedtime Routines",Responsibility,"Social Development","Sing Along","Natural World",Relaxation,"Enviromental Awareness",Social-Emotional,Routine}	3D CGI Animation with a soft aesthetic. Color Palette: Pastel colors and gentle hues.	/media/tv-shows/show-image-1748363923726-58960340-optimized.jpg	\N	\N	\N	f	\N	t	f	f
62	Danny Go!	Music! Dancing! Learning! Bears! 🤸🏻‍♂️🐻👨🏻‍🔬💃\n“Danny Go!” is a live-action educational children’s show filled with music, movement and silliness. Created in 2019 by 3 childhood friends in Charlotte, North Carolina, the show inspires learning and off-the-couch exercise for kids ages 3 to 7. \nHere’s what you’ll find in our videos: \n +  Catchy, upbeat dance-along songs that kids AND parents can enjoy together\n +  Kindergarten-level learning (math basics, vocabulary, science experiments)\n +  B...	3-7	30	Danny Go!	2020	\N	t	\N	5	High	High	High	High	High	High	High	\N	{YouTube}	{"Cultural Appreciation",Phonics,"Physical Fitness",Exercise,"Repetitive Learning",Entertainment,"Sing Along",Music,Dance,Preschool-Basics,"Interactive Game Elements","Creativity & Imagination"}	Live-Action with Bright Colors and Interactive Elements	/media/tv-shows/show-image-1748363940496-353869218-optimized.jpg	3140000	120	UC3wCAOfSB0W9iuKDDtNJeGw	t	2019-07-31T03:03:39Z	t	f	f
\.


--
-- Data for Name: user_points_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_points_history (id, user_id, points, activity_type, description, created_at, reference_id) FROM stdin;
3	8	-5	review_deleted_by_admin	Points deducted for review of A for Adley removed by admin	2025-05-22 09:52:08.485722	\N
4	8	-5	review_deleted_by_admin	Points deducted for review of Cocomelon removed by admin	2025-05-22 09:53:40.471203	\N
5	8	-5	review_deleted_by_admin	Points deducted for review of Unknown show removed by admin	2025-05-22 09:56:50.60487	\N
6	8	2	add_favorite	Added Tweedy & Fluff to favorites	2025-05-22 10:08:20.29161	\N
7	8	2	add_favorite	Added Beep and Mort to favorites	2025-05-22 10:16:08.365197	\N
8	8	2	add_favorite	Added Tweedy & Fluff to favorites	2025-05-22 10:29:10.61532	\N
9	8	2	add_favorite	Added Tweedy & Fluff to favorites	2025-05-22 10:29:53.315933	\N
10	8	2	add_favorite	Added Tweedy & Fluff to favorites	2025-05-22 10:33:28.893373	\N
13	7	1	upvote_given	Upvoted a review	2025-05-22 11:36:14.054268	\N
14	8	5	upvote_received	Your review received an upvote	2025-05-22 11:36:14.054268	\N
15	7	1	upvote_given	Upvoted a review	2025-05-22 11:51:46.657621	\N
16	8	5	upvote_received	Your review received an upvote	2025-05-22 11:51:46.657621	\N
17	8	5	review	Review of Dinosaur train	2025-05-22 12:13:29.912866	\N
18	8	5	review	Review of Blaze and the Monster Machines	2025-05-22 12:13:30.00626	\N
19	8	5	review	Review of Amakandu	2025-05-22 12:13:30.080586	\N
20	8	5	review	Review of Bluey 2018-present	2025-05-22 12:13:30.140065	\N
21	8	5	review	Review of Tweedy & Fluff	2025-05-22 12:13:30.197741	\N
22	7	1	upvote_given	Upvoted a review	2025-05-22 12:40:38.678394	\N
23	8	2	upvote_received	Your review received an upvote	2025-05-22 12:40:38.678394	\N
89	8	5	login_reward	Daily login reward	2025-05-25 09:46:36.711	\N
27	8	1	upvote_given	Upvoted a review	2025-05-22 13:15:54.208515	\N
28	7	2	upvote_received	Your review received an upvote	2025-05-22 13:15:54.208515	\N
29	8	1	upvote_given	Upvoted a review	2025-05-22 13:44:39.688942	\N
30	7	2	upvote_received	Your review received an upvote	2025-05-22 13:44:39.688942	\N
90	7	5	login_reward	Daily login reward	2025-05-25 11:03:31.379	\N
38	8	5	review	Review of Dinosaur train	2025-05-22 14:07:41.58126	11
55	15	1	upvote_given	Upvoted a review of Ada Twist, Scientist	2025-05-22 14:58:29.414215	\N
56	7	2	upvote_received	Your review of Ada Twist, Scientist received an upvote	2025-05-22 14:58:29.414215	\N
44	15	5	review	Review of Tweedy & Fluff	2025-05-22 14:18:05.022594	18
57	8	5	login_reward	Daily login reward	2025-05-23 01:18:29.083	\N
68	8	5	research_read	Read a research summary (ID: 56)	2025-05-24 11:34:27.678718	\N
54	7	5	review	Review of Ada Twist, Scientist	2025-05-22 14:48:33.369571	20
49	7	5	review	Review of A for Adley	2025-05-22 14:24:34.952675	19
43	15	5	login_reward	Daily login reward - TEST	2025-05-22 14:10:56.149689	\N
45	7	1	upvote_given	Upvoted a review	2025-05-22 14:18:52.666278	\N
46	15	2	upvote_received	Your review received an upvote	2025-05-22 14:18:52.666278	\N
50	15	1	upvote_given	Upvoted a review	2025-05-22 14:25:23.008233	\N
51	7	2	upvote_received	Your review received an upvote	2025-05-22 14:25:23.008233	\N
32	7	5	review	Review of The Berenstein Bears	2025-05-22 13:57:36.85559	17
58	1	5	login_reward	Daily login reward	2025-05-23 13:46:52.86	\N
47	8	1	upvote_given	Upvoted a review	2025-05-22 14:20:17.45805	\N
48	15	2	upvote_received	Your review received an upvote	2025-05-22 14:20:17.45805	\N
91	7	5	research_read	Read a research summary (ID: 89)	2025-05-25 14:16:43.763887	89
59	1	5	login_reward	Daily login reward	2025-05-24 09:49:48.03	\N
60	8	5	login_reward	Daily login reward	2025-05-24 11:27:58.545	\N
33	7	5	review	Review of Bear in the Big Blue House	2025-05-22 13:57:36.917808	16
64	8	5	research_read	Read a research summary (ID: 69)	2025-05-24 11:28:12.00464	\N
65	8	5	research_read	Read a research summary (ID: 68)	2025-05-24 11:30:37.895882	\N
66	8	5	research_read	Read a research summary (ID: 55)	2025-05-24 11:33:07.678718	\N
73	8	5	research_read	Read a research summary (ID: 60)	2025-05-24 11:39:44.709872	\N
52	15	5	login_reward	Daily login reward	2025-05-22 14:29:48.61	\N
34	7	5	review	Review of Avatar: The Last Airbender	2025-05-22 13:57:36.982511	15
53	7	5	login_reward	Daily login reward	2025-05-22 14:30:25.676	\N
103	1	5	login_reward	Daily login reward	2025-05-27 12:34:05.15	\N
92	7	5	login_reward	Daily login reward	2025-05-26 19:01:07.643	\N
93	18	5	login_reward	Daily login reward	2025-05-26 21:13:31.677	\N
77	8	5	research_read	Read a research summary (ID: 63)	2025-05-24 11:44:53.079135	\N
87	7	5	research_read	Read a research summary (ID: 53)	2025-05-24 12:09:07.999549	\N
95	18	1	upvote_given	Upvoted a review of Blaze and the Monster Machines	2025-05-26 21:38:14.75437	\N
96	8	2	upvote_received	Your review of Blaze and the Monster Machines received an upvote	2025-05-26 21:38:14.75437	\N
39	8	5	review	Review of Blaze and the Monster Machines	2025-05-22 14:07:41.664218	9
40	8	5	review	Review of Amakandu	2025-05-22 14:07:41.752897	8
94	18	5	review	Review of Amakandu	2025-05-26 21:32:31.500742	22
41	8	5	review	Review of Bluey	2025-05-22 14:07:41.858598	7
42	8	5	review	Review of Tweedy & Fluff	2025-05-22 14:07:41.936295	5
25	7	5	review	Review of Amakandu	2025-05-22 12:58:09.064203	14
102	7	5	login_reward	Daily login reward	2025-05-27 09:15:01.561	\N
84	8	5	review	Review of Alphablocks	2025-05-24 12:03:45.365308	21
24	7	5	review	Review of Blaze and the Monster Machines	2025-05-22 12:42:05.361314	13
104	1	1	upvote_given	Upvoted a review of Tweedy & Fluff	2025-05-27 12:51:42.838856	\N
85	7	5	login_reward	Daily login reward	2025-05-24 12:07:06.675	\N
88	7	5	research_read	Read a research summary (ID: 54)	2025-05-24 12:11:42.716636	54
105	18	2	upvote_received	Your review of Tweedy & Fluff received an upvote	2025-05-27 12:51:42.838856	\N
97	18	5	research_read	Read a research summary (ID: 96)	2025-05-26 21:40:36.275106	96
98	18	5	research_read	Read a research summary (ID: 94)	2025-05-26 21:42:46.394783	94
99	18	5	research_read	Read a research summary (ID: 89)	2025-05-26 21:43:14.0771	89
100	18	5	research_read	Read a research summary (ID: 82)	2025-05-26 21:43:35.713603	82
106	1	1	upvote_given	Upvoted a review of Tweedy & Fluff	2025-05-27 12:51:52.474952	\N
107	15	2	upvote_received	Your review of Tweedy & Fluff received an upvote	2025-05-27 12:51:52.474952	\N
108	1	1	upvote_given	Upvoted a review of Tweedy & Fluff	2025-05-27 12:51:53.287184	\N
109	8	2	upvote_received	Your review of Tweedy & Fluff received an upvote	2025-05-27 12:51:53.287184	\N
110	17	5	login_reward	Daily login reward	2025-05-27 12:58:29.724	\N
111	18	5	login_reward	Daily login reward	2025-05-27 13:52:22.367	\N
101	18	5	review	Review of Tweedy & Fluff	2025-05-26 21:51:53.59024	23
112	1	5	login_reward	Daily login reward	2025-05-28 09:03:07.353	\N
113	7	5	login_reward	Daily login reward	2025-05-28 09:07:31.79	\N
114	8	5	login_reward	Daily login reward	2025-05-28 11:31:09.434	\N
115	8	5	research_read	Read a research summary (ID: 96)	2025-05-28 11:56:26.621848	96
116	18	5	login_reward	Daily login reward	2025-05-28 14:13:04.48	\N
\.


--
-- Data for Name: user_read_research; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_read_research (id, user_id, research_id, read_at) FROM stdin;
1	8	69	2025-05-24 11:28:12.00464
2	8	68	2025-05-24 11:30:37.895882
4	8	56	2025-05-24 11:34:27.437378
9	8	60	2025-05-24 11:39:39.972744
12	8	63	2025-05-24 11:44:53.079135
13	8	64	2025-05-24 11:48:42.865477
14	8	66	2025-05-24 11:52:57.148836
15	8	53	2025-05-24 11:56:41.261257
16	8	67	2025-05-24 11:57:18.048609
17	8	65	2025-05-24 12:02:08.460269
18	8	62	2025-05-24 12:02:33.332903
19	7	53	2025-05-24 12:07:19.446178
20	7	54	2025-05-24 12:11:42.678065
21	7	89	2025-05-25 14:16:43.730949
22	18	96	2025-05-26 21:40:36.241889
23	18	94	2025-05-26 21:42:46.358216
24	18	89	2025-05-26 21:43:14.029716
25	18	82	2025-05-26 21:43:35.672156
26	8	96	2025-05-28 11:56:26.585994
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, is_admin, username, country, is_approved, created_at, total_points, rank, login_streak, last_login, background_color) FROM stdin;
1	admin@tvtantrum.com	1b9c9b00ba3dbb251e4d5899b31fcfd131bf3236eacb3e222e4fb05acf6e7cc6556eebf00c2e4768f3fd0062f4d59d1b8cbf9b846067de807fbb4bf9e8eb35a1.5e347645754eebf4dc6de7443867dc52	t	admin	\N	t	2025-05-08 09:40:38.47081	23	TV Watcher	0	2025-05-28 13:41:59.527	bg-purple-500
8	uschooler1@gmail.com	7178f5d381201a4f6158446536bd5502300fa7279b64bfb6560031731a1b00a6accffaf436079af17d5b5a6c59aa23a69c62535d9580041d43e52d91b3f1416e.402449d0c5cefdc5d74067604960f608	f	uschooler	United Kingdom	t	2025-05-13 13:51:14.949	129	TV Viewer	0	2025-05-28 11:31:09.434	bg-purple-500
7	haseeb@uschooler.com	21050e60163d242a2da2a4b008c5e6e76404bc5d971d5e5c163da1229e2f89faa2e58528be4bcafe14a6a6da2e5e5c78c4aad49bf93816c43f747c4fb842a955.18086f7fe1ff9a2e23031dd33bbdd217	f	haseeb	United Kingdom	t	2025-05-13 13:17:32.16	92	TV Watcher	0	2025-05-28 12:32:36.34	bg-yellow-500
15	ipthaseeb@hotmail.com	348ba1e2c7f06df3dbf9efb23fdb4e7f2dd5a4b3d3130ef3bd8b1c32235d6fa3a73e1bb23a02a2206a332b5640a2438d00f56d93dd534e03b5848239638eaabf.bd5aec6a03a164b5694dccb77c6fb683	f	haseeb1		t	2025-05-14 11:25:53.427	28	TV Watcher	0	2025-05-22 14:57:59.866	bg-purple-500
16	manjit@mookers.co.uk	92da6865270293de56ae59f07dfb93719abbaf2442f3a98032b06a0dd9d6bb2e16bd349fc3665aa5a62f1d759a66879a50253dd5b4e7e375b7713838bd31ea36.35120d40432f9ad4df6f78a4cc6f5058	f	manjit		t	2025-05-14 11:29:17.191	0	TV Watcher	0	\N	bg-purple-500
17	andrewnonomus@gmail.com	447b29c942787a5215d543c699a11fcc9e147279d5cbd04067ee1537061578b426f929c9a17d883ec3900701aa2119c5a3409c0b2c3142e2cdaf11bcf471cdf5.47659329d00179921c559f7abac8a132	t	Luke		t	2025-05-19 14:22:01.475	5	TV Watcher	0	2025-05-27 19:55:31.742	bg-purple-500
18	tobias.jacobs425@dontsp.am	d361b5d228af61a6c2fb90a50a80beebb7c41d0b964ec457b6264a3d6cb30cbc42eb8a63adba292455082865f5415bb7beb9466c7caa1def6d28f800e46d674a.0aa5e954f57a44b2e757aab1dd7ae36a	f	H4z4ko		t	2025-05-19 14:24:46.563	48	TV Watcher	0	2025-05-28 14:13:04.48	bg-purple-500
\.


--
-- Data for Name: youtube_channels; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.youtube_channels (id, tv_show_id, channel_id, subscriber_count, video_count, published_at) FROM stdin;
1	12	UCJDyqaoyVtWKhCiTPZVOoyA	825000	778	2007-12-09T14:44:06Z
2	8	UCvn4PVcIgJ19HZzTljPZqnA	412000	216	2021-03-15T13:01:34.802011Z
3	9	UCnMc4j7Pg961kzmguZ43esg	15	14	2017-04-08T05:57:44Z
4	108	UCxnRe3y0u35HnuYAp9FmBGQ	2900000	343	2018-12-10T18:26:31Z
5	138		13200000	988	2020-12-27T05:59:33.722121Z
6	1	UCBJuxfqZuiibvcwSc8ViGsQ	7890000	732	2017-10-04T21:19:39Z
7	165	UCUamVL0L_lgG720vqmdZqoA	1850000	110	2021-06-15T20:07:03.401512Z
8	3		529000	160	2019-03-02T02:30:25Z
9	279	UCWQLkOZV1aHXB0ihn2EwSbw	342000	747	2014-03-11T16:30:20Z
10	322	UCmWZB57dUwFfj847-4y63JA	6430000	1663	2020-01-03T17:05:27.412018Z
11	2	UCa02LVGQWJBa7U8kzcljL2w	279	11	2021-08-15T11:19:30.304842Z
12	6	UCrGZmQKbTNOIeXhyhpIqP2g	187	12	2024-02-08T11:22:41.342226Z
13	128	UCcGvV66gr1IItGbbBodqc7A	271000	951	2012-06-25T20:17:10Z
14	13	UC5UxQbRoUOSlDfE6PXpIz0g	187000	524	2022-10-03T09:08:08.008054Z
15	14	UC6X4scOCUwpKFZUsCwv4mfw	158000	301	2022-01-31T02:04:10.38046Z
16	4	UCFuU-5B1eKAWaTeLUu3JuyA	1290000	1354	2016-11-03T14:10:13Z
17	7	UC_qs3c0ehDvZkbiEbOj6Drg	3140000	1728	2015-01-15T10:40:49Z
18	11		53200	168	2014-05-24T03:15:24Z
19	5	UC0TLvo891eEEM6HGC5ON7ug	1060000	1034	2016-02-12T17:33:01Z
\.


--
-- Name: applied_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.applied_migrations_id_seq', 5, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.favorites_id_seq', 14, true);


--
-- Name: platforms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.platforms_id_seq', 2, true);


--
-- Name: research_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.research_summaries_id_seq', 96, true);


--
-- Name: review_upvotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.review_upvotes_id_seq', 21, true);


--
-- Name: show_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.show_submissions_id_seq', 1, false);


--
-- Name: themes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.themes_id_seq', 603, true);


--
-- Name: tv_show_platforms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_show_platforms_id_seq', 312, true);


--
-- Name: tv_show_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_show_reviews_id_seq', 23, true);


--
-- Name: tv_show_searches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_show_searches_id_seq', 169, true);


--
-- Name: tv_show_themes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_show_themes_id_seq', 2570, true);


--
-- Name: tv_show_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_show_views_id_seq', 303, true);


--
-- Name: tv_shows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tv_shows_id_seq', 328, true);


--
-- Name: user_points_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_points_history_id_seq', 116, true);


--
-- Name: user_read_research_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_read_research_id_seq', 26, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: youtube_channels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.youtube_channels_id_seq', 19, true);


--
-- Name: applied_migrations applied_migrations_migration_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applied_migrations
    ADD CONSTRAINT applied_migrations_migration_name_key UNIQUE (migration_name);


--
-- Name: applied_migrations applied_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applied_migrations
    ADD CONSTRAINT applied_migrations_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: platforms platforms_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_name_key UNIQUE (name);


--
-- Name: platforms platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_pkey PRIMARY KEY (id);


--
-- Name: research_summaries research_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.research_summaries
    ADD CONSTRAINT research_summaries_pkey PRIMARY KEY (id);


--
-- Name: review_upvotes review_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_upvotes
    ADD CONSTRAINT review_upvotes_pkey PRIMARY KEY (id);


--
-- Name: review_upvotes review_upvotes_user_id_review_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_upvotes
    ADD CONSTRAINT review_upvotes_user_id_review_id_key UNIQUE (user_id, review_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: show_submissions show_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.show_submissions
    ADD CONSTRAINT show_submissions_pkey PRIMARY KEY (id);


--
-- Name: themes themes_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_name_key UNIQUE (name);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: tv_show_platforms tv_show_platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_platforms
    ADD CONSTRAINT tv_show_platforms_pkey PRIMARY KEY (id);


--
-- Name: tv_show_platforms tv_show_platforms_tv_show_id_platform_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_platforms
    ADD CONSTRAINT tv_show_platforms_tv_show_id_platform_id_key UNIQUE (tv_show_id, platform_id);


--
-- Name: tv_show_reviews tv_show_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_reviews
    ADD CONSTRAINT tv_show_reviews_pkey PRIMARY KEY (id);


--
-- Name: tv_show_searches tv_show_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_searches
    ADD CONSTRAINT tv_show_searches_pkey PRIMARY KEY (id);


--
-- Name: tv_show_themes tv_show_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_themes
    ADD CONSTRAINT tv_show_themes_pkey PRIMARY KEY (id);


--
-- Name: tv_show_themes tv_show_themes_tv_show_id_theme_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_themes
    ADD CONSTRAINT tv_show_themes_tv_show_id_theme_id_key UNIQUE (tv_show_id, theme_id);


--
-- Name: tv_show_views tv_show_views_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_views
    ADD CONSTRAINT tv_show_views_pkey PRIMARY KEY (id);


--
-- Name: tv_shows tv_shows_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_shows
    ADD CONSTRAINT tv_shows_pkey PRIMARY KEY (id);


--
-- Name: tv_show_searches unique_tv_show_id; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_searches
    ADD CONSTRAINT unique_tv_show_id UNIQUE (tv_show_id);


--
-- Name: user_points_history user_points_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_points_history
    ADD CONSTRAINT user_points_history_pkey PRIMARY KEY (id);


--
-- Name: user_read_research user_read_research_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_read_research
    ADD CONSTRAINT user_read_research_pkey PRIMARY KEY (id);


--
-- Name: user_read_research user_read_research_user_id_research_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_read_research
    ADD CONSTRAINT user_read_research_user_id_research_id_key UNIQUE (user_id, research_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: youtube_channels youtube_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.youtube_channels
    ADD CONSTRAINT youtube_channels_pkey PRIMARY KEY (id);


--
-- Name: youtube_channels youtube_channels_tv_show_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.youtube_channels
    ADD CONSTRAINT youtube_channels_tv_show_id_key UNIQUE (tv_show_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_review_upvotes_review_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_review_upvotes_review_id ON public.review_upvotes USING btree (review_id);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: idx_show_submissions_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_show_submissions_user_id ON public.show_submissions USING btree (user_id);


--
-- Name: idx_tv_show_reviews_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tv_show_reviews_user_id ON public.tv_show_reviews USING btree (user_id);


--
-- Name: idx_user_points_history_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_points_history_user_id ON public.user_points_history USING btree (user_id);


--
-- Name: idx_user_read_research_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_read_research_user_id ON public.user_read_research USING btree (user_id);


--
-- Name: favorites fk_favorites_tv_show; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_favorites_tv_show FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: favorites fk_favorites_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tv_show_reviews fk_reviews_tv_show; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_reviews
    ADD CONSTRAINT fk_reviews_tv_show FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: review_upvotes review_upvotes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_upvotes
    ADD CONSTRAINT review_upvotes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.tv_show_reviews(id) ON DELETE CASCADE;


--
-- Name: review_upvotes review_upvotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_upvotes
    ADD CONSTRAINT review_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: show_submissions show_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.show_submissions
    ADD CONSTRAINT show_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tv_show_platforms tv_show_platforms_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_platforms
    ADD CONSTRAINT tv_show_platforms_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE;


--
-- Name: tv_show_platforms tv_show_platforms_tv_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_platforms
    ADD CONSTRAINT tv_show_platforms_tv_show_id_fkey FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: tv_show_searches tv_show_searches_tv_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_searches
    ADD CONSTRAINT tv_show_searches_tv_show_id_fkey FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: tv_show_themes tv_show_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_themes
    ADD CONSTRAINT tv_show_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: tv_show_themes tv_show_themes_tv_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_themes
    ADD CONSTRAINT tv_show_themes_tv_show_id_fkey FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: tv_show_views tv_show_views_tv_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tv_show_views
    ADD CONSTRAINT tv_show_views_tv_show_id_fkey FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: user_points_history user_points_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_points_history
    ADD CONSTRAINT user_points_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_read_research user_read_research_research_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_read_research
    ADD CONSTRAINT user_read_research_research_id_fkey FOREIGN KEY (research_id) REFERENCES public.research_summaries(id) ON DELETE CASCADE;


--
-- Name: user_read_research user_read_research_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_read_research
    ADD CONSTRAINT user_read_research_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: youtube_channels youtube_channels_tv_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.youtube_channels
    ADD CONSTRAINT youtube_channels_tv_show_id_fkey FOREIGN KEY (tv_show_id) REFERENCES public.tv_shows(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

