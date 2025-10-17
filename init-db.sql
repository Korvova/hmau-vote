--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."_MeetingParticipants" DROP CONSTRAINT IF EXISTS "_MeetingParticipants_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_MeetingParticipants" DROP CONSTRAINT IF EXISTS "_MeetingParticipants_A_fkey";
ALTER TABLE IF EXISTS ONLY public."_MeetingDivisions" DROP CONSTRAINT IF EXISTS "_MeetingDivisions_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_MeetingDivisions" DROP CONSTRAINT IF EXISTS "_MeetingDivisions_A_fkey";
ALTER TABLE IF EXISTS ONLY public."Vote" DROP CONSTRAINT IF EXISTS "Vote_voteResultId_fkey";
ALTER TABLE IF EXISTS ONLY public."Vote" DROP CONSTRAINT IF EXISTS "Vote_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Vote" DROP CONSTRAINT IF EXISTS "Vote_agendaItemId_fkey";
ALTER TABLE IF EXISTS ONLY public."VoteResult" DROP CONSTRAINT IF EXISTS "VoteResult_procedureId_fkey";
ALTER TABLE IF EXISTS ONLY public."VoteResult" DROP CONSTRAINT IF EXISTS "VoteResult_meetingId_fkey";
ALTER TABLE IF EXISTS ONLY public."VoteResult" DROP CONSTRAINT IF EXISTS "VoteResult_agendaItemId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Queue" DROP CONSTRAINT IF EXISTS "Queue_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Queue" DROP CONSTRAINT IF EXISTS "Queue_meetingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Proxy" DROP CONSTRAINT IF EXISTS "Proxy_toUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."Proxy" DROP CONSTRAINT IF EXISTS "Proxy_meetingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Proxy" DROP CONSTRAINT IF EXISTS "Proxy_fromUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."ParticipantLocation" DROP CONSTRAINT IF EXISTS "ParticipantLocation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ParticipantLocation" DROP CONSTRAINT IF EXISTS "ParticipantLocation_meetingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Meeting" DROP CONSTRAINT IF EXISTS "Meeting_voteProcedureId_fkey";
ALTER TABLE IF EXISTS ONLY public."FormSubmission" DROP CONSTRAINT IF EXISTS "FormSubmission_formId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeviceLink" DROP CONSTRAINT IF EXISTS "DeviceLink_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."AgendaItem" DROP CONSTRAINT IF EXISTS "AgendaItem_speakerId_fkey";
ALTER TABLE IF EXISTS ONLY public."AgendaItem" DROP CONSTRAINT IF EXISTS "AgendaItem_meetingId_fkey";
DROP INDEX IF EXISTS public."_MeetingParticipants_B_index";
DROP INDEX IF EXISTS public."_MeetingDivisions_B_index";
DROP INDEX IF EXISTS public."User_username_key";
DROP INDEX IF EXISTS public."User_username_idx";
DROP INDEX IF EXISTS public."User_televicExternalId_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_email_idx";
DROP INDEX IF EXISTS public."ScreenConfig_type_key";
DROP INDEX IF EXISTS public."Queue_meetingId_userId_type_key";
DROP INDEX IF EXISTS public."Queue_meetingId_type_status_idx";
DROP INDEX IF EXISTS public."Queue_meetingId_type_position_idx";
DROP INDEX IF EXISTS public."Proxy_meetingId_toUserId_idx";
DROP INDEX IF EXISTS public."Form_ownerChatId_idx";
DROP INDEX IF EXISTS public."Form_isActive_idx";
DROP INDEX IF EXISTS public."FormSubmission_formId_idx";
DROP INDEX IF EXISTS public."FormSubmission_createdAt_idx";
DROP INDEX IF EXISTS public."DeviceLink_userId_key";
DROP INDEX IF EXISTS public."DeviceLink_deviceId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."_MeetingParticipants" DROP CONSTRAINT IF EXISTS "_MeetingParticipants_AB_pkey";
ALTER TABLE IF EXISTS ONLY public."_MeetingDivisions" DROP CONSTRAINT IF EXISTS "_MeetingDivisions_AB_pkey";
ALTER TABLE IF EXISTS ONLY public."Vote" DROP CONSTRAINT IF EXISTS "Vote_pkey";
ALTER TABLE IF EXISTS ONLY public."VoteTemplate" DROP CONSTRAINT IF EXISTS "VoteTemplate_pkey";
ALTER TABLE IF EXISTS ONLY public."VoteResult" DROP CONSTRAINT IF EXISTS "VoteResult_pkey";
ALTER TABLE IF EXISTS ONLY public."VoteProcedure" DROP CONSTRAINT IF EXISTS "VoteProcedure_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserExtraDivision" DROP CONSTRAINT IF EXISTS "UserExtraDivision_userId_divisionId_key";
ALTER TABLE IF EXISTS ONLY public."UserExtraDivision" DROP CONSTRAINT IF EXISTS "UserExtraDivision_pkey";
ALTER TABLE IF EXISTS ONLY public."ScreenConfig" DROP CONSTRAINT IF EXISTS "ScreenConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."Queue" DROP CONSTRAINT IF EXISTS "Queue_pkey";
ALTER TABLE IF EXISTS ONLY public."Proxy" DROP CONSTRAINT IF EXISTS "Proxy_pkey";
ALTER TABLE IF EXISTS ONLY public."Proxy" DROP CONSTRAINT IF EXISTS "Proxy_meetingId_fromUserId_key";
ALTER TABLE IF EXISTS ONLY public."ParticipantLocation" DROP CONSTRAINT IF EXISTS "ParticipantLocation_pkey";
ALTER TABLE IF EXISTS ONLY public."ParticipantLocation" DROP CONSTRAINT IF EXISTS "ParticipantLocation_meetingId_userId_key";
ALTER TABLE IF EXISTS ONLY public."Meeting" DROP CONSTRAINT IF EXISTS "Meeting_pkey";
ALTER TABLE IF EXISTS ONLY public."Form" DROP CONSTRAINT IF EXISTS "Form_pkey";
ALTER TABLE IF EXISTS ONLY public."FormSubmission" DROP CONSTRAINT IF EXISTS "FormSubmission_pkey";
ALTER TABLE IF EXISTS ONLY public."DurationTemplate" DROP CONSTRAINT IF EXISTS "DurationTemplate_pkey";
ALTER TABLE IF EXISTS ONLY public."Division" DROP CONSTRAINT IF EXISTS "Division_pkey";
ALTER TABLE IF EXISTS ONLY public."DeviceLink" DROP CONSTRAINT IF EXISTS "DeviceLink_pkey";
ALTER TABLE IF EXISTS ONLY public."Contact" DROP CONSTRAINT IF EXISTS "Contact_pkey";
ALTER TABLE IF EXISTS ONLY public."AgendaItem" DROP CONSTRAINT IF EXISTS "AgendaItem_pkey";
ALTER TABLE IF EXISTS public."VoteTemplate" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."VoteResult" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."VoteProcedure" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Vote" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."UserExtraDivision" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."User" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."ScreenConfig" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Queue" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Proxy" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."ParticipantLocation" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Meeting" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."DurationTemplate" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Division" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."DeviceLink" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Contact" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."AgendaItem" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."_MeetingParticipants";
DROP TABLE IF EXISTS public."_MeetingDivisions";
DROP SEQUENCE IF EXISTS public."Vote_id_seq";
DROP SEQUENCE IF EXISTS public."VoteTemplate_id_seq";
DROP TABLE IF EXISTS public."VoteTemplate";
DROP SEQUENCE IF EXISTS public."VoteResult_id_seq";
DROP TABLE IF EXISTS public."VoteResult";
DROP SEQUENCE IF EXISTS public."VoteProcedure_id_seq";
DROP TABLE IF EXISTS public."VoteProcedure";
DROP TABLE IF EXISTS public."Vote";
DROP SEQUENCE IF EXISTS public."User_id_seq";
DROP SEQUENCE IF EXISTS public."UserExtraDivision_id_seq";
DROP TABLE IF EXISTS public."UserExtraDivision";
DROP TABLE IF EXISTS public."User";
DROP SEQUENCE IF EXISTS public."ScreenConfig_id_seq";
DROP TABLE IF EXISTS public."ScreenConfig";
DROP SEQUENCE IF EXISTS public."Queue_id_seq";
DROP TABLE IF EXISTS public."Queue";
DROP SEQUENCE IF EXISTS public."Proxy_id_seq";
DROP TABLE IF EXISTS public."Proxy";
DROP SEQUENCE IF EXISTS public."ParticipantLocation_id_seq";
DROP TABLE IF EXISTS public."ParticipantLocation";
DROP SEQUENCE IF EXISTS public."Meeting_id_seq";
DROP TABLE IF EXISTS public."Meeting";
DROP TABLE IF EXISTS public."FormSubmission";
DROP TABLE IF EXISTS public."Form";
DROP SEQUENCE IF EXISTS public."DurationTemplate_id_seq";
DROP TABLE IF EXISTS public."DurationTemplate";
DROP SEQUENCE IF EXISTS public."Division_id_seq";
DROP TABLE IF EXISTS public."Division";
DROP SEQUENCE IF EXISTS public."DeviceLink_id_seq";
DROP TABLE IF EXISTS public."DeviceLink";
DROP SEQUENCE IF EXISTS public."Contact_id_seq";
DROP TABLE IF EXISTS public."Contact";
DROP SEQUENCE IF EXISTS public."AgendaItem_id_seq";
DROP TABLE IF EXISTS public."AgendaItem";
DROP TYPE IF EXISTS public."VoteType";
DROP TYPE IF EXISTS public."VoteChoice";
DROP TYPE IF EXISTS public."ScreenType";
DROP TYPE IF EXISTS public."QuorumType";
DROP TYPE IF EXISTS public."QueueType";
DROP TYPE IF EXISTS public."QueueStatus";
DROP TYPE IF EXISTS public."MeetingStatus";
DROP TYPE IF EXISTS public."FormSuccessType";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: FormSuccessType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FormSuccessType" AS ENUM (
    'PAGE',
    'REDIRECT'
);


