-- 학습 세션 기록 테이블
CREATE TABLE public.learning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  expressions_learned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 배운 표현 저장 테이블
CREATE TABLE public.learned_expressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  english TEXT NOT NULL,
  korean TEXT NOT NULL,
  example_sentence TEXT,
  category TEXT NOT NULL,
  learned_count INTEGER DEFAULT 1,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 출석 기록 테이블
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  session_count INTEGER DEFAULT 1,
  total_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 학습 통계 테이블
CREATE TABLE public.learning_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  total_expressions_learned INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화 (공개 앱이므로 모든 접근 허용)
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_expressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_stats ENABLE ROW LEVEL SECURITY;

-- 공개 읽기/쓰기 정책 (인증 없이 사용 가능)
CREATE POLICY "Allow all access to learning_sessions" ON public.learning_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to learned_expressions" ON public.learned_expressions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to learning_stats" ON public.learning_stats FOR ALL USING (true) WITH CHECK (true);

-- 초기 통계 레코드 생성
INSERT INTO public.learning_stats (id) VALUES (gen_random_uuid());