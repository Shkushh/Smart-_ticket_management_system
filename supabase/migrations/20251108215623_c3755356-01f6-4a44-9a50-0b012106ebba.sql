-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'agent');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open' NOT NULL,
  priority ticket_priority DEFAULT 'medium' NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  agent_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create ticket_updates table for tracking status changes
CREATE TABLE public.ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  old_status ticket_status,
  new_status ticket_status NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on ticket_updates
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Agents can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for tickets
CREATE POLICY "Customers can view their own tickets"
  ON public.tickets FOR SELECT
  USING (
    auth.uid() = customer_id OR
    public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Customers can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    public.has_role(auth.uid(), 'customer')
  );

CREATE POLICY "Agents can update tickets"
  ON public.tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for ticket_updates
CREATE POLICY "Users can view updates for their tickets"
  ON public.ticket_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_updates.ticket_id
      AND (tickets.customer_id = auth.uid() OR public.has_role(auth.uid(), 'agent'))
    )
  );

CREATE POLICY "Agents can create ticket updates"
  ON public.ticket_updates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'agent'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;