--
-- Name: MeetingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MeetingStatus" AS ENUM (
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED'
);


--
-- Name: QueueStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QueueStatus" AS ENUM (
    'WAITING',
    'ACTIVE',
    'COMPLETED'
);


--
-- Name: QueueType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QueueType" AS ENUM (
    'QUESTION',
    'SPEECH'
);


--
-- Name: QuorumType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuorumType" AS ENUM (
    'MORE_THAN_ONE',
    'TWO_THIRDS_OF_TOTAL',
    'HALF_PLUS_ONE'
);


--
-- Name: ScreenType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ScreenType" AS ENUM (
    'REGISTRATION',
    'AGENDA',
    'VOTING',
    'FINAL'
);


--
-- Name: VoteChoice; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VoteChoice" AS ENUM (
    'FOR',
    'AGAINST',
    'ABSTAIN'
);


--
-- Name: VoteType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VoteType" AS ENUM (
    'OPEN',
    'CLOSED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AgendaItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AgendaItem" (
    id integer NOT NULL,
    number integer NOT NULL,
    title text NOT NULL,
    "speakerId" integer,
    "meetingId" integer NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    voting boolean DEFAULT false NOT NULL,
    "activeIssue" boolean DEFAULT false NOT NULL,
    "speakerName" text
);


--
-- Name: AgendaItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AgendaItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AgendaItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AgendaItem_id_seq" OWNED BY public."AgendaItem".id;


--
-- Name: Contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contact" (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Contact_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Contact_id_seq" OWNED BY public."Contact".id;


--
-- Name: DeviceLink; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeviceLink" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "deviceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DeviceLink_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DeviceLink_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DeviceLink_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DeviceLink_id_seq" OWNED BY public."DeviceLink".id;


--
-- Name: Division; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Division" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Division_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Division_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Division_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Division_id_seq" OWNED BY public."Division".id;


--
-- Name: DurationTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DurationTemplate" (
    id integer NOT NULL,
    name text NOT NULL,
    "durationInSeconds" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DurationTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DurationTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DurationTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DurationTemplate_id_seq" OWNED BY public."DurationTemplate".id;


--
-- Name: Form; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Form" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerChatId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    fields jsonb NOT NULL,
    "successType" public."FormSuccessType" DEFAULT 'PAGE'::public."FormSuccessType" NOT NULL,
    "successContent" text,
    "redirectUrl" text,
    "groupId" text,
    "assigneeChatId" text,
    "labelId" text,
    status text DEFAULT 'Inbox'::text NOT NULL,
    "observerChatId" text,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: FormSubmission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FormSubmission" (
    id text NOT NULL,
    "formId" text NOT NULL,
    data jsonb NOT NULL,
    "taskId" text,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Meeting" (
    id integer NOT NULL,
    name text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    status public."MeetingStatus" DEFAULT 'WAITING'::public."MeetingStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "voteProcedureId" integer,
    "questionQueueEnabled" boolean DEFAULT true NOT NULL,
    "speechQueueEnabled" boolean DEFAULT true NOT NULL,
    "screenConfig" jsonb,
    "showVoteOnBroadcast" boolean DEFAULT false,
    "quorumType" public."QuorumType",
    "timerDuration" integer,
    "timerStartedAt" timestamp without time zone,
    "timerActive" boolean DEFAULT false,
    "televicMeetingId" integer,
    "createInTelevic" boolean DEFAULT false NOT NULL
);


--
-- Name: Meeting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Meeting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Meeting_id_seq" OWNED BY public."Meeting".id;


--
-- Name: ParticipantLocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ParticipantLocation" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "userId" integer NOT NULL,
    location text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ParticipantLocation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ParticipantLocation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ParticipantLocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ParticipantLocation_id_seq" OWNED BY public."ParticipantLocation".id;


--
-- Name: Proxy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Proxy" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "fromUserId" integer NOT NULL,
    "toUserId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: Proxy_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Proxy_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Proxy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Proxy_id_seq" OWNED BY public."Proxy".id;


--
-- Name: Queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Queue" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "userId" integer NOT NULL,
    type public."QueueType" NOT NULL,
    status public."QueueStatus" DEFAULT 'WAITING'::public."QueueStatus" NOT NULL,
    "position" integer NOT NULL,
    "timerSeconds" integer,
    "timerEndTime" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Queue_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Queue_id_seq" OWNED BY public."Queue".id;


--
-- Name: ScreenConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScreenConfig" (
    id integer NOT NULL,
    type public."ScreenType" NOT NULL,
    config jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ScreenConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ScreenConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ScreenConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ScreenConfig_id_seq" OWNED BY public."ScreenConfig".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "divisionId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "televicExternalId" text,
    username text,
    "isBadgeInserted" boolean DEFAULT false NOT NULL
);


--
-- Name: UserExtraDivision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserExtraDivision" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "divisionId" integer NOT NULL
);


--
-- Name: UserExtraDivision_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."UserExtraDivision_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: UserExtraDivision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."UserExtraDivision_id_seq" OWNED BY public."UserExtraDivision".id;


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Vote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vote" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "agendaItemId" integer NOT NULL,
    choice public."VoteChoice" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "voteResultId" integer
);


--
-- Name: VoteProcedure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteProcedure" (
    id integer NOT NULL,
    name text NOT NULL,
    conditions jsonb NOT NULL,
    "resultIfTrue" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VoteProcedure_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteProcedure_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: VoteProcedure_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."VoteProcedure_id_seq" OWNED BY public."VoteProcedure".id;


--
-- Name: VoteResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteResult" (
    id integer NOT NULL,
    "agendaItemId" integer NOT NULL,
    question text NOT NULL,
    "votesFor" integer DEFAULT 0 NOT NULL,
    "votesAgainst" integer DEFAULT 0 NOT NULL,
    "votesAbstain" integer DEFAULT 0 NOT NULL,
    "votesAbsent" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "voteStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "meetingId" integer,
    duration integer,
    "procedureId" integer,
    decision text,
    "voteType" public."VoteType" DEFAULT 'OPEN'::public."VoteType",
    "showOnBroadcast" boolean DEFAULT true,
    "televicResultsPending" boolean DEFAULT false NOT NULL
);


--
-- Name: VoteResult_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteResult_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: VoteResult_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."VoteResult_id_seq" OWNED BY public."VoteResult".id;


--
-- Name: VoteTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteTemplate" (
    id integer NOT NULL,
    title text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VoteTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: VoteTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."VoteTemplate_id_seq" OWNED BY public."VoteTemplate".id;


--
-- Name: Vote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Vote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Vote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Vote_id_seq" OWNED BY public."Vote".id;


--
-- Name: _MeetingDivisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_MeetingDivisions" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


--
-- Name: _MeetingParticipants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_MeetingParticipants" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: AgendaItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AgendaItem" ALTER COLUMN id SET DEFAULT nextval('public."AgendaItem_id_seq"'::regclass);


--
-- Name: Contact id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact" ALTER COLUMN id SET DEFAULT nextval('public."Contact_id_seq"'::regclass);


--
-- Name: DeviceLink id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceLink" ALTER COLUMN id SET DEFAULT nextval('public."DeviceLink_id_seq"'::regclass);


--
-- Name: Division id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Division" ALTER COLUMN id SET DEFAULT nextval('public."Division_id_seq"'::regclass);


--
-- Name: DurationTemplate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DurationTemplate" ALTER COLUMN id SET DEFAULT nextval('public."DurationTemplate_id_seq"'::regclass);


--
-- Name: Meeting id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting" ALTER COLUMN id SET DEFAULT nextval('public."Meeting_id_seq"'::regclass);


--
-- Name: ParticipantLocation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParticipantLocation" ALTER COLUMN id SET DEFAULT nextval('public."ParticipantLocation_id_seq"'::regclass);


--
-- Name: Proxy id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy" ALTER COLUMN id SET DEFAULT nextval('public."Proxy_id_seq"'::regclass);


--
-- Name: Queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queue" ALTER COLUMN id SET DEFAULT nextval('public."Queue_id_seq"'::regclass);


--
-- Name: ScreenConfig id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreenConfig" ALTER COLUMN id SET DEFAULT nextval('public."ScreenConfig_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: UserExtraDivision id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserExtraDivision" ALTER COLUMN id SET DEFAULT nextval('public."UserExtraDivision_id_seq"'::regclass);


--
-- Name: Vote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vote" ALTER COLUMN id SET DEFAULT nextval('public."Vote_id_seq"'::regclass);


--
-- Name: VoteProcedure id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteProcedure" ALTER COLUMN id SET DEFAULT nextval('public."VoteProcedure_id_seq"'::regclass);


--
-- Name: VoteResult id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteResult" ALTER COLUMN id SET DEFAULT nextval('public."VoteResult_id_seq"'::regclass);


--
-- Name: VoteTemplate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteTemplate" ALTER COLUMN id SET DEFAULT nextval('public."VoteTemplate_id_seq"'::regclass);


--
-- Data for Name: AgendaItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AgendaItem" (id, number, title, "speakerId", "meetingId", link, "createdAt", "updatedAt", completed, voting, "activeIssue", "speakerName") FROM stdin;
326	5	В 70–80-е годы развернулась настоящая «битва видеоносителей»: Betamax, VHD (Video High Density), LaserDisc и VHS. Победителем, как известно, стал последний. Но в этой гонке участвовал и американский гигант Radio Corporation of America — со своим форматом CED (Capacitance Electronic Disc), также известным как VideoDisc.	\N	126	\N	2025-10-17 08:17:14.067	2025-10-17 09:57:50.018	t	f	f	\N
319	1	Вопрос 1	\N	126	\N	2025-10-17 07:15:39.211	2025-10-17 09:57:50.018	t	f	f	Иван 1
321	3	Вопрос 3	\N	126	\N	2025-10-17 07:15:39.222	2025-10-17 09:57:50.018	t	f	f	Иван 3
325	4	Проект обошёлся компании почти в 500 миллионов долларов и закончился крахом: в 1987 году RCA прекратила существование.	\N	126	\N	2025-10-17 08:12:47.03	2025-10-17 09:57:50.018	t	f	f	Сидоров
320	2	Вопрос 2	\N	126	\N	2025-10-17 07:15:39.217	2025-10-17 09:57:50.018	t	f	f	Иван 2
328	7	еще восрос	\N	126	\N	2025-10-17 09:56:59.506	2025-10-17 09:57:50.018	t	f	f	\N
329	8	Вопрсо с докладчиком	\N	126	\N	2025-10-17 09:57:20.348	2025-10-17 09:57:50.018	t	f	t	корнилов петров сидоврос в ивсякие
344	2	Один 	\N	129	\N	2025-10-17 11:08:17.491	2025-10-17 11:09:35.986	f	f	f	\N
345	3	Два	\N	129	\N	2025-10-17 11:08:17.491	2025-10-17 11:09:35.986	f	f	f	\N
346	4		\N	129	\N	2025-10-17 11:08:17.491	2025-10-17 11:09:35.986	f	f	f	\N
343	1	Три 	\N	129	\N	2025-10-17 11:08:17.491	2025-10-17 11:09:35.986	f	f	t	\N
12	1	qe34	\N	10	\N	2025-10-06 12:42:47.55	2025-10-06 13:37:27.185	t	f	f	\N
13	2	234234	\N	10	\N	2025-10-06 12:42:47.55	2025-10-06 13:37:27.185	t	f	f	\N
14	3	234234	\N	10	\N	2025-10-06 12:42:47.55	2025-10-15 14:43:39.695	t	f	f	\N
333	1	Вопрос 1	\N	125	\N	2025-10-17 10:05:31.846	2025-10-17 10:42:24.131	t	f	f	\N
335	3	Вопрос 3	\N	125	\N	2025-10-17 10:05:31.846	2025-10-17 10:42:24.131	t	f	f	\N
334	2	Вопрос 2	\N	125	\N	2025-10-17 10:05:31.846	2025-10-17 10:42:24.131	t	f	t	\N
322	1	Вопрос 1	\N	127	\N	2025-10-17 07:20:10.157	2025-10-17 08:03:41.228	t	f	f	Иван 1
324	3	Вопрос 3	\N	127	\N	2025-10-17 07:20:10.165	2025-10-17 08:03:41.228	t	f	f	Иван 3
323	2	Вопрос 2	\N	127	\N	2025-10-17 07:20:10.161	2025-10-17 08:03:41.228	t	f	t	Иван 2
327	6	Давайте вернемся на 60 лет назад. Radio Corporation of America, лидер по части цветного телевидения (именно она презентовала миру первую подобную систему, приложила руку к разработке видеостандарта NTSC и выпустила первый цветной телевизор) и виниловых пластинок, задалась вопросами: что будет после телевизионных приемников? Как люди будут смотреть цветные фильмы дома?	\N	126	\N	2025-10-17 09:00:41.241	2025-10-17 09:57:50.018	t	f	f	\N
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Contact" (id, name, phone, "createdAt", "updatedAt") FROM stdin;
1	Иванов Иван Иванович	+7 (999) 123-45-67	2025-10-10 12:55:12.965	2025-10-17 05:49:22.937
\.


--
-- Data for Name: DeviceLink; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeviceLink" (id, "userId", "deviceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Division; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Division" (id, name, "createdAt", "updatedAt") FROM stdin;
39	Тестовая группа 10	2025-10-16 15:53:00.504	2025-10-16 15:53:00.504
40	Приглашенные	2025-10-16 16:00:31.738	2025-10-16 16:00:31.738
\.


--
-- Data for Name: DurationTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DurationTemplate" (id, name, "durationInSeconds", "createdAt", "updatedAt") FROM stdin;
1	30 секунд	30	2025-10-07 15:53:09	2025-10-07 15:53:09
2	1 минута	60	2025-10-07 15:53:09	2025-10-07 15:53:09
3	2 минуты	120	2025-10-07 15:53:09	2025-10-07 15:53:09
4	3 минуты	180	2025-10-07 15:53:09	2025-10-07 15:53:09
5	5 минут	300	2025-10-07 15:53:09	2025-10-07 15:53:09
6	10 минут	600	2025-10-07 15:53:09	2025-10-07 15:53:09
7	10 сек	10	2025-10-09 06:26:56.009	2025-10-09 06:26:56.009
\.


--
-- Data for Name: Form; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Form" (id, "createdAt", "updatedAt", "ownerChatId", title, description, fields, "successType", "successContent", "redirectUrl", "groupId", "assigneeChatId", "labelId", status, "observerChatId", "isActive") FROM stdin;
\.


--
-- Data for Name: FormSubmission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FormSubmission" (id, "formId", data, "taskId", ip, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: Meeting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Meeting" (id, name, "startTime", "endTime", status, "createdAt", "updatedAt", "isArchived", "voteProcedureId", "questionQueueEnabled", "speechQueueEnabled", "screenConfig", "showVoteOnBroadcast", "quorumType", "timerDuration", "timerStartedAt", "timerActive", "televicMeetingId", "createInTelevic") FROM stdin;
126	Десятое тест сайт телевик Половина +1	2025-10-17 07:15:39.197	2025-10-17 11:15:39.197	COMPLETED	2025-10-17 07:15:39.199	2025-10-17 09:57:50.018	f	4	t	t	\N	f	\N	\N	\N	f	149	t
127	Десятое тест сайт телевик 2/3 от установленного	2025-10-17 07:20:10.144	2025-10-17 11:20:10.144	COMPLETED	2025-10-17 07:20:10.146	2025-10-17 08:03:41.228	f	3	t	t	\N	f	MORE_THAN_ONE	\N	\N	f	148	t
125	Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)	2025-10-17 07:14:00	2025-10-17 11:14:00	COMPLETED	2025-10-17 07:14:10.691	2025-10-17 10:42:24.131	f	3	t	t	\N	t	\N	\N	\N	f	150	t
129	Основы работы с Terraform в Selectel на примере Managed Kubernetes	2025-10-18 10:00:00	2025-10-19 10:01:00	IN_PROGRESS	2025-10-17 10:58:38.047	2025-10-17 11:09:36.136	f	\N	t	t	\N	f	\N	\N	\N	f	151	t
10	За принятие повески	2025-10-06 12:42:00	2025-10-06 12:45:00	IN_PROGRESS	2025-10-06 12:42:47.55	2025-10-06 14:59:33.745	t	\N	t	t	\N	f	\N	\N	\N	f	130	f
\.


--
-- Data for Name: ParticipantLocation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ParticipantLocation" (id, "meetingId", "userId", location, "createdAt", "updatedAt") FROM stdin;
122	125	150	SITE	2025-10-17 10:05:27.876453	2025-10-17 10:05:27.876453
123	125	151	SITE	2025-10-17 10:05:27.887282	2025-10-17 10:05:27.887282
124	125	122	SITE	2025-10-17 10:05:27.893127	2025-10-17 10:05:27.893127
125	125	123	SITE	2025-10-17 10:05:27.898579	2025-10-17 10:05:27.898579
126	125	124	SITE	2025-10-17 10:05:27.901905	2025-10-17 10:05:27.901905
127	125	125	SITE	2025-10-17 10:05:27.905351	2025-10-17 10:05:27.905351
128	125	126	SITE	2025-10-17 10:05:27.908455	2025-10-17 10:05:27.908455
129	125	127	SITE	2025-10-17 10:05:27.911357	2025-10-17 10:05:27.911357
130	125	128	SITE	2025-10-17 10:05:27.914128	2025-10-17 10:05:27.914128
131	125	129	SITE	2025-10-17 10:05:27.91695	2025-10-17 10:05:27.91695
132	125	130	SITE	2025-10-17 10:05:27.919867	2025-10-17 10:05:27.919867
133	125	131	SITE	2025-10-17 10:05:27.922883	2025-10-17 10:05:27.922883
134	125	132	SITE	2025-10-17 10:05:27.926227	2025-10-17 10:05:27.926227
135	125	133	SITE	2025-10-17 10:05:27.929022	2025-10-17 10:05:27.929022
136	125	134	SITE	2025-10-17 10:05:27.931814	2025-10-17 10:05:27.931814
137	125	135	SITE	2025-10-17 10:05:27.93547	2025-10-17 10:05:27.93547
138	125	136	SITE	2025-10-17 10:05:27.938439	2025-10-17 10:05:27.938439
139	125	137	SITE	2025-10-17 10:05:27.941613	2025-10-17 10:05:27.941613
140	125	138	SITE	2025-10-17 10:05:27.944515	2025-10-17 10:05:27.944515
141	125	139	SITE	2025-10-17 10:05:27.947464	2025-10-17 10:05:27.947464
142	125	140	SITE	2025-10-17 10:05:27.950619	2025-10-17 10:05:27.950619
143	125	141	SITE	2025-10-17 10:05:27.953674	2025-10-17 10:05:27.953674
144	125	142	SITE	2025-10-17 10:05:27.956751	2025-10-17 10:05:27.956751
145	125	143	SITE	2025-10-17 10:05:27.959659	2025-10-17 10:05:27.959659
146	125	144	SITE	2025-10-17 10:05:27.962745	2025-10-17 10:05:27.962745
147	125	145	SITE	2025-10-17 10:05:27.965571	2025-10-17 10:05:27.965571
148	125	146	SITE	2025-10-17 10:05:27.969362	2025-10-17 10:05:27.969362
149	125	147	SITE	2025-10-17 10:05:27.97278	2025-10-17 10:05:27.97278
150	125	148	SITE	2025-10-17 10:05:27.976197	2025-10-17 10:05:27.976197
151	125	152	SITE	2025-10-17 10:05:27.97916	2025-10-17 10:05:27.97916
152	125	153	SITE	2025-10-17 10:05:27.982864	2025-10-17 10:05:27.982864
153	125	154	SITE	2025-10-17 10:05:27.986066	2025-10-17 10:05:27.986066
154	125	155	SITE	2025-10-17 10:05:27.989196	2025-10-17 10:05:27.989196
155	125	156	SITE	2025-10-17 10:05:27.992242	2025-10-17 10:05:27.992242
156	125	157	SITE	2025-10-17 10:05:27.995308	2025-10-17 10:05:27.995308
157	125	158	SITE	2025-10-17 10:05:27.998349	2025-10-17 10:05:27.998349
158	125	159	SITE	2025-10-17 10:05:28.001349	2025-10-17 10:05:28.001349
159	125	160	SITE	2025-10-17 10:05:28.004637	2025-10-17 10:05:28.004637
160	125	161	SITE	2025-10-17 10:05:28.007739	2025-10-17 10:05:28.007739
161	125	162	SITE	2025-10-17 10:05:28.010928	2025-10-17 10:05:28.010928
162	125	149	SITE	2025-10-17 10:05:28.014658	2025-10-17 10:05:28.014658
163	125	120	SITE	2025-10-17 10:05:28.020835	2025-10-17 10:05:28.020835
164	125	121	SITE	2025-10-17 10:05:28.024649	2025-10-17 10:05:28.024649
208	129	121	SITE	2025-10-17 11:02:49.74648	2025-10-17 11:02:55.653503
209	129	120	SITE	2025-10-17 11:02:49.752769	2025-10-17 11:02:55.656725
210	129	150	SITE	2025-10-17 11:02:49.756187	2025-10-17 11:02:55.659783
211	129	151	SITE	2025-10-17 11:02:49.763209	2025-10-17 11:02:55.666609
212	129	122	SITE	2025-10-17 11:02:49.770291	2025-10-17 11:02:55.674558
213	129	123	SITE	2025-10-17 11:02:49.776877	2025-10-17 11:02:55.682766
214	129	124	SITE	2025-10-17 11:02:49.78054	2025-10-17 11:02:55.685803
215	129	125	SITE	2025-10-17 11:02:49.783823	2025-10-17 11:02:55.688873
216	129	126	SITE	2025-10-17 11:02:49.787006	2025-10-17 11:02:55.691971
217	129	127	SITE	2025-10-17 11:02:49.790211	2025-10-17 11:02:55.695092
218	129	128	SITE	2025-10-17 11:02:49.793194	2025-10-17 11:02:55.698012
219	129	129	SITE	2025-10-17 11:02:49.796033	2025-10-17 11:02:55.701144
220	129	130	SITE	2025-10-17 11:02:49.799005	2025-10-17 11:02:55.70439
221	129	131	SITE	2025-10-17 11:02:49.802172	2025-10-17 11:02:55.707485
222	129	132	SITE	2025-10-17 11:02:49.805468	2025-10-17 11:02:55.710352
223	129	133	SITE	2025-10-17 11:02:49.808708	2025-10-17 11:02:55.71342
224	129	134	SITE	2025-10-17 11:02:49.811928	2025-10-17 11:02:55.716161
225	129	135	SITE	2025-10-17 11:02:49.815386	2025-10-17 11:02:55.720449
226	129	136	SITE	2025-10-17 11:02:49.81855	2025-10-17 11:02:55.724424
227	129	137	SITE	2025-10-17 11:02:49.821719	2025-10-17 11:02:55.727788
228	129	138	SITE	2025-10-17 11:02:49.824758	2025-10-17 11:02:55.730837
229	129	139	SITE	2025-10-17 11:02:49.827944	2025-10-17 11:02:55.733843
230	129	140	SITE	2025-10-17 11:02:49.83134	2025-10-17 11:02:55.73716
231	129	141	SITE	2025-10-17 11:02:49.834355	2025-10-17 11:02:55.740344
232	129	142	SITE	2025-10-17 11:02:49.837334	2025-10-17 11:02:55.743381
233	129	143	SITE	2025-10-17 11:02:49.84039	2025-10-17 11:02:55.746161
234	129	144	SITE	2025-10-17 11:02:49.843515	2025-10-17 11:02:55.748964
235	129	145	SITE	2025-10-17 11:02:49.846224	2025-10-17 11:02:55.751723
236	129	146	SITE	2025-10-17 11:02:49.849411	2025-10-17 11:02:55.754446
237	129	147	SITE	2025-10-17 11:02:49.852386	2025-10-17 11:02:55.757177
238	129	148	SITE	2025-10-17 11:02:49.855628	2025-10-17 11:02:55.760717
239	129	152	SITE	2025-10-17 11:02:49.858646	2025-10-17 11:02:55.763545
240	129	153	SITE	2025-10-17 11:02:49.861484	2025-10-17 11:02:55.766196
241	129	154	SITE	2025-10-17 11:02:49.864361	2025-10-17 11:02:55.768942
242	129	155	SITE	2025-10-17 11:02:49.868206	2025-10-17 11:02:55.771777
243	129	156	SITE	2025-10-17 11:02:49.872687	2025-10-17 11:02:55.774702
244	129	157	SITE	2025-10-17 11:02:49.875829	2025-10-17 11:02:55.777547
245	129	158	SITE	2025-10-17 11:02:49.87892	2025-10-17 11:02:55.780339
246	129	159	SITE	2025-10-17 11:02:49.882155	2025-10-17 11:02:55.783294
247	129	160	SITE	2025-10-17 11:02:49.885209	2025-10-17 11:02:55.787027
248	129	161	SITE	2025-10-17 11:02:49.888021	2025-10-17 11:02:55.789878
249	129	162	SITE	2025-10-17 11:02:49.891399	2025-10-17 11:02:55.792889
250	129	149	SITE	2025-10-17 11:02:49.894467	2025-10-17 11:02:55.79583
\.


--
-- Data for Name: Proxy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Proxy" (id, "meetingId", "fromUserId", "toUserId", "createdAt", "updatedAt") FROM stdin;
36	125	150	120	2025-10-17 10:05:27.883979	2025-10-17 10:05:27.883979
37	125	151	120	2025-10-17 10:05:27.890641	2025-10-17 10:05:27.890641
38	125	122	120	2025-10-17 10:05:27.896278	2025-10-17 10:05:27.896278
39	125	149	120	2025-10-17 10:05:28.017748	2025-10-17 10:05:28.017748
46	129	150	120	2025-10-17 11:02:55.664093	2025-10-17 11:02:55.664093
47	129	151	120	2025-10-17 11:02:55.671659	2025-10-17 11:02:55.671659
48	129	122	120	2025-10-17 11:02:55.679975	2025-10-17 11:02:55.679975
\.


--
-- Data for Name: Queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Queue" (id, "meetingId", "userId", type, status, "position", "timerSeconds", "timerEndTime", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScreenConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScreenConfig" (id, type, config, "createdAt", "updatedAt") FROM stdin;
2	AGENDA	{"logoUrl": "/uploads/screens/1760617379539-596847651.png", "logoSize": "50%", "showLogo": true, "dateColor": "#ffffff", "paddingTop": "46", "showAgenda": true, "headerColor": "#1976d2", "paddingLeft": "200", "dateFontSize": "17px", "paddingRight": "200", "backgroundUrl": "/uploads/screens/1760688533403-846860177.jpg", "paddingBottom": "31", "titleFontSize": "36px", "backgroundColor": "#0a0a0a", "speakerItemColor": "#ffffff", "meetingTitleColor": "#616fd6", "speechNumberColor": "#ffffff", "speakersLabelColor": "#ffffff", "speakersNamesColor": "#ffffff", "activeSpeechBgColor": "#ff9800", "questionNumberColor": "#ffffff", "speakerItemFontSize": "20px", "activeSpeakerBgColor": "#128df3", "currentQuestionColor": "#ffffff", "meetingTitleFontSize": "35px", "speechNumberFontSize": "24px", "speakersLabelFontSize": "17px", "speakersNamesFontSize": "23px", "questionNumberFontSize": "28px", "currentQuestionFontSize": "18px"}	2025-10-09 08:57:16.336	2025-10-17 08:25:44.775
3	VOTING	{"logoUrl": "", "showTimer": true, "paddingTop": "60", "timerColor": "#ffffff", "headerColor": "#1976d2", "paddingLeft": "45", "quorumColor": "#ffffff", "showResults": true, "paddingRight": "30", "backgroundUrl": "", "paddingBottom": "89", "timerFontSize": "36px", "titleFontSize": "42px", "quorumFontSize": "28px", "voteLabelColor": "#ffffff", "backgroundColor": "#272525", "voteNumberColor": "#ffffff", "resultTitleColor": "#ffffff", "meetingTitleColor": "#ffffff", "progressBarHeight": "8", "voteLabelFontSize": "32px", "progressBarBgColor": "#ffffff", "voteNumberFontSize": "32px", "resultTitleFontSize": "48px", "meetingTitleFontSize": "28px", "progressBarFillColor": "#2196f3"}	2025-10-09 08:57:16.336	2025-10-16 12:23:49
4	FINAL	{"logoUrl": "/uploads/screens/1760617436072-172700701.png", "topText": "ХАНТЫ-МАНСИЙСКИЙ АВТОНОМНЫЙ ОКРУГ - ЮГРА! ", "bottomText": "МЕРОПРИЯТИЕ ЗАВЕРШЕНО", "paddingTop": "30", "headerColor": "#4caf50", "paddingLeft": "30", "showResults": true, "paddingRight": "30", "showDecision": true, "topTextColor": "#f7f7f7", "backgroundUrl": "", "paddingBottom": "30", "titleFontSize": "48px", "backgroundColor": "#000000", "bottomTextColor": "#ffffff", "topTextFontSize": "36px", "bottomTextFontSize": "28px"}	2025-10-09 08:57:16.336	2025-10-16 12:23:58.843
1	REGISTRATION	{"logoUrl": "/uploads/screens/1760617343567-115118200.png", "showDate": true, "showLogo": true, "lineColor": "#2196f3", "textColor": "#ffffff", "paddingTop": "40", "titleColor": "#ffffff", "paddingLeft": "20", "paddingRight": "20", "textFontSize": "24px", "backgroundUrl": "/uploads/screens/1760688543721-298348759.jpg", "paddingBottom": "40", "subtitleColor": "#ffffff", "titleFontSize": "48px", "backgroundColor": "#000000", "subtitleFontSize": "36px"}	2025-10-09 08:57:16.336	2025-10-17 08:09:05.611
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, name, phone, "isAdmin", "divisionId", "createdAt", "updatedAt", "isOnline", "televicExternalId", username, "isBadgeInserted") FROM stdin;
3	1@1.ru	123	первый	89681669318	f	\N	2025-09-26 07:59:23.56	2025-10-16 11:33:09.197	t	\N	\N	f
121	11@10.ru	123	11	\N	f	39	2025-10-16 15:53:00.517	2025-10-17 10:08:10.166	f	10	11	t
120	10@10.ru	123	10	\N	f	39	2025-10-16 15:53:00.511	2025-10-17 10:08:37.515	f	9	10	t
2	admin@admin.ru	123	Admin	\N	t	\N	2025-09-26 06:23:10.259	2025-10-16 11:27:27.633	t	\N	\N	f
150	40@10.ru	123	40	\N	f	39	2025-10-16 15:53:00.649	2025-10-16 15:53:00.649	f	\N	40	f
151	41@10.ru	123	41	\N	f	39	2025-10-16 15:53:00.653	2025-10-16 15:53:00.653	f	\N	41	f
122	12@10.ru	123	12	\N	f	39	2025-10-16 15:53:00.523	2025-10-16 15:53:00.523	f	\N	12	f
123	13@10.ru	123	13	\N	f	39	2025-10-16 15:53:00.528	2025-10-16 15:53:00.528	f	\N	13	f
124	14@10.ru	123	14	\N	f	39	2025-10-16 15:53:00.533	2025-10-16 15:53:00.533	f	\N	14	f
125	15@10.ru	123	15	\N	f	39	2025-10-16 15:53:00.537	2025-10-16 15:53:00.537	f	\N	15	f
126	16@10.ru	123	16	\N	f	39	2025-10-16 15:53:00.542	2025-10-16 15:53:00.542	f	\N	16	f
127	17@10.ru	123	17	\N	f	39	2025-10-16 15:53:00.547	2025-10-16 15:53:00.547	f	\N	17	f
128	18@10.ru	123	18	\N	f	39	2025-10-16 15:53:00.551	2025-10-16 15:53:00.551	f	\N	18	f
129	19@10.ru	123	19	\N	f	39	2025-10-16 15:53:00.556	2025-10-16 15:53:00.556	f	\N	19	f
130	20@10.ru	123	20	\N	f	39	2025-10-16 15:53:00.56	2025-10-16 15:53:00.56	f	\N	20	f
131	21@10.ru	123	21	\N	f	39	2025-10-16 15:53:00.564	2025-10-16 15:53:00.564	f	\N	21	f
132	22@10.ru	123	22	\N	f	39	2025-10-16 15:53:00.569	2025-10-16 15:53:00.569	f	\N	22	f
133	23@10.ru	123	23	\N	f	39	2025-10-16 15:53:00.573	2025-10-16 15:53:00.573	f	\N	23	f
134	24@10.ru	123	24	\N	f	39	2025-10-16 15:53:00.577	2025-10-16 15:53:00.577	f	\N	24	f
135	25@10.ru	123	25	\N	f	39	2025-10-16 15:53:00.582	2025-10-16 15:53:00.582	f	\N	25	f
136	26@10.ru	123	26	\N	f	39	2025-10-16 15:53:00.586	2025-10-16 15:53:00.586	f	\N	26	f
137	27@10.ru	123	27	\N	f	39	2025-10-16 15:53:00.59	2025-10-16 15:53:00.59	f	\N	27	f
138	28@10.ru	123	28	\N	f	39	2025-10-16 15:53:00.594	2025-10-16 15:53:00.594	f	\N	28	f
139	29@10.ru	123	29	\N	f	39	2025-10-16 15:53:00.599	2025-10-16 15:53:00.599	f	\N	29	f
140	30@10.ru	123	30	\N	f	39	2025-10-16 15:53:00.603	2025-10-16 15:53:00.603	f	\N	30	f
141	31@10.ru	123	31	\N	f	39	2025-10-16 15:53:00.608	2025-10-16 15:53:00.608	f	\N	31	f
142	32@10.ru	123	32	\N	f	39	2025-10-16 15:53:00.613	2025-10-16 15:53:00.613	f	\N	32	f
143	33@10.ru	123	33	\N	f	39	2025-10-16 15:53:00.617	2025-10-16 15:53:00.617	f	\N	33	f
144	34@10.ru	123	34	\N	f	39	2025-10-16 15:53:00.622	2025-10-16 15:53:00.622	f	\N	34	f
145	35@10.ru	123	35	\N	f	39	2025-10-16 15:53:00.627	2025-10-16 15:53:00.627	f	\N	35	f
146	36@10.ru	123	36	\N	f	39	2025-10-16 15:53:00.631	2025-10-16 15:53:00.631	f	\N	36	f
147	37@10.ru	123	37	\N	f	39	2025-10-16 15:53:00.636	2025-10-16 15:53:00.636	f	\N	37	f
148	38@10.ru	123	38	\N	f	39	2025-10-16 15:53:00.641	2025-10-16 15:53:00.641	f	\N	38	f
152	42@10.ru	123	42	\N	f	39	2025-10-16 15:53:00.658	2025-10-16 15:53:00.658	f	\N	42	f
153	43@10.ru	123	43	\N	f	39	2025-10-16 15:53:00.663	2025-10-16 15:53:00.663	f	\N	43	f
154	44@10.ru	123	44	\N	f	39	2025-10-16 15:53:00.667	2025-10-16 15:53:00.667	f	\N	44	f
155	45@10.ru	123	45	\N	f	39	2025-10-16 15:53:00.671	2025-10-16 15:53:00.671	f	\N	45	f
156	46@10.ru	123	46	\N	f	39	2025-10-16 15:53:00.676	2025-10-16 15:53:00.676	f	\N	46	f
157	47@10.ru	123	47	\N	f	39	2025-10-16 15:53:00.682	2025-10-16 15:53:00.682	f	\N	47	f
158	G1@10	123	G1	\N	f	40	2025-10-16 16:00:31.745	2025-10-16 16:00:31.745	f	\N	G1	f
159	G2@10	123	G2	\N	f	40	2025-10-16 16:00:31.752	2025-10-16 16:00:31.752	f	\N	G2	f
160	G3@10	123	G3	\N	f	40	2025-10-16 16:00:31.756	2025-10-16 16:00:31.756	f	\N	G3	f
161	G4@10	123	G4	\N	f	40	2025-10-16 16:00:31.761	2025-10-16 16:00:31.761	f	\N	G4	f
162	G5@10	123	G5	\N	f	40	2025-10-16 16:00:31.765	2025-10-16 16:00:31.765	f	\N	G5	f
30	2@1.ru	123	Второй	89681669318	f	\N	2025-10-14 06:20:32.63	2025-10-16 16:04:40.446	f	\N	vtoroy	t
5	3@3.ru	123	Третий	89681669318	f	\N	2025-09-26 08:15:16.98	2025-10-16 16:04:41.708	f	\N	tretiy	t
149	39@10.ru	123	39	\N	f	39	2025-10-16 15:53:00.645	2025-10-17 05:49:55.229	t	\N	39	f
\.


--
-- Data for Name: UserExtraDivision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserExtraDivision" (id, "userId", "divisionId") FROM stdin;
1	19	4
2	19	1
3	20	5
4	28	7
5	28	1
6	29	1
7	29	3
\.


--
-- Data for Name: Vote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Vote" (id, "userId", "agendaItemId", choice, "createdAt", "voteResultId") FROM stdin;
1	3	12	FOR	2025-10-06 13:06:04.776	8
2	3	13	AGAINST	2025-10-06 13:06:34.818	9
3	3	14	ABSTAIN	2025-10-06 13:07:39.749	10
70	5	14	FOR	2025-10-15 13:39:43.103	10
71	30	14	FOR	2025-10-15 13:39:43.11	10
146	121	320	FOR	2025-10-17 08:05:01.068	329
147	120	320	FOR	2025-10-17 08:05:01.075	329
148	121	321	AGAINST	2025-10-17 08:06:06.909	330
149	120	321	AGAINST	2025-10-17 08:06:06.915	330
150	121	320	ABSTAIN	2025-10-17 08:07:08.642	331
151	120	320	ABSTAIN	2025-10-17 08:07:08.648	331
152	121	321	FOR	2025-10-17 08:11:19.814	332
153	120	321	FOR	2025-10-17 08:11:19.821	332
155	121	333	ABSTAIN	2025-10-17 10:09:30.276	334
154	120	333	FOR	2025-10-17 10:34:35.555	334
156	121	334	FOR	2025-10-17 10:36:45.582	335
157	120	334	ABSTAIN	2025-10-17 10:36:45.589	335
158	120	334	FOR	2025-10-17 10:41:30.289	337
159	121	334	ABSTAIN	2025-10-17 10:41:30.295	337
\.


--
-- Data for Name: VoteProcedure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoteProcedure" (id, name, conditions, "resultIfTrue", "createdAt", "updatedAt") FROM stdin;
3	Не менее 2/3 от установленного числа депутатов	[{"elements": ["За", ">", "Все пользователи заседания", "*", {"type": "input", "value": 0.6667}], "operator": "И"}, {"elements": ["За", ">", "Против"], "operator": null}]	Принято	2025-10-06 12:54:21.585	2025-10-06 12:54:21.585
4	Большинство от установленного числа депутатов	[{"elements": ["За", ">", "Все пользователи заседания", "*", {"type": "input", "value": 0.5}], "operator": "И"}, {"elements": ["За", ">", "Против"], "operator": null}]	Принято	2025-10-06 12:55:56.776	2025-10-06 12:55:56.776
2	Большинство от присутствующих депутатов (зарегистрировавшихся на мероприятие)	[{"elements": ["За", ">", "Все пользователи онлайн", "*", {"type": "input", "value": 0.5}], "operator": "И"}, {"elements": ["За", ">", "Против"], "operator": null}]	Принято	2025-10-06 12:48:09.817	2025-10-06 12:48:39.159
\.


--
-- Data for Name: VoteResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoteResult" (id, "agendaItemId", question, "votesFor", "votesAgainst", "votesAbstain", "votesAbsent", "createdAt", "voteStatus", "meetingId", duration, "procedureId", decision, "voteType", "showOnBroadcast", "televicResultsPending") FROM stdin;
335	334	За принятие повески 	1	0	1	38	2025-10-17 10:36:10.827	APPLIED	125	30	3	Не принято	OPEN	t	f
328	319	За проект	0	0	0	38	2025-10-17 08:04:27.071	APPLIED	126	30	3	Не принято	OPEN	t	f
336	335	За проект	0	0	0	38	2025-10-17 10:39:07.279	APPLIED	125	30	3	Не принято	OPEN	t	f
329	320	За принятие повески 	2	0	0	36	2025-10-17 08:04:49.187	APPLIED	126	30	3	Не принято	OPEN	t	f
337	334	За принятие повески 	5	0	1	36	2025-10-17 10:40:55.446	APPLIED	125	30	3	Не принято	OPEN	t	f
330	321	За принятие повески 	0	2	0	38	2025-10-17 08:05:32.849	APPLIED	126	30	4	Не принято	OPEN	t	f
244	14	Test via curl	0	0	0	9	2025-10-15 14:37:12.046	ENDED	10	45	2	Не принято	OPEN	t	f
245	14	REAL-TIME DEBUG TEST	0	0	0	9	2025-10-15 14:42:39.633	ENDED	10	60	2	Не принято	OPEN	t	f
331	320	За принятие повески 	0	0	2	36	2025-10-17 08:06:34.582	APPLIED	126	30	4	Не принято	OPEN	t	f
332	321	За принятие повески 	2	0	0	36	2025-10-17 08:10:44.425	APPLIED	126	30	4	Не принято	OPEN	t	f
324	322	За принятие повески 	0	0	0	38	2025-10-17 07:38:50.75	APPLIED	127	30	3	Не принято	OPEN	t	f
333	320	За принятие повески 	0	0	0	36	2025-10-17 09:37:01.274	APPLIED	126	30	4	Не принято	OPEN	t	f
325	322	За принятие повески 	0	0	0	38	2025-10-17 07:40:32.41	APPLIED	127	30	3	Не принято	OPEN	t	f
326	323	За принятие повески 	0	0	0	38	2025-10-17 07:52:59.238	APPLIED	127	60	4	Не принято	OPEN	t	f
334	333	За принятие повески 	5	0	1	37	2025-10-17 10:08:55.469	APPLIED	125	30	3	Не принято	OPEN	t	f
327	324	За проект	0	0	0	38	2025-10-17 07:55:51.128	APPLIED	127	60	4	Не принято	OPEN	t	f
8	12	За принятие повески 	1	0	0	3	2025-10-06 13:05:56.545	APPLIED	10	10	2	Принято	OPEN	t	f
9	13	За принятие повески 	0	1	0	3	2025-10-06 13:06:24.843	APPLIED	10	10	3	Принято	OPEN	t	f
10	14	За принятие повески 	2	0	1	3	2025-10-06 13:07:29.799	APPLIED	10	10	3	Принято	OPEN	t	f
\.


--
-- Data for Name: VoteTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoteTemplate" (id, title, "createdAt", "updatedAt") FROM stdin;
1	За принятие повески 	2025-10-06 12:21:35.328	2025-10-06 12:21:35.328
2	За проект	2025-10-06 12:51:18.293	2025-10-06 12:51:18.293
3	За кондидата	2025-10-06 12:51:30.369	2025-10-06 12:51:30.369
4	Против сборов	2025-10-06 12:51:48.184	2025-10-06 12:51:48.184
5	тестовый	2025-10-06 12:51:57.963	2025-10-06 12:51:57.963
6	тест	2025-10-07 06:48:31.434	2025-10-07 06:48:31.434
\.


--
-- Data for Name: _MeetingDivisions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_MeetingDivisions" ("A", "B") FROM stdin;
39	126
40	126
39	127
40	127
39	125
40	125
39	129
40	129
\.


--
-- Data for Name: _MeetingParticipants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_MeetingParticipants" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f7731a17-8569-4ae7-af2c-8dd196e587da	fe01c327b0d096203aa470bef96a3f88d9291f4ae5e22df06dee80348dcfe6e8	2025-09-26 06:02:26.318614+00	20250518165902_init_postgres	\N	\N	2025-09-26 06:02:26.289016+00	1
6181c489-7bc0-466a-9bd2-b467b12c6b20	a16816d514805d0778612ff7df1f1cd5c984693ea5dbc24d0f7107d691797803	2025-09-26 06:02:26.587868+00	20250530080921_add_decision_to_vote_result	\N	\N	2025-09-26 06:02:26.580776+00	1
c3be5e97-4c94-4f85-a4e8-d60a1f3470f2	679018701ca28b2520a0fe959ff0fa61137398fe23cec8b214b9a72cb09b5637	2025-09-26 06:02:26.42741+00	20250519072132_init	\N	\N	2025-09-26 06:02:26.321611+00	1
4734d130-30b9-487e-a099-d2265a63c6e0	fb7688d7dab70b370bfa260d44186807b82f63c2a289c9804ef9e01288a2ce9b	2025-09-26 06:02:26.441971+00	20250519175415_add_vote_status	\N	\N	2025-09-26 06:02:26.430027+00	1
8dea28c1-2d16-46fe-a7f7-6834da3d28f2	417b243b72bdb053221f25f52dd7309e767c159052f15f9d41d19d93b4835882	2025-09-26 06:02:26.452652+00	20250519183610_add_end_time_to_vote_result	\N	\N	2025-09-26 06:02:26.444023+00	1
24860c4c-05e8-4674-8dbb-bd4dd0d41303	552c3eea0c189570c711d881f37801a1d2495a67a8585b9f608fe418a2dd94c2	2025-09-26 06:02:26.610034+00	20250530134645_add_vote_type_and_templates	\N	\N	2025-09-26 06:02:26.589742+00	1
54f7b9ee-bac6-48cc-8666-369f436ce1f0	09570297e8694541c8a5b54f19b7d6f3fe2ab256bd676867db71ea62f615b5ae	2025-09-26 06:02:26.463675+00	20250520060458_add_meeting_id_to_vote_result	\N	\N	2025-09-26 06:02:26.454741+00	1
d9ab05be-6bb1-448a-b3da-36551d6f9d84	b52e7fdb9011bf0fefb32e97d8092d9726c12d9e24a874c4f48f44db9414a0c9	2025-09-26 06:02:26.473305+00	20250520072910_add_voting_completed_to_agenda_item	\N	\N	2025-09-26 06:02:26.465678+00	1
b84baf43-316d-47e7-9fac-0f7049480e4d	47b13c0f57f7348783cf9ee2870edb92da76c9a42d2644874057aced854a4667	2025-09-26 06:02:26.483258+00	20250520080243_update_vote_result_and_agenda_item	\N	\N	2025-09-26 06:02:26.475295+00	1
86e6124b-e1be-4512-99bc-6caaff8e9a34	4e97e7b56f81b974adf1e3e3094b66a41340bde15556933d357d1d59ed7f1f77	2025-09-26 06:02:26.640808+00	20250602055443_add_device_link	\N	\N	2025-09-26 06:02:26.612212+00	1
547c1e4a-4a27-4983-b047-09fd1b6a5e58	018ff918907ddeef115135c0f1816783a1e5d50ccf78136b8f46d3ce1d6f22c7	2025-09-26 06:02:26.49714+00	20250520133015_add_active_issue_to_agenda_item	\N	\N	2025-09-26 06:02:26.487656+00	1
d4265cd1-dbbc-4915-99c7-d4c29e2403a6	551cd508f702434438b4d53852e4c85f0b7e16545e91d6cf2cde3e5191c47616	2025-09-26 06:02:26.510152+00	20250522064403_add_vote_result_id_to_vote	\N	\N	2025-09-26 06:02:26.499286+00	1
828b590b-6a16-4088-adcf-ffbdbf60cdc0	9c262a31b930e628b2f31b2bc1f584d3011f7da939cd395eacff1ee98c5af75e	2025-09-26 06:02:26.523199+00	20250528070022_add_is_online_to_user	\N	\N	2025-09-26 06:02:26.512031+00	1
83705f1e-51f4-4cc6-a0be-2218d465e85f	241391e6302c697d21bfc06126c42f97e695c729829d6b7f26afbfba9ff9b1b2	2025-09-26 08:15:03.42248+00	20250926082000_add_televic_external_id	\N	\N	2025-09-26 08:15:03.4046+00	1
85b86fcb-cf31-4e0a-946c-9f1955ca70d0	dc3ab03f7b64f8e8b3fd424ecbe7488d1c1b7b095021598ef4d52bce3d67b591	2025-09-26 06:02:26.554776+00	20250528112029_add_vote_procedure	\N	\N	2025-09-26 06:02:26.528765+00	1
baad2c01-9be9-4629-839d-9345d5698eaf	d322d6d3486641dc632c94695f1a7e0c6d3f73f22613d091ac96015427d0fbb1	2025-09-26 06:02:26.567334+00	20250528121620_add_procedure_id_to_vote_result	\N	\N	2025-09-26 06:02:26.558037+00	1
5307c173-736f-4bc1-ae3c-3b9ce250f1a9	5193631892edc5d47feda865510f546854320c9a9f228ac71ed96acc337793f3	2025-09-26 06:02:26.578703+00	20250530080711_add_vote_procedure_relation	\N	\N	2025-09-26 06:02:26.569358+00	1
07e92445-352e-4d55-b024-9c21f5246abc		2025-10-09 08:57:22.957662+00	20251009120000_add_screen_config	\N	\N	2025-10-09 08:57:22.957662+00	1
eb9de71e-e8c8-4f46-923b-5b6c2f4cd4a8	43d21ec7fefa833a457ba92484a927185bcfd33c795fd70ee589e2d07de74aa4	\N	20251007155300_add_duration_template	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251007155300_add_duration_template\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "DurationTemplate" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"DurationTemplate\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1150), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251007155300_add_duration_template"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251007155300_add_duration_template"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:231	2025-10-10 12:50:04.272217+00	2025-10-09 08:56:06.969557+00	0
5ec5c50c-43a6-4b38-9286-cbaedcccc0fc	43d21ec7fefa833a457ba92484a927185bcfd33c795fd70ee589e2d07de74aa4	2025-10-10 12:50:04.2811+00	20251007155300_add_duration_template		\N	2025-10-10 12:50:04.2811+00	0
f153c47f-fdb2-4a11-809b-0a3ecd363d8d	4477de84322a90745f63f2195c48cf6efa8b80de8124d3cb6dff80107a0ff898	2025-10-10 12:50:34.155463+00	20251010130000_add_contact_table		\N	2025-10-10 12:50:34.155463+00	0
2b39c86b-d673-4404-bc11-5033657c70a9	7916e660a7b74c71e72b0438eeca6a4c3715d712a36e796ecb8b45ddcda29bec	2025-10-10 12:50:51.924625+00	20251008085815_add_queue_model		\N	2025-10-10 12:50:51.924625+00	0
940af16e-7d1c-4ef6-bf19-bebc96fa4d8a	eef75d75f9c2245552d8adcf23129f367d497a44175b20803fd96376a77650ea	2025-10-10 12:50:53.980885+00	20251008100051_add_queue_enabled_fields		\N	2025-10-10 12:50:53.980885+00	0
d91b22c1-0bae-424d-86d6-090d99a6cd5c	083c2deec1c2935de423acabafc509822366c1abcc3250649b1ba682dff5e513	2025-10-10 12:50:56.089529+00	20251008113531_add_username_make_email_optional		\N	2025-10-10 12:50:56.089529+00	0
\.


--
-- Name: AgendaItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AgendaItem_id_seq"', 346, true);


--
-- Name: Contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Contact_id_seq"', 1, true);


--
-- Name: DeviceLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DeviceLink_id_seq"', 1, false);


--
-- Name: Division_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Division_id_seq"', 40, true);


--
-- Name: DurationTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DurationTemplate_id_seq"', 7, true);


--
-- Name: Meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Meeting_id_seq"', 129, true);


--
-- Name: ParticipantLocation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ParticipantLocation_id_seq"', 293, true);


--
-- Name: Proxy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Proxy_id_seq"', 48, true);


--
-- Name: Queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Queue_id_seq"', 50, true);


--
-- Name: ScreenConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ScreenConfig_id_seq"', 4, true);


--
-- Name: UserExtraDivision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."UserExtraDivision_id_seq"', 9, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 162, true);


--
-- Name: VoteProcedure_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."VoteProcedure_id_seq"', 4, true);


--
-- Name: VoteResult_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."VoteResult_id_seq"', 337, true);


--
-- Name: VoteTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."VoteTemplate_id_seq"', 6, true);


--
-- Name: Vote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Vote_id_seq"', 159, true);


--
-- Name: AgendaItem AgendaItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AgendaItem"
    ADD CONSTRAINT "AgendaItem_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: DeviceLink DeviceLink_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceLink"
    ADD CONSTRAINT "DeviceLink_pkey" PRIMARY KEY (id);


--
-- Name: Division Division_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Division"
    ADD CONSTRAINT "Division_pkey" PRIMARY KEY (id);


--
-- Name: DurationTemplate DurationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DurationTemplate"
    ADD CONSTRAINT "DurationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: FormSubmission FormSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Form Form_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Form"
    ADD CONSTRAINT "Form_pkey" PRIMARY KEY (id);


--
-- Name: Meeting Meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY (id);


--
-- Name: ParticipantLocation ParticipantLocation_meetingId_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParticipantLocation"
    ADD CONSTRAINT "ParticipantLocation_meetingId_userId_key" UNIQUE ("meetingId", "userId");


--
-- Name: ParticipantLocation ParticipantLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParticipantLocation"
    ADD CONSTRAINT "ParticipantLocation_pkey" PRIMARY KEY (id);


--
-- Name: Proxy Proxy_meetingId_fromUserId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_meetingId_fromUserId_key" UNIQUE ("meetingId", "fromUserId");


--
-- Name: Proxy Proxy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_pkey" PRIMARY KEY (id);


--
-- Name: Queue Queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queue"
    ADD CONSTRAINT "Queue_pkey" PRIMARY KEY (id);


--
-- Name: ScreenConfig ScreenConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScreenConfig"
    ADD CONSTRAINT "ScreenConfig_pkey" PRIMARY KEY (id);


--
-- Name: UserExtraDivision UserExtraDivision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserExtraDivision"
    ADD CONSTRAINT "UserExtraDivision_pkey" PRIMARY KEY (id);


--
-- Name: UserExtraDivision UserExtraDivision_userId_divisionId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserExtraDivision"
    ADD CONSTRAINT "UserExtraDivision_userId_divisionId_key" UNIQUE ("userId", "divisionId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VoteProcedure VoteProcedure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteProcedure"
    ADD CONSTRAINT "VoteProcedure_pkey" PRIMARY KEY (id);


--
-- Name: VoteResult VoteResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteResult"
    ADD CONSTRAINT "VoteResult_pkey" PRIMARY KEY (id);


--
-- Name: VoteTemplate VoteTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteTemplate"
    ADD CONSTRAINT "VoteTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Vote Vote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_pkey" PRIMARY KEY (id);


--
-- Name: _MeetingDivisions _MeetingDivisions_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingDivisions"
    ADD CONSTRAINT "_MeetingDivisions_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _MeetingParticipants _MeetingParticipants_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingParticipants"
    ADD CONSTRAINT "_MeetingParticipants_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: DeviceLink_deviceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeviceLink_deviceId_key" ON public."DeviceLink" USING btree ("deviceId");


--
-- Name: DeviceLink_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeviceLink_userId_key" ON public."DeviceLink" USING btree ("userId");


--
-- Name: FormSubmission_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormSubmission_createdAt_idx" ON public."FormSubmission" USING btree ("createdAt");


--
-- Name: FormSubmission_formId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormSubmission_formId_idx" ON public."FormSubmission" USING btree ("formId");


--
-- Name: Form_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Form_isActive_idx" ON public."Form" USING btree ("isActive");


--
-- Name: Form_ownerChatId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Form_ownerChatId_idx" ON public."Form" USING btree ("ownerChatId");


--
-- Name: Proxy_meetingId_toUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Proxy_meetingId_toUserId_idx" ON public."Proxy" USING btree ("meetingId", "toUserId");


--
-- Name: Queue_meetingId_type_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Queue_meetingId_type_position_idx" ON public."Queue" USING btree ("meetingId", type, "position");


--
-- Name: Queue_meetingId_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Queue_meetingId_type_status_idx" ON public."Queue" USING btree ("meetingId", type, status);


--
-- Name: Queue_meetingId_userId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Queue_meetingId_userId_type_key" ON public."Queue" USING btree ("meetingId", "userId", type);


--
-- Name: ScreenConfig_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ScreenConfig_type_key" ON public."ScreenConfig" USING btree (type);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_televicExternalId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_televicExternalId_key" ON public."User" USING btree ("televicExternalId");


--
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: _MeetingDivisions_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_MeetingDivisions_B_index" ON public."_MeetingDivisions" USING btree ("B");


--
-- Name: _MeetingParticipants_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_MeetingParticipants_B_index" ON public."_MeetingParticipants" USING btree ("B");


--
-- Name: AgendaItem AgendaItem_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AgendaItem"
    ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AgendaItem AgendaItem_speakerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AgendaItem"
    ADD CONSTRAINT "AgendaItem_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DeviceLink DeviceLink_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceLink"
    ADD CONSTRAINT "DeviceLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FormSubmission FormSubmission_formId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormSubmission"
    ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES public."Form"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Meeting Meeting_voteProcedureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_voteProcedureId_fkey" FOREIGN KEY ("voteProcedureId") REFERENCES public."VoteProcedure"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ParticipantLocation ParticipantLocation_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParticipantLocation"
    ADD CONSTRAINT "ParticipantLocation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON DELETE CASCADE;


--
-- Name: ParticipantLocation ParticipantLocation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParticipantLocation"
    ADD CONSTRAINT "ParticipantLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: Proxy Proxy_fromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: Proxy Proxy_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON DELETE CASCADE;


--
-- Name: Proxy Proxy_toUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: Queue Queue_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queue"
    ADD CONSTRAINT "Queue_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Queue Queue_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queue"
    ADD CONSTRAINT "Queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VoteResult VoteResult_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteResult"
    ADD CONSTRAINT "VoteResult_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VoteResult VoteResult_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteResult"
    ADD CONSTRAINT "VoteResult_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VoteResult VoteResult_procedureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteResult"
    ADD CONSTRAINT "VoteResult_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES public."VoteProcedure"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Vote Vote_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vote Vote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vote Vote_voteResultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_voteResultId_fkey" FOREIGN KEY ("voteResultId") REFERENCES public."VoteResult"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _MeetingDivisions _MeetingDivisions_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingDivisions"
    ADD CONSTRAINT "_MeetingDivisions_A_fkey" FOREIGN KEY ("A") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _MeetingDivisions _MeetingDivisions_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingDivisions"
    ADD CONSTRAINT "_MeetingDivisions_B_fkey" FOREIGN KEY ("B") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _MeetingParticipants _MeetingParticipants_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingParticipants"
    ADD CONSTRAINT "_MeetingParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _MeetingParticipants _MeetingParticipants_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_MeetingParticipants"
    ADD CONSTRAINT "_MeetingParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